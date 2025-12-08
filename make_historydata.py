import json
import re
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict
from datetime import datetime, timezone, timedelta
import os
import asyncio
import argparse

from script_making.history_map import (
    check_planet_stats_for_change,
    check_region_stats_dict_for_change,
    check_region_stats_for_change,
    derive_decay_names,
    group_events_by_timestamp,
    update_waypoints,
    check_planet_stats_dict_for_change,
)
from script_making.md_log import make_markdown_log
from script_making.models import (
    GameEventGroup,
    GameSubEvent,
    GameEvent,
    PlanetRegion,
    PlanetStatic,
    PlanetState,
    DaysObject,
    GalaxyStates,
    MyEffects,
    GalacticEffect,
)
from script_making.json_file_utils import (
    check_and_load_json,
    save_json_compressed,
    save_json_data,
    load_event_types,
)
from script_making.logs import setup_logger
from script_making.dbload import (
    RegionStatusDays,
    RegionStatusDict,
    fetch_entries_by_dayval,
    PlanetStatusDict,
    PlanetStatusDays,
    fetch_entries_by_interval,
    fetch_entries_by_timestamp,
    fetch_region_entries_by_closest_interval,
    fetch_region_entries_by_dayval,
    migrate_tables,
)


import sys

import logging
import logging.handlers

from hd2api import load_and_merge_json_files
import sqlite3

