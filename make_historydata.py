import json
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
import os
import asyncio
from datetime import datetime

from script_making.history_map import (
    check_planet_stats_for_change,
    derive_decay_names,
    group_events_by_timestamp,
    update_waypoints,
)
from script_making.md_log import make_markdown_log
from script_making.models import (
    GameSubEvent,
    GameEvent,
    PlanetStatic,
    PlanetState,
    DaysObject,
    GalaxyStates,
)
from script_making.json_file_utils import (
    check_and_load_json,
    save_json_data,
    load_event_types,
)
from script_making.logs import setup_logger
from script_making.dbload import fetch_entries_by_dayval


import os
import sys

import logging
import logging.handlers

from hd2json.jsonutils import load_and_merge_json_files
import sqlite3

from script_making.web_utils import get_game_stat_at_time, get_web_file
from script_making.format_utils import (
    enote,
    extract_biome_change_details,
    extract_mo_details,
    get_event_type,
    get_faction,
    get_planet,
    get_unique_sectors,
    make_day_obj,
    sort_event_type,
    update_defenses,
)

setup_logger()

logger = logging.getLogger("StatusLogger")
# Define the database file
DATABASE_FILE = "./src/data/gen_data/alltimedata.db"

MAX_HOUR_DISTANCE = 6
MIN_HOUR_CHANGE = 2


# Create allplanet.json if not done already
vjson = load_and_merge_json_files("./hd2json/planets/")
json.dump(vjson, open("allplanet.json", "w+", encoding="utf8"), indent=4)

is_redirected = not sys.stdout.isatty()
if is_redirected:
    is_power_shell = len(os.getenv("PSModulePath", "").split(os.pathsep)) >= 3
    if is_power_shell:
        sys.stdout.reconfigure(encoding="utf-16")
    else:
        sys.stdout.reconfigure(encoding="utf-8")


def format_event_obj() -> None:
    """Using the dictionary at out.json,
    determine the type of each event and the event parameters using the
    event text strings."""

    days_out = DaysObject(**check_and_load_json("./src/data/gen_data/out.json"))
    allplanets = check_and_load_json("./allplanet.json")
    planets_Dict = allplanets["planets"]
    planets_Dict2 = {planet["name"]: key for key, planet in planets_Dict.items()}

    for k1 in planets_Dict2:
        for k2 in planets_Dict2:
            if k1.upper() != k2.upper() and k1.upper() in k2.upper():
                logger.warning(f"'{k1}' is a substring of '{k2}'")
    sectors = get_unique_sectors(planets_Dict)

    defenses: Dict[str, str] = {}
    days_out.events.sort(key=lambda event: event.timestamp)  # pylint: disable=no-member
    monitoring = False
    lasttime = None
    newevents = []
    event_type_sort = {"unknown": []}
    event_types = load_event_types("event_types.json")
    for event in days_out.events:
        text = event.text
        event.planet = get_planet(planets_Dict2, text)
        event.type, match = get_event_type(text, event_types)

        print(event.text, event.time, event.planet, event.type)
        logger.info(
            "Text: %s, Time: %s, Planet: %s, Type: %s",
            event.text,
            event.time,
            event.planet,
            event.type,
        )
        if monitoring:
            newevents, lasttime = monitor_event(event, lasttime, newevents)
        if event.type == "warhistoryapilaunch":
            monitoring = True

        lasttime = datetime.fromtimestamp(event.timestamp, tz=timezone.utc)
        event.faction = get_faction(text)

        event_type_sort = sort_event_type(event, text, match, sectors, event_type_sort)

        if event.planet:
            defenses = update_defenses(event, defenses)

    days_out.events.extend(newevents)
    days_out.events.sort()
    save_json_data(
        "./src/data/gen_data/out2.json", days_out.model_dump(warnings="error")
    )
    with open("./src/data/gen_data/typesort.json", "w", encoding="utf8") as json_file:
        json.dump(event_type_sort, json_file, indent=2, sort_keys=True, default=str)


def monitor_event(
    event: GameEvent, lasttime: datetime, newevents: List[GameEvent]
) -> Tuple[List[GameEvent], datetime]:
    """Add events between between two timestamps if the distance is great enough."""
    time = datetime.fromtimestamp(event.timestamp, tz=timezone.utc)
    time = time - timedelta(minutes=time.minute)
    lasttime = lasttime - timedelta(minutes=lasttime.minute)
    while (time - lasttime) > timedelta(hours=MIN_HOUR_CHANGE):
        timestamp = lasttime + timedelta(
            hours=(MIN_HOUR_CHANGE - lasttime.hour % MIN_HOUR_CHANGE),
            minutes=(60 - lasttime.minute) % 60,
        )
        dayval = (timestamp - datetime(2024, 2, 7, 9, 0, tzinfo=timezone.utc)).days

        new_evt = GameEvent(
            text="Monitoring",
            timestamp=timestamp.timestamp(),
            time=timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            day=dayval,
            planet=[],
            faction=0,
            type="monitor",
        )
        newevents.append(new_evt)
        lasttime = timestamp
    return newevents, lasttime


hashlists = {}
valid_waypoints = {0: []}


async def get_planet_stats(
    conn, ne: GameEvent, all_times_new: Dict[str, Dict[str, Any]], march_5th: datetime
) -> Dict[int, Dict[str, Any]]:
    """Retrieve the current planet status if present."""
    timestamp = str(ne.timestamp)
    dc = str(int(ne.day) // 30)
    cursor = conn.cursor()

    if dc not in all_times_new:
        ents = fetch_entries_by_dayval(conn, dc)
        for k in list(all_times_new.keys()):
            all_times_new.pop(k)
        all_times_new[dc] = ents

    if timestamp not in all_times_new[dc]:
        time = datetime.fromtimestamp(ne.timestamp, tz=timezone.utc)

        if time > march_5th:
            print(f"{ne.time} fetching game data for time {timestamp}")
            logger.info(f"{ne.time} fetching game data for time {timestamp}")
            planetstats = await get_game_stat_at_time(time)
            for pindex, details in planetstats.items():
                cursor.execute(
                    """
                INSERT INTO alltimedata (timestamp, dayval,pindex, warID, health, owner, regenPerSecond, players)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        str(timestamp),
                        str(dc),
                        int(pindex),
                        int(details["warId"]),
                        int(details["health"]),
                        int(details["owner"]),
                        float(details["regenPerSecond"]),
                        int(details["players"]),
                    ),
                )
            conn.commit()
            print("fetch complete")
            all_times_new[dc][timestamp] = planetstats
        else:
            all_times_new[dc][timestamp] = {}
    else:
        pass

    planetstats = all_times_new[dc][timestamp]
    return planetstats


def update_planet_stats(
    planetclone: Dict[str, PlanetState], planetstats: Dict[int, Dict[str, Any]]
) -> None:
    """Update HP, regenPerSecond, and playercount"""

    for i, v in planetstats.items():
        if str(i) in planetclone:
            planetclone[str(i)].hp = v.get("health", 0)
            lastregen = planetclone[str(i)].r
            # if lastregen!=float(v.get("regenPerSecond", 0)):   print(f"planet {i} decay change to {lastregen}")
            planetclone[str(i)].r = float(v.get("regenPerSecond", 0))
            planetclone[str(i)].pl = enote(v.get("players", 0))


def unordered_list_hash(int_list: List[int]):
    # Initialize two hash values
    xor_hash = 0
    sum_hash = 0
    # Iterate through the given list of integers
    for num in sorted(int_list):
        # Compute the XOR for all elements in the list
        xor_hash ^= num
        # Compute the sum for all elements in the list
        sum_hash += num
    # print(xor_hash,sum_hash)
    # Return the combined hash
    # hashc = hash((xor_hash,sum_hash))
    hashc = list(sorted(int_list))
    if not hashc in valid_waypoints.values():
        valid_waypoints[len(valid_waypoints.keys())] = hashc
    for i, v in valid_waypoints.items():
        if v == hashc:
            return i
    return "ERR"


def ENCODE(CO, AT, L):
    """This is for reducing the size of historydata.
    Encode current owner, attacking, and l into an integer"""
    return (CO << 4) | (AT << 1) | L


def DECODE(number):
    """This is for reducing the size of historydata.
    Decode number into a tuple of 3 values"""
    CO = (number >> 4) & 0b111
    AT = (number >> 1) & 0b111
    L = number & 0b1
    return CO, AT, L


def initialize_planets() -> Tuple[Dict[str, Dict[str, Any]], Dict[str, Dict[str, Any]]]:
    """Open the planet data inside gen_data/sectorplanets.json,
    and create the inital galaxy state object."""
    planets: Dict[str, Dict[str, Any]] = {}

    if not os.path.exists("./src/data/gen_data/sectorplanets.json"):
        raise FileNotFoundError(
            "The file path ./src/data/gen_data/sectorplanets.json does not exist."
        )

    sectors = check_and_load_json("./src/data/gen_data/sectorplanets.json")
    temp = {}
    for _, pls in sectors.items():
        for p in pls:
            t = {
                "link": [int(w) for w in p["waypoints"]],
                "t": ENCODE(get_faction(p["currentOwner"]), 0, 0),
                "biome": p.get("biome", "unknown"),
            }
            per = {
                "name": p["name"],
                "position": p["position"],
                "sector": p["sector"],
                "index": p["index"],
            }
            planets[str(p["index"])] = PlanetStatic(**per)
            temp[str(p["index"])] = PlanetState(**t)

    return planets, temp


async def process_event(
    days_out: DaysObject,
    planets: Dict[str, PlanetState],
    laststats: Dict[int, Dict[str, Any]],
    event: GameEvent,
    index: int,
    store: Dict[str, str],
    all_times_new: Dict[str, Dict[int, Dict[str, Any]]],
) -> Dict[str, PlanetState]:
    """Process each event, extrapolating the current state of the game at each step."""
    if event.type and "Major Order" in event.type:
        result = extract_mo_details(event.text or "")
        if result:
            type_, name, case, objective = result
            event.mo_name = name
            event.mo_case = case
            event.mo_objective = objective
            store["mo"] = (
                f"{name}, {objective}" if case == "is issued" else "Awaiting orders"
            )

    event.mo = store.get("mo", "")

    if event.day not in days_out.days:
        days_out.days[int(event.day)] = int(index)
        days_out.dayind[int(event.day)] = []
    if days_out.lastday < int(event.day):
        days_out.lastday = int(event.day)
    if not int(index) in days_out.dayind[int(event.day)]:
        days_out.dayind[int(event.day)].append(int(index))

    planetclone = planets.copy()
    # Copy in last planet status
    for i, v in laststats.items():
        if str(i) in planetclone:
            planetclone[str(i)].hp = v.get("health", 0)
            planetclone[str(i)].r = float(v.get("regenPerSecond", 0))
            planetclone[str(i)].pl = enote(v.get("players", 0))

    timestamp = str(event.timestamp)
    dc = str(int(event.day) // 30)

    time = datetime.fromtimestamp(event.timestamp, tz=timezone.utc)
    planetstats = all_times_new[str(dc)][timestamp]

    update_planet_stats(planetclone, planetstats)

    if planetstats:
        laststats.update(planetstats)

    if event.planet:
        update_planet_ownership(event, planetclone)

    # event.galaxystate = planetclone
    return planetclone


def update_planet_ownership(
    event: GameEvent, planetclone: Dict[str, PlanetState]
) -> None:
    """Update planet ownership and warp links, if applicable."""
    for p in event.planet:
        name, ind = p
        ind = int(ind)
        if str(ind) not in planetclone:
            logger.warning("WARNING, %s %s Not in planetclone!", ind, name)
            continue
        dec = list(DECODE(planetclone[str(ind)].t))
        if event.type == "campaign_start":
            dec[2] = 1
        if event.type == "campaign_end":
            dec[2] = 0
        if event.type == "planet won":
            dec[0] = 1
            dec[2] = 0
        if event.type == "planet superwon":
            dec[0] = 1
            dec[2] = 0
        if event.type == "defense lost":
            dec[0] = event.faction
            dec[1] = 0
            dec[2] = 0
        if event.type == "planet flip":
            dec[0] = event.faction
        if event.type == "defense start":
            dec[1] = event.faction
            dec[2] = 1
        if event.type == "defense won":
            dec[1] = 0
            dec[2] = 0
        planetclone[str(ind)].t = ENCODE(dec[0], dec[1], dec[2])
        # Warp link updates
        if "gloom" in event.type:
            if event.type == "no_gloom":
                planetclone[str(ind)].gls = None
            elif event.type == "light_gloom":
                planetclone[str(ind)].gls = 1
            elif event.type == "medium_gloom":
                planetclone[str(ind)].gls = 2
            elif event.type == "heavy_gloom":
                planetclone[str(ind)].gls = 3
            elif event.type == "gloom_border":
                planetclone[str(ind)].gls = 4

        if event.type == "Biome Change":
            _, _, _, _, _, _, slug = extract_biome_change_details(
                event.text, vjson["biomes"]
            )
            planetclone[str(ind)].biome = slug
        if event.type == "Black Hole":
            planetclone[str(ind)].biome = "blackhole"

    if event.type == "newlink":
        update_waypoints(event.planet, planetclone, add=True)

    if event.type == "destroylink":
        update_waypoints(event.planet, planetclone, add=False)

    if event.type == "clearlinks":
        for name, ind in event.planet:
            planetclone[str(ind)].link = []
            for id2 in planetclone.keys():
                if planetclone[str(ind)].link:
                    while int(id2) in planetclone[str(ind)].link:
                        planetclone[str(ind)].link.remove(int(id2))

                if planetclone[str(id2)].link:
                    while int(ind) in planetclone[str(id2)].link:
                        planetclone[str(id2)].link.remove(int(ind))


def handle_decay_events(decay):
    outtext = []
    if decay:
        decay_for_planets = {}
        for ind, o, p in decay:
            planet = vjson["planets"].get(str(ind))
            planet["owner"] = o
            if not p in decay_for_planets:
                decay_for_planets[p] = []
            if planet:
                decay_for_planets[p].append(planet)

        for decay, planets in decay_for_planets.items():
            usenames = derive_decay_names(planets, vjson)
            change = round((float(decay) * 3600) / 10000, 2)
            outtext.append(f" Decay: {change} on " + ", ".join(usenames))
            print(outtext)

    return outtext


class PlanetHistoryDelta:
    """Calculate a history delta of all changes that happened across each planet."""

    def __init__(self):
        self.hashlinks = {}
        self.resort: Dict[str, List[Dict[str, Any]]] = {}
        self.laststate = {}

    def delta_format(self, t, ptemp: Optional[Dict[str, PlanetState]]):
        """Add to the ongoing history delta."""
        for p, resa in ptemp.items():
            # Add in links to hashlinks.
            if isinstance(resa.link, list):
                link = unordered_list_hash(resa.link)
                if not link in self.hashlinks:
                    self.hashlinks[link] = resa.link
                else:
                    if sorted(resa.link) != sorted(self.hashlinks[link]):
                        logger.warning(
                            "MISMATCH: resa.link=%s, hashlinks[link]=%s",
                            resa.link,
                            self.hashlinks[link],
                        )
                resa.link2 = link
        if self.laststate:
            # Check for changes between Last state and the
            # Current temporary planet
            for p, rese in ptemp.items():
                res = rese.model_dump(warnings="error", exclude=["link"])
                if not p in self.resort:
                    self.resort[p] = []

                keys_all = list(res.keys())
                toad = {}
                for key in keys_all:
                    if key not in self.laststate[p]:
                        self.laststate[p][key] = None
                    if self.laststate[p][key] != res[key]:
                        toad[key] = res[key]
                if toad:
                    toad["eind"] = t
                    self.resort[p].append(toad)
        else:
            for p, rese in ptemp.items():
                res = rese.model_dump(warnings="error", exclude=["link"])
                if not p in self.resort:
                    self.resort[p] = [res]
                    self.resort[p][0]["eind"] = t
        self.laststate = {k: v.model_dump(warnings="error") for k, v in ptemp.items()}


class GalaxyEventProcessor:
    """Specialized processing object for the historydata.json file and galaxy_states."""

    def __init__(
        self, db_file: str, planets: Dict[str, Any], temp: Dict[str, PlanetState]
    ):
        self.conn = sqlite3.connect(db_file)
        self.planets = planets
        self.temp = temp
        self.march_5th = datetime(2024, 3, 5, 7, tzinfo=timezone.utc)
        self.all_times_new = {}
        self.store = {}
        self.laststats = {}
        self.galaxy_states = GalaxyStates(gstatic=planets, states={})
        self.phistdelta = PlanetHistoryDelta()
        self.last_time = 0
        self.newevt = []
        self.days_out = None

    def initialize_days(self, days_out_data: Dict[str, Any]):
        self.days_out = DaysObject(**days_out_data)
        self.days_out.days = {}
        self.days_out.galaxystatic = self.planets
        self.days_out.lastday = 1
        self.days_out.dayind = {}
        self.days_out.timestamps = []

    def load_days_object(self):
        days_out_data = check_and_load_json("./src/data/gen_data/out2.json")
        self.initialize_days(days_out_data)

    async def process_event_group(self, i: int, event_group: List[GameEvent]):
        elog = []
        ne = GameEvent(
            timestamp=event_group[0].timestamp,
            time=event_group[0].time,
            day=event_group[0].day,
        )
        ne.type = "m" if event_group[0].type == "monitor" else "g"
        if ne.type == "g":
            self.last_time = ne.timestamp

        planetstats = await get_planet_stats(
            self.conn, ne, self.all_times_new, self.march_5th
        )
        all_players = sum(v.get("players", 0) for v in planetstats.values())
        ne.all_players = all_players

        print(f"On event group number {i}, timestamp {ne.time}")
        logger.info(f"On event group number {i}, timestamp {ne.time}")

        ptemp = {k: v.model_copy(deep=True) for k, v in self.temp.items()}
        dc = str(int(ne.day) // 30)
        planetstats = self.all_times_new[dc][str(ne.timestamp)]
        decay, hp_checkpoint = check_planet_stats_for_change(ptemp, planetstats)
        outtext = handle_decay_events(decay)

        if ne.type == "m":
            if not self.process_monitor_event(
                event_group, ne, decay, hp_checkpoint, outtext
            ):
                return  # Skip the event group
        elif ne.type == "g" and decay and outtext:
            self.handle_decay_event(event_group, ne, outtext)

        await self.process_event_logs(event_group, ne, ptemp)
        self.phistdelta.delta_format(ne.eind, ptemp)
        self.newevt.append(ne)

    def process_monitor_event(
        self,
        event_group: List[GameEvent],
        ne: GameEvent,
        decay: bool,
        hp_checkpoint: bool,
        outtext: List[str],
    ):
        """
        The event group in question is a monitor type,
        so make sure that there's a significant enough change to actually add it.
        """
        time_since = ne.timestamp - self.last_time
        if decay:
            event_group[0].text = "" + "<br/>".join(outtext) + "\n"
            event_group[0].type = "decaychange"
            ne.type = "g"
        elif hp_checkpoint:
            event_group[0].text = "Planet HP has reached a checkpoint."
        elif time_since < MAX_HOUR_DISTANCE * 60 * 60:
            return False  # Skip event
        self.last_time = ne.timestamp
        return True

    def handle_decay_event(
        self, event_group: List[GameEvent], ne: GameEvent, outtext: List[str]
    ):
        """Add a new decaychange event based on the given event group."""
        decay_event = GameEvent(
            timestamp=event_group[0].timestamp,
            time=event_group[0].time,
            day=event_group[0].day,
            type="decaychange",
            text="" + "<br/>".join(outtext) + "\n",
        )
        event_group.append(decay_event)

    async def process_event_logs(
        self, event_group: List[GameEvent], ne: GameEvent, ptemp: Dict[str, Any]
    ):
        """Turn each event in event_group into a GameSubEvent"""
        elog = []
        if int(ne.timestamp) not in self.days_out.timestamps:
            self.days_out.timestamps.append(int(ne.timestamp))
        ne.eind = self.days_out.timestamps.index(int(ne.timestamp))

        for event in event_group:
            ptemp = await process_event(
                self.days_out,
                ptemp,
                self.laststats,
                event,
                ne.eind,
                self.store,
                self.all_times_new,
            )
            elog.append(
                GameSubEvent(
                    planet=event.planet,
                    text=event.text,
                    type=event.type,
                    faction=event.faction,
                )
            )
        self.temp = ptemp
        ne.log = elog
        ne.mo = self.store.get("mo", "")

    def save_results(self):
        """Save Results"""
        print("Saving galaxy states.")
        logger.info("Saving galaxy states.")
        galaxy_states_dump = self.galaxy_states.model_dump(warnings="error")
        save_json_data("./src/data/gstates.json", galaxy_states_dump)
        save_json_data("./src/data/resort.json", self.phistdelta.resort, indent=3)
        markdowncode = make_markdown_log(self.days_out)
        with open("./src/history_log_full.md", "w", encoding="utf8") as file:
            file.write(markdowncode)
        logger.info("Saving data")
        print("Saving data")
        history_dump = self.days_out.model_dump(exclude_none=True, warnings="error")
        save_json_data("./src/data/historydata.json", history_dump)

    async def run(self):
        self.load_days_object()
        grouped_events = group_events_by_timestamp(self.days_out)
        i = 0
        while grouped_events:
            event_group = grouped_events.pop(0)
            await self.process_event_group(i, event_group)
            i += 1

        # for i, event_group in enumerate(grouped_events):
        #    await self.process_event_group(i, event_group)

        self.days_out.events = self.newevt
        self.galaxy_states.states = {}
        self.galaxy_states.gstate = self.phistdelta.resort
        self.galaxy_states.links = self.phistdelta.hashlinks
        self.save_results()
        self.conn.close()


async def main_code():
    planets, temp = initialize_planets()
    processor = GalaxyEventProcessor(DATABASE_FILE, planets, temp)
    await processor.run()


if not os.path.exists("./src/data/gen_data"):
    os.makedirs("./src/data/gen_data", exist_ok=True)
    raise FileNotFoundError("The directory ./src/data/gen_data does not exist.")


if __name__=='__main__':
    print("Starting up...")
    old_text=""

    if os.path.exists("src/data/gen_data/lasttext.md"):
        with open("src/data/gen_data/lasttext.md", "r", encoding="utf-8") as file:
            old_text = file.read()
    get_web_file()
    text = open("./src/data/gen_data/text.md", "r", encoding="utf8").read()
    if text!=old_text:
        make_day_obj(text)
        format_event_obj()
        asyncio.run(main_code())
        with open("src/data/gen_data/lasttext.md", "w", encoding="utf-8") as file:
            file.write(text)

        
    else:
        print("NO CHANGE DETECTED.  SKIPPING.")