from script_making.web_utils import get_game_stat_at_time, get_web_file
from script_making.format_utils import (
    enote,
    extract_assault_division,
    extract_biome_change_details,
    extract_mo_details,
    extract_poi_details,
    get_event_type,
    get_faction,
    get_planet,
    get_region,
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
CLUSTER_SIZE = 2048

# Create allplanet.json if not done already
vjson = load_and_merge_json_files("planets", "./hd2json")
json.dump(vjson, open("allplanet.json", "w+", encoding="utf8"), indent=4)
ejson = MyEffects(**check_and_load_json("./myeffects.json"))

extraplanets=defaultdict(list)

is_redirected = not sys.stdout.isatty()
if is_redirected:
    is_power_shell = len(os.getenv("PSModulePath", "").split(os.pathsep)) >= 3
    if is_power_shell:
        sys.stdout.reconfigure(encoding="utf-16")
    else:
        sys.stdout.reconfigure(encoding="utf-8")


async def handle_monitoring(
    conn: sqlite3.Connection,
    event_set: List[GameEvent],
    newevents: List[GameEvent],
    all_times_new: PlanetStatusDays,
    march_5th: datetime,
    laststats: PlanetStatusDict,
) -> Tuple[PlanetStatusDict, List[GameEvent]]:
    """
    If the space between two logged events is too much,
    add events which log any changes made to the planet statuses."""
    for num, evt in enumerate(event_set):
        logger.info(f"In Between Event {num}, end time is {event_set[-1].time}")
        this_check = await get_planet_stats(conn, evt, all_times_new, march_5th)
        decay, hp = check_planet_stats_dict_for_change(laststats, this_check)
        if decay or hp:
            if decay:
                outtext = handle_decay_events(decay)
                evt.text = "" + "<br/>".join(outtext) + "\n"
                evt.type = "decaychange"
            elif hp:
                # whenever the lib% is divisible by 25
                evt.text = "HP reached a checkpoint."
            newevents.append(evt)
            laststats = this_check.copy()
    return laststats, newevents


async def handle_region_monitoring(
    conn: sqlite3.Connection,
    event_set: List[GameEvent],
    newevents: List[GameEvent],
    all_times_new: PlanetStatusDays,
    march_5th: datetime,
    laststats: PlanetStatusDict,
) -> Tuple[PlanetStatusDict, List[GameEvent]]:
    """
    If the space between two logged events is too much,
    add events which log any changes made to the planet region statuses."""
    for evt in event_set:
        this_check = await get_region_stats(conn, evt, all_times_new, march_5th)
        decay, hp = check_region_stats_dict_for_change(laststats, this_check)
        if decay or hp:
            if decay:
                outtext = handle_region_decay_events(decay)
                evt.text = "" + "<br/>".join(outtext) + "\n"
                evt.type = "decaychange_region"
            elif hp:
                # whenever the lib% is divisible by 25
                evt.text = "HP reached a checkpoint."
            newevents.append(evt)
            laststats = this_check.copy()
    return laststats, newevents


async def handle_planet_stats(
    conn: sqlite3.Connection,
    event: GameEvent,
    newevents: List[GameEvent],
    all_times_new: PlanetStatusDays,
    march_5th: datetime,
    laststats: PlanetStatusDict,
) -> Tuple[PlanetStatusDict, List[GameEvent]]:
    """Get the planet stats, add events if needed."""

    planetstats = await get_planet_stats(conn, event, all_times_new, march_5th)
    decay, _ = check_planet_stats_dict_for_change(laststats, planetstats)
    if decay:
        outtext = handle_decay_events(decay)
        ne = GameEvent(
            timestamp=event.timestamp,
            time=event.time,
            day=event.day,
            type="decaychange",
            text="" + "<br/>".join(outtext) + "\n",
        )
        newevents.append(ne)

    laststats = planetstats.copy()
    return laststats, newevents


async def handle_region_stats(
    conn: sqlite3.Connection,
    event: GameEvent,
    newevents: List[GameEvent],
    all_times_new: RegionStatusDays,
    march_5th: datetime,
    laststats: RegionStatusDict,
) -> Tuple[RegionStatusDict, List[GameEvent]]:
    """
    This functions checks for significant changes in region status.
    """
    regionstats = await get_region_stats(conn, event, all_times_new, march_5th)
    decay, _ = check_region_stats_dict_for_change(laststats, regionstats)
    if decay:
        outtext = handle_region_decay_events(decay)
        ne = GameEvent(
            timestamp=event.timestamp,
            time=event.time,
            day=event.day,
            type="decaychange_region",
            text="" + "<br/>".join(outtext) + "\n",
        )
        newevents.append(ne)

    laststats = regionstats.copy()
    return laststats, newevents


async def process_war_history_launch(
    conn: sqlite3.Connection,
    event: GameEvent,
    newevents: List[GameEvent],
    all_times_new: PlanetStatusDays,
    march_5th: datetime,
) -> Tuple[PlanetStatusDict, List[GameEvent]]:
    laststats = await get_planet_stats(conn, event, all_times_new, march_5th)
    decay, _ = check_planet_stats_dict_for_change({}, laststats)
    if decay:
        outtext = handle_decay_events(decay)
        ne = GameEvent(
            timestamp=event.timestamp,
            time=event.time,
            day=event.day,
            type="decaychange",
            text="" + "<br/>".join(outtext) + "\n",
        )
        newevents.append(ne)
    return laststats, newevents


async def format_event_obj() -> None:
    """Using the dictionary at out.json,
    determine the type of each event and the event parameters using the
    event text strings."""

    days_out = DaysObject(**check_and_load_json("./src/data/gen_data/out.json"))
    allplanets = check_and_load_json("./allplanet.json")
    planets_Dict = allplanets["planets"]
    allregions = allplanets["planetRegion"]
    # map sectors to planets.
    sector_dict = {}
    for key, planet in planets_Dict.items():
        sect = planet["sector"]
        if sect not in sector_dict:
            sector_dict[sect] = []
        sector_dict[sect].append(planet["name"])

    planets_Dict2 = {planet["name"]: key for key, planet in planets_Dict.items()}
    conn = sqlite3.connect(DATABASE_FILE)
    migrate_tables(conn)

    for k1 in planets_Dict2:
        for k2 in planets_Dict2:
            if k1.upper() != k2.upper() and k1.upper() in k2.upper():
                logger.warning(f"'{k1}' is a substring of '{k2}'")
    sectors = get_unique_sectors(planets_Dict)
    all_times_new = {}
    all_region_times_new = {}

    defenses: Dict[str, str] = {}
    days_out.events_all.sort(key=lambda event: event.timestamp)  # pylint: disable=no-member
    monitoring = False
    march_5th = None
    lasttime = None
    newevents = []
    event_type_sort = {"unknown": []}
    event_types = load_event_types("event_types.json")
    laststats = None
    lastregionstats = None
    lastdss = None
    for event in days_out.events_all:
        text = event.text
        event.planet = get_planet(planets_Dict2, text)
        
        event.type, match = get_event_type(text, event_types)
        event.region = get_region(allregions, text)

        print(event.text, event.time, event.planet, event.type)
        logger.info(
            "Text: %s, Time: %s, Planet: %s, Region: %s,Type: %s",
            event.text,
            event.time,
            event.planet,
            event.region,
            event.type,
        )
        
        if event.type =="planet added":
            print(event.planet)
            name,id=event.planet[0]
            planetv=planets_Dict[id]

            addme={
                "name": planetv['name'],
                "position": {
                    "x": -1,
                    "y": -1,
                },
                "sector": planetv['sector'],
                "index": planetv['index'],
                "currentOwner": "Humans",
                "waypoints": [ ],
                "event": False,
                "biome": "moor_baseplanet"
            }
            extraplanets[event.planet['sector']].append(addme)
        if monitoring:
            event_set, last_time = monitor_event(event, lasttime, [])
            if last_time.replace(tzinfo=timezone.utc) >= datetime.now(timezone.utc):
                logger.error("ERROR!  LAST TIME IS TOO BIG!")
                raise Exception("Too big time.")
            laststats, newevents = await handle_monitoring(
                conn, event_set, newevents, all_times_new, march_5th, laststats
            )
            logger.info(
                "Fetching Stats for Text: %s, Time: %s, Planet: %s, Region: %s,Type: %s",
                event.text,
                event.time,
                event.planet,
                event.region,
                event.type,
            )
            laststats, newevents = await handle_planet_stats(
                conn, event, newevents, all_times_new, march_5th, laststats
            )
            # Regions.
            lastregionstats, newevents = await handle_region_monitoring(
                conn,
                event_set,
                newevents,
                all_region_times_new,
                march_5th,
                lastregionstats,
            )
            lastregionstats, newevents = await handle_region_stats(
                conn,
                event,
                newevents,
                all_region_times_new,
                march_5th,
                lastregionstats,
            )

        if event.type == "warhistoryapilaunch":
            monitoring = True
            march_5th = datetime.fromtimestamp(event.timestamp, tz=timezone.utc)
            laststats, newevents = await process_war_history_launch(
                conn, event, newevents, all_times_new, march_5th
            )
            lastregionstats = {}
        if event.type == "clear_sector_links":
            sectors_in_text = [sector for sector in sectors if sector in event.text]
            ext = ""
            for s, i in sector_dict.items():
                if s in sectors_in_text:
                    ext += " ".join(i)
            event.planet = get_planet(planets_Dict2, ext)
            print(ext, event.planet)
            logger.info("%s, %s", ext, event.planet)
            event.type = "clearlinks"
        if event.type == "dss_move":
            event.last_dss_planet = lastdss
            lastdss = event.planet

        lasttime = datetime.fromtimestamp(event.timestamp, tz=timezone.utc)
        event.faction = get_faction(text)
        event_type_sort = sort_event_type(event, text, match, sectors, event_type_sort)
        if event.planet:
            defenses = update_defenses(event, defenses)

    days_out.events_all.extend(newevents)
    days_out.events_all.sort()

    save_json_data(
        "./src/data/gen_data/out2.json", days_out.model_dump(warnings="error")
    )
    with open("./src/data/gen_data/typesort.json", "w", encoding="utf8") as json_file:
        json.dump(event_type_sort, json_file, indent=2, sort_keys=True, default=str)
    conn.close()


def monitor_event(
    event: GameEvent, lasttime: datetime, newevents: List[GameEvent]
) -> Tuple[List[GameEvent], datetime]:
    """Add events between between two timestamps if the distance is great enough."""
    right_now = datetime.now()
    time = datetime.fromtimestamp(event.timestamp, tz=timezone.utc)
    time = time - timedelta(minutes=time.minute)
    lasttime = lasttime - timedelta(minutes=lasttime.minute)
    new_events = []
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
        new_events.append(new_evt)
        lasttime = timestamp
    new_events.sort(key=lambda event: event.timestamp)
    return new_events, lasttime


hashlists = {}
valid_waypoints = {0: []}


async def get_planet_stats(
    conn, ne: GameEvent, all_times_new: PlanetStatusDays, march_5th: datetime
) -> Dict[int, Dict[str, Any]]:
    """Retrieve the current planet status if present."""
    timestamp = str(ne.timestamp)
    dc = str(int(ne.day) // 30)

    if dc not in all_times_new:
        ents = fetch_entries_by_dayval(conn, dc)
        for k in list(all_times_new.keys()):
            if k != str(int(dc) - 1) and k != str(int(dc) + 1):
                all_times_new.pop(k)
        all_times_new[dc] = ents
    interval = int(float(timestamp)) // 900
    if interval not in all_times_new[dc]:
        time = datetime.fromtimestamp(ne.timestamp, tz=timezone.utc)
        if time > march_5th:
            checkv = fetch_entries_by_interval(conn, float(ne.timestamp))
            if checkv:
                print(
                    f"{timestamp} not found in all_times_new[{dc}] but WAS found in db"
                )

                logger.info(
                    f"{timestamp} not found in all_times_new[{dc}] but WAS found in db"
                )
                all_times_new[dc][interval] = checkv
                planetstats = all_times_new[dc][interval]
                return planetstats
        print(f"{timestamp} not found in all_times_new[{dc}]")
        logger.info(f"{timestamp} not found in all_times_new[{dc}]")

        if time > march_5th:
            print(f"{ne.time} fetching game data for time {timestamp}")
            logger.info(f"{ne.time} fetching game data for time {timestamp}")
            planetstats = await get_game_stat_at_time(time)

            cursor = conn.cursor()
            for pindex, details in planetstats.items():
                cursor.execute(
                    """
                INSERT OR REPLACE INTO alltimedata (timestamp, dayval, pindex, warID, health, owner, regenPerSecond, players,interval)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                        int(float(timestamp)) // 900,
                    ),
                )

            conn.commit()
            checkv = fetch_entries_by_timestamp(conn, str(timestamp))
            if not checkv:
                print("COULD NOT ADD TO DATABASE.")
                logger.info("COULD NOT ADD TO DATABASE.")
            all_times_new[dc][interval] = planetstats
        else:
            all_times_new[dc][interval] = {}
    else:
        pass

    planetstats = all_times_new[dc][interval]
    return planetstats


async def get_region_stats(
    conn, ne: GameEvent, all_times_new: PlanetStatusDays, march_5th: datetime
) -> Dict[int, Dict[str, Any]]:
    """Retrieve the current planet region status if present."""
    timestamp = str(ne.timestamp)
    dc = str(int(ne.day) // 30)
    if int(dc) < 15:
        all_times_new[dc] = {}

        interval = int(float(timestamp)) // 900
        all_times_new[dc][interval] = {}
        return {}

    if dc not in all_times_new:
        ents = fetch_region_entries_by_dayval(conn, dc)
        for k in list(all_times_new.keys()):
            if k != str(int(dc) - 1) and k != str(int(dc) + 1):
                all_times_new.pop(k)
        all_times_new[dc] = ents
    interval = int(float(timestamp)) // 900
    if interval not in all_times_new[dc]:
        time = datetime.fromtimestamp(ne.timestamp, tz=timezone.utc)
        if time > march_5th:
            checkv = fetch_region_entries_by_closest_interval(conn, float(ne.timestamp))
            if checkv:
                print(
                    f"{timestamp} not found in all_region_times_new[{dc}] but WAS found in db"
                )

                logger.info(
                    f"{timestamp} not found in all_region_times_new[{dc}] but WAS found in db"
                )
                all_times_new[dc][interval] = checkv
                planetstats = all_times_new[dc][interval]
                return planetstats
        # print(f"{timestamp} not found in all_region_times_new[{dc}], but that's ok!")
        logger.info(f"{timestamp} not found in all_region_times_new[{dc}]")

        all_times_new[dc][interval] = {}
    else:
        pass

    planetstats = all_times_new[dc][interval]
    return planetstats


def update_planet_stats(
    planetclone: Dict[str, PlanetState],
    planetstats: PlanetStatusDict,
    regionstats: RegionStatusDict,
) -> None:
    """Update HP, regenPerSecond, and playercount"""

    for i, v in planetstats.items():
        if str(i) in planetclone:
            planetclone[str(i)].hp = int(v.get("health", 0))
            lastregen = planetclone[str(i)].r
            # if lastregen!=float(v.get("regenPerSecond", 0)):   print(f"planet {i} decay change to {lastregen}")
            planetclone[str(i)].r = float(v.get("regenPerSecond", 0))
            planetclone[str(i)].pl = enote(int(v.get("players", 0)))

    # Update the Planet's Regions.
    for i, v in regionstats.items():
        pindex, rindex = i.split("_")
        print(pindex, rindex, str(pindex) in planetclone)
        if str(pindex) in planetclone:
            print(pindex, rindex, str(rindex) in planetclone[str(pindex)].regions)
            if str(rindex) in planetclone[str(pindex)].regions:
                planetclone[str(pindex)].regions[str(rindex)].hp = int(
                    v.get("health", 0)
                )
                planetclone[str(pindex)].regions[str(rindex)].r = float(
                    v.get("regenPerSecond", 0)
                )
            else:
                planetclone[str(pindex)].regions[str(rindex)] = PlanetRegion(
                    index=int(pindex),
                    name=rindex,
                    hp=v.get("health", 0),
                    r=float(v.get("regenPerSecond", 0)),
                    t=ENCODE(v["owner"], 0, 0),
                )
                # planetclone[str(i)].regions[str(rindex)].pl = enote(v.get("players", 0))


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
    if hashc not in valid_waypoints.values():
        valid_waypoints[len(valid_waypoints.keys())] = hashc
    for i, v in valid_waypoints.items():
        if v == hashc:
            return i
    return "ERR"


def get_effect(site: str) -> Optional[GalacticEffect]:
    max_shared_len = 0
    best_pair = None
    besteff = None
    for sdg, eff in ejson.planetEffects.items():
        name_upper = eff.name.upper()
        if name_upper == site.upper():
            return eff
        if site.upper() in name_upper or name_upper in site.upper():
            site_upper = site.upper()
            shared_len = min(len(site_upper), len(name_upper))
            if shared_len > max_shared_len:
                max_shared_len = shared_len
                best_pair = (eff, site)
                besteff = eff
    return besteff


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
    and create the inital galaxy s tate object."""
    planets: Dict[str, Dict[str, Any]] = {}

    if not os.path.exists("./src/data/gen_data/sectorplanets.json"):
        raise FileNotFoundError(
            "The file path ./src/data/gen_data/sectorplanets.json does not exist."
        )

    sectors = check_and_load_json("./src/data/gen_data/sectorplanets.json")
    for sector, listv in extraplanets.items():
        for p in listv:
            sectors[sector].append(p)
    temp = {}
    for _, pls in sectors.items():
        for p in pls:
            t = {
                "link": [int(w) for w in p["waypoints"]],
                "t": ENCODE(get_faction(p["currentOwner"]), 0, 0),
                "biome": p.get("biome", "unknown"),
                "position": p["position"],
            }
            per = {
                "name": p["name"],
                "sector": p["sector"],
                "index": p["index"],
            }
            planets[str(p["index"])] = PlanetStatic(**per)
            temp[str(p["index"])] = PlanetState(**t)

    return planets, temp


async def process_event(
    days_out: DaysObject,
    planets: Dict[str, PlanetState],
    laststats: PlanetStatusDict,
    lastregionstats: RegionStatusDict,
    event: GameEvent,
    index: int,
    store: Dict[str, Any],
    all_times_new: PlanetStatusDays,
    all_region_times_new: RegionStatusDays,
) -> Dict[str, PlanetState]:
    """Process each event, extrapolating the current state of the game at each step."""
    if event.type and ("Major Order" in event.type or "Minor Order" in event.type):
        result = extract_mo_details(event.text or "")
        if result:
            type_, name, case, objective = result
            pattern = r"(A\d+-(?:1[0-2]|[1-9])-\d+)"
            event.mo_name = name
            matches = re.findall(pattern, name)
            for match in matches:
                event.mo_id = match
            event.mo_case = case
            event.mo_objective = objective
            mostr = f"{event.mo_id}, {name}, {objective}"
            if "mo" not in store:
                store["mo"] = {}
            if case == "is issued":
                store["mo"][event.mo_id] = mostr
            else:
                store["mo"].pop(event.mo_id)
    mov = ",".join(f"{k}:{v}" for k, v in store.get("mo", {}).items())
    event.mo = mov

    if event.day not in days_out.days:
        days_out.days[int(event.day)] = int(index)
    #    days_out.dayind[int(event.day)] = []
    if days_out.lastday < int(event.day):
        days_out.lastday = int(event.day)
    # if not int(index) in days_out.dayind[int(event.day)]:
    #    days_out.dayind[int(event.day)].append(int(index))

    planetclone = planets.copy()
    # Copy in last planet status
    for i, v in laststats.items():
        if str(i) in planetclone:
            planetclone[str(i)].hp = v.get("health", 0)
            planetclone[str(i)].r = float(v.get("regenPerSecond", 0))
            planetclone[str(i)].pl = enote(v.get("players", 0))

    for i, v in lastregionstats.items():
        pindex, rindex = i.split("_")
        print(pindex, rindex)
        if str(pindex) in planetclone:
            if str(rindex) in planetclone[str(pindex)].regions:
                planetclone[str(pindex)].regions[str(rindex)].hp = v.get("health", 0)
                planetclone[str(pindex)].regions[str(rindex)].r = float(
                    v.get("regenPerSecond", 0)
                )
                # planetclone[str(i)].regions[str(rindex)].pl = enote(v.get("players", 0))

    timestamp = str(event.timestamp)
    dc = str(int(event.day) // 30)
    interval = int(float(timestamp)) // 900
    planetstats = all_times_new[str(dc)][interval]
    regionstats = all_region_times_new[str(dc)][interval]
    # Update planet stats and any regions stats they might have.
    update_planet_stats(planetclone, planetstats, regionstats)

    if planetstats:
        laststats.update(planetstats)
    if regionstats:
        lastregionstats.update(regionstats)

    if "Assault Division" in event.type:
        site = extract_assault_division(event.text)
        last = None
        if store.get(f"{site}Pos", None):
            last = store.get(f"{site}Pos", None)
            if event.type == "Assault Division Retreat":
                if last:
                    planetclone[last].adiv = ""
                    eff = get_effect(site)
                    if eff:
                        planetclone[last].remove_desc(eff.name)
            if event.type == "Assault Division Defeat":
                if last:
                    planetclone[last].adiv = ""
                    eff = get_effect(site)
                    if eff:
                        default = {"name": "Somewhere..."}
                        event.text += (
                            f" from {vjson['planets'].get(str(last), default)['name']}"
                        )
                        planetclone[last].remove_desc(eff.name)
    if event.planet:
        update_planet_ownership(event, planetclone, store)

    # event.galaxystate = planetclone
    return planetclone


def update_region_ownership(
    event: GameEvent,
    name: str,
    inde: int,
    planetclone: Dict[str, PlanetState],
    store: Dict[str, str],
) -> None:
    # TODO: add events for when Super Earth Captures
    # A region when it happens
    for p in event.region:
        rn, ind = p
        print(p, rn, rn not in planetclone[str(inde)].regions)
        if rn not in planetclone[str(inde)].regions:
            planetclone[str(inde)].regions[rn] = PlanetRegion(
                index=int(ind), name=rn, t=ENCODE(1, 0, 0), r=0, hp=100
            )
        dec = list(DECODE(planetclone[str(inde)].regions[rn].t))
        if event.type == "region_siege_start":
            dec[1] = event.faction
            dec[2] = 1
        if event.type == "region_siege_end":
            dec[1] = 0
            dec[2] = 0
        if event.type == "region_siege_lost":
            dec[0] = event.faction
            dec[1] = 0
            dec[2] = 0
        if event.type == "region_siege_won":
            dec[0] = event.faction
            dec[1] = 0
            dec[2] = 0
        planetclone[str(inde)].regions[rn].t = ENCODE(dec[0], dec[1], dec[2])


def update_region_owners(
    event: GameEvent,
    name: str,
    inde: int,
    planetclone: Dict[str, PlanetState],
    store: Dict[str, str],
    set_to: int = 0,
) -> None:
    # TODO: add events for when Super Earth Captures
    # A region when it happens
    for rn in planetclone[str(inde)].regions:
        dec = list(DECODE(planetclone[str(inde)].regions[rn].t))

        dec[0] = set_to
        dec[1] = 0
        dec[2] = 0
        planetclone[str(inde)].regions[rn].t = ENCODE(dec[0], dec[1], dec[2])


def update_planet_ownership(
    event: GameEvent,
    planetclone: Dict[str, PlanetState],
    store: Dict[str, str],
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
            event.faction = dec[0]
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
            dec[0] = event.faction or 0
            dec[1] = 0
            dec[2] = 0
        if event.type == "planet flip":
            dec[0] = event.faction or 0
        if event.type == "defense start":
            dec[1] = event.faction or 0
            dec[2] = 1
        if event.type == "invasion start":
            dec[1] = event.faction or 0
            dec[2] = 1

        if event.type == "defense won":
            update_region_owners(
                event, name, str(ind), planetclone, set_to=1, store=store
            )
            dec[1] = 0
            dec[2] = 0
        if event.type == "invasion won":
            dec[1] = 0
            dec[2] = 0
        if event.type == "invasion lost":
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
        if "dss_move" in event.type:
            if event.last_dss_planet:
                for m in event.last_dss_planet:
                    n, i = m
                    planetclone[str(i)].dss = ""
                    planetclone[str(i)].remove_desc("DSS")
            planetclone[str(ind)].dss = "DSS Here"
            planetclone[str(ind)].add_desc(
                "DSS",
                "A Helldiver-operated weapon of mass liberation. Paid for with the blood of soldiers and the credits of taxpayers, this technological marvel is Democracy made manifest.",
            )
        if "region" in event.type:
            update_region_ownership(event, name, ind, planetclone, store)
        if "SiteEvent" in event.type:
            site = extract_poi_details(event.text)
            if event.type == "SiteEvent built":
                eff = get_effect(site)
                if eff:
                    planetclone[str(ind)].poi = eff.icon
                    planetclone[str(ind)].add_desc(eff.name, eff.description)
            if event.type == "SiteEvent destroyed":
                eff = get_effect(site)
                if eff:
                    planetclone[str(ind)].remove_desc(eff.name)
                planetclone[str(ind)].poi = ""

        if event.type == "planet move":
            # Move to a new position.
            pattern = r"X (\d+\.\d+) Y (\d+\.\d+)"
            coordinates = re.findall(pattern, event.text)
            if coordinates:
                x, y = coordinates[0]
                planetclone[str(ind)].position.x = float(x)
                planetclone[str(ind)].position.y = float(y)
            else:
                print("No coordinates found")
                logger.info(f"{event.planet} could not find coordinates in move event.")
        ## ASSAULT DIVISION CODE
        if "Assault Division" in event.type:
            site = extract_assault_division(event.text)
            last = None
            if store.get(f"{site}Pos", None):
                last = store.get(f"{site}Pos", None)
            if event.type == "Assault Division Move":
                eff = get_effect(site)
                if eff:
                    if last:
                        planetclone[last].adiv = ""
                        planetclone[last].remove_desc(eff.name)
                    planetclone[str(ind)].adiv = eff.icon
                    planetclone[str(ind)].add_desc(eff.name, eff.description)
                    store[f"{site}Pos"] = str(ind)

        if event.type == "Biome Change":
            _, _, _, _, _, _, slug = extract_biome_change_details(
                event.text, vjson["biomes"]
            )
            planetclone[str(ind)].biome = slug

        if event.type == "Black Hole":
            planetclone[str(ind)].biome = "blackhole"

        if event.type == "Annihilation":
            # planetclone[str(ind)].biome = "destroyed"
            site = "FRACTURED PLANET"
            planetclone[str(ind)].biome = "fractured"

            eff = get_effect(site)
            if eff:
                planetclone[str(ind)].desc = []
                planetclone[str(ind)].poi = eff.icon
                planetclone[str(ind)].add_desc(eff.name, eff.description)

        if "Threat" in event.type:
            site = "VERGE OF DESTRUCTION"
            if event.type == "Threat Start":
                eff = get_effect(site)
                if eff:
                    planetclone[str(ind)].poi = eff.icon
                    planetclone[str(ind)].add_desc(eff.name, eff.description)
            if event.type == "Threat End":
                eff = get_effect(site)
                if eff:
                    planetclone[str(ind)].remove_desc(eff.name)
                planetclone[str(ind)].poi = ""

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
            if p not in decay_for_planets:
                decay_for_planets[p] = []
            if planet:
                decay_for_planets[p].append(planet)

        for decay, planets in decay_for_planets.items():
            usenames = derive_decay_names(planets, vjson)
            change = round((float(decay) * 3600) / 10000, 2)
            outtext.append(f" Decay: {change} on " + ", ".join(usenames))
            # print(outtext)
            # logger.info(outtext)

    return outtext


def handle_region_decay_events(
    decay: Optional[List[Tuple[str, Any, Any]]],
) -> List[str]:
    outtext: List[str] = []
    if decay:
        decay_for_planets: Dict[str, List[Any]] = {}
        for ind, o, dec in decay:
            change = round((float(dec) * 3600) / 10000, 2)
            sp=ind.split("_")
            planet=vjson["planets"].get(str(sp[0]))['name']
            outtext.append(f" Region Decay: {change} on {planet}'s " + sp[1]+ " region")
            print(outtext)
            logger.info(outtext)

    return outtext


class PlanetHistoryDelta:
    """Calculate a history delta of all changes that happened across each planet."""

    def __init__(self):
        self.hashlinks = {}
        self.resort: Dict[str, List[Dict[str, Any]]] = {}
        self.clusters: List[Dict[str, List[Dict[str, Any]]]] = []
        self.laststate = {}
        self.cluster_num = 0

    def get_difference_from_laststate(
        self, event_index: int, planet_key: str, planetstate: PlanetState
    ):
        """
        Calculate the difference between the current planet state and the last known state.

        Args:
            event_index (int): The index of the current event being processed.
            planet_key (str): The key identifying the planet.
            planetstate (PlanetState): The current state of a planet.

        Returns:
            dict: A dictionary containing the differences for each field, compared to the last known state.
        """
        res = planetstate.model_dump(warnings="error", exclude=["link"])
        if planet_key not in self.resort:
            self.resort[planet_key] = []

        keys_all = list(res.keys())
        difference = {}

        for key in keys_all:
            if key not in self.laststate[planet_key]:
                self.laststate[planet_key][key] = None
            if self.laststate[planet_key][key] != res[key]:
                difference[key] = res[key]
        return difference

    def update_hash_links(
        self, event_index: int, ptemp: Optional[Dict[str, PlanetState]]
    ):
        """
        Update the hash links for planets.
        Hashlinks are a configuration of supply lines tied with a unique "hash" value.

        Args:
            event_index (int): The index of the current event being processed.
            ptemp (Optional[Dict[str, PlanetState]]): A dictionary representing the planet states.
        """
        for p, resa in ptemp.items():
            # Add in links to hashlinks.
            if isinstance(resa.link, list):
                link = unordered_list_hash(resa.link)
                if link not in self.hashlinks:
                    self.hashlinks[link] = resa.link
                else:
                    if sorted(resa.link) != sorted(self.hashlinks[link]):
                        logger.warning(
                            "MISMATCH: resa.link=%s, hashlinks[link]=%s",
                            resa.link,
                            self.hashlinks[link],
                        )
                resa.link2 = link

    def delta_format(self, event_index: int, ptemp: Optional[Dict[str, PlanetState]]):
        """Add to the ongoing history delta."""

        # update hash links
        self.update_hash_links(event_index, ptemp)
        cluster_num = event_index // CLUSTER_SIZE

        if self.laststate:
            # Check for changes between Last state and the
            # current temporary planet
            for planet_key, planet_state in ptemp.items():
                toad = self.get_difference_from_laststate(
                    event_index, planet_key, planet_state
                )
                if toad:
                    toad["eind"] = event_index
                    self.resort[planet_key].append(toad)
        else:
            for planet_key, planet_state in ptemp.items():
                res = planet_state.model_dump(warnings="error", exclude=["link"])
                if planet_key not in self.resort:
                    self.resort[planet_key] = [res]
                    self.resort[planet_key][0]["eind"] = event_index
        self.laststate = {k: v.model_dump(warnings="error") for k, v in ptemp.items()}

    def make_cluster(self, cluster_size):
        grouped_items = {}  # Dictionary to hold groups

        for planet, changes in self.resort.items():
            for change in changes:
                eind = change["eind"]
                cluster = eind // cluster_size
                if cluster not in grouped_items:
                    grouped_items[cluster] = {}
                    rebuilt = self.rebuild_state_up_to(eind * cluster_size)
                    for i, v in rebuilt.items():
                        grouped_items[cluster][i] = [v]
                else:
                    grouped_items[cluster][planet].append(change)

        # Optional: assign the grouped items back to self or return them
        self.grouped_resort = grouped_items  # Assign to self if needed
        return grouped_items  # Or return directly if not storing in class

    def rebuild_state_up_to(self, eind: int) -> Dict[str, Dict[str, Any]]:
        """Rebuild the planet state up to a specific eind value."""
        reconstructed_state = {}

        for planet, changes in self.resort.items():
            current_state = {}
            for change in changes:
                if change["eind"] <= eind:
                    # Apply changes up to the specific eind
                    for key, value in change.items():
                        if key != "eind":
                            current_state[key] = value
                else:
                    # Stop processing changes once we pass the target eind
                    break
            reconstructed_state[planet] = current_state

        return reconstructed_state


class GalaxyEventProcessor:
    """Specialized processing object for the historydata.json file and galaxy_states."""

    def __init__(
        self,
        db_file: str,
        planets: Dict[str, Any],
        temp: Dict[str, PlanetState],
        skip_mode: bool = False,
    ):
        self.conn = sqlite3.connect(db_file)
        self.planets = planets
        self.temp = temp
        self.march_5th = datetime(2024, 3, 5, 20, tzinfo=timezone.utc)
        self.all_times_new = {}
        self.all_region_times_new = {}

        self.store = {"mos": {}}
        self.laststats = {}
        self.lastregionstats = {}
        self.galaxy_states = GalaxyStates(gstatic=planets, states={})
        self.phistdelta = PlanetHistoryDelta()
        self.last_time = 0
        self.newevt = []
        self.days_out = None
        self.skip_mode = True

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
        ne = GameEventGroup(
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
        regionstats = await get_region_stats(
            self.conn, ne, self.all_region_times_new, self.march_5th
        )
        ne.all_players = all_players

        print(f"On event group number {i}, timestamp {ne.time}")
        logger.info(f"On event group number {i}, timestamp {ne.time}")

        ptemp = {k: v.model_copy(deep=True) for k, v in self.temp.items()}
        dc = str(int(ne.day) // 30)
        interval = int(ne.timestamp) // 900
        if interval in planetstats:
            planetstats = self.all_times_new[dc][interval]
        if interval in regionstats:
            regionstats = self.all_region_times_new[dc][interval]

        if ne.type == "m":
            decay, hp_checkpoint = check_planet_stats_for_change(ptemp, planetstats)
            outtext = handle_decay_events(decay)

            if not self.process_monitor_event(
                event_group, ne, decay, hp_checkpoint, outtext
            ):
                decay, hp_checkpoint = check_region_stats_for_change(ptemp, regionstats)
                outtext = handle_region_decay_events(decay)
                if not self.process_monitor_event(
                    event_group, ne, decay, hp_checkpoint, outtext
                ):
                    return  # Skip the event group

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
    ) -> bool:
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
                self.lastregionstats,
                event,
                ne.eind,
                self.store,
                self.all_times_new,
                self.all_region_times_new,
            )
            elog.append(
                GameSubEvent(
                    planet=event.planet,
                    region=event.region,
                    text=event.text,
                    type=event.type,
                    faction=event.faction,
                )
            )
        self.temp = ptemp
        ne.log = elog
        mov = ",".join(v for _, v in self.store.get("mo", {}).items())
        ne.mo = mov

    def save_results(self):
        """Save Results"""
        print("Saving galaxy states.")
        logger.info("Saving galaxy states.")
        galaxy_states_dump = self.galaxy_states.model_dump(warnings="error")
        save_json_compressed("./src/data/gstates.json", galaxy_states_dump)
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

        self.days_out.events = self.newevt
        self.days_out.events_all = None
        self.galaxy_states.states = {}
        self.galaxy_states.gstate = self.phistdelta.resort
        self.galaxy_states.links = self.phistdelta.hashlinks

        self.save_results()

        # rebuilt = self.phistdelta.make_cluster(CLUSTER_SIZE)
        # print(json.dumps(rebuilt))
        self.conn.close()


async def main_code():
    try:
        await format_event_obj()
        planets, temp = initialize_planets()
        processor = GalaxyEventProcessor(DATABASE_FILE, planets, temp)
        await processor.run()
    except Exception as e:
        logger.exception(e)
        raise e


if not os.path.exists("./src/data/gen_data"):
    os.makedirs("./src/data/gen_data", exist_ok=True)
    raise FileNotFoundError("The directory ./src/data/gen_data does not exist.")

if __name__ == "__main__":
    print("Starting up...")

    logger.info("Starting up...")  # = logging.getLogger("StatusLogger")

    parser = argparse.ArgumentParser(description="Check for changes.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="force build even if no changes detected",
    )

    args = parser.parse_args()

    # Determine if any significant change was made.
    old_text = ""
    print("Reading web file...")
    if os.path.exists("src/data/gen_data/lasttext.md"):
        with open("src/data/gen_data/lasttext.md", "r", encoding="utf-8") as file:
            old_text = file.read()

    get_web_file()

    text = open("./src/data/gen_data/text.md", "r", encoding="utf8").read()

    if text != old_text or args.force:
        make_day_obj(text)

        asyncio.run(main_code())
        with open("src/data/gen_data/lasttext.md", "w", encoding="utf-8") as file:
            file.write(text)
    else:
        logger.info("NO CHANGE DETECTED.  SKIPPING.")
        print("NO CHANGE DETECTED.  SKIPPING.")
