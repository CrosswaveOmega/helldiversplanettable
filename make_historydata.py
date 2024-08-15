import json
import re
from typing import Any, Dict, List, Optional, Tuple, Union
from datetime import datetime, timezone, timedelta
import os
import asyncio
import aiohttp
import urllib.request

def get_web_file():
    """Parse the google doc into a text format."""

    url = "https://docs.google.com/document/d/1lvlNVU5aNPcUtPpxAsFS93P2xOJTAt-4HfKQH-IxRaA/export?format=txt"
    with urllib.request.urlopen(url) as response:
        data = response.read()

    with open("./src/data/gen_data/text.md", "wb") as file:
        file.write(data)


async def get_game_stat_at_time(timev: datetime) -> Dict[int, Dict[str, Any]]:
    """Request the game's status at the given datetime using the war history api."""
    try:
        current_time = timev.isoformat()
        url = "https://api-helldivers.kejax.net/api/planets/at"
        params = {"time": current_time}

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                response_json = await response.json()
                outv = {p["index"]: p for p in response_json}
                return outv
    except Exception as e:
        print(e)
        return {}


def check_and_load_json(filepath: str):
    if os.path.exists(filepath) and os.path.isfile(filepath):
        with open(filepath, "r", encoding="utf8") as json_file:
            return json.load(json_file)
    return {}


def parse_timestamp(timestamp_str: str) -> datetime:
    """Parse the history log's timestamp formatting into a valid datetime object."""
    pattern = r"(?P<time>\d{1,2}:\d{2}+\s*(am|pm))\s+(UTC\s)*(?P<day>\d{1,2}(st|nd|rd|th))+\s+(?P<month>\w+)\s+((?P<year>\d{4})*)?"
    match = re.match(pattern, timestamp_str, re.MULTILINE)
    if match:
        time_str = match.group("time")
        month_str = match.group("month")
        day_str = match.group("day")[:-2]
        year_str = match.group("year")
        year = 2024
        if year_str:
            year = int(year_str)

        month_map = {
            "January": 1,
            "Jan": 1,
            "Feb": 2,
            "March": 3,
            "Mar": 3,
            "April": 4,
            "Apr": 4,
            "May": 5,
            "June": 6,
            "Jun": 6,
            "July": 7,
            "Jul": 7,
            "August": 8,
            "Aug": 8,
            "September": 9,
            "Sep": 9,
            "October": 10,
            "Oct": 10,
            "November": 11,
            "Nov": 11,
            "December": 12,
            "Dec": 12,
        }
        month = month_map[month_str]
        day = int(day_str)

        time_format = "%I:%M%p"
        time_obj = datetime.strptime(time_str, time_format)

        naive_datetime = datetime(
            int(year), month, day, time_obj.hour, time_obj.minute, tzinfo=timezone.utc
        )
        print(naive_datetime, timestamp_str)
        return naive_datetime
    else:
        raise ValueError("The timestamp string does not match the expected format.")


def extract_mo_details(text: str) -> Optional[Tuple[str, str, str, str]]:
    pattern = r"^(?P<type>.*?)\s*\|\s*(?P<name>.*?)(?P<case>\s(is issued|is won|is failed))\s*\|\s*Objective:\s*(?P<objective>.*)$"
    match = re.match(pattern, text)
    if match:
        type_ = match.group("type")
        name = match.group("name").strip()
        case = match.group("case").strip()
        objective = match.group("objective").strip()
        return type_, name, case, objective
    else:
        return None


def get_planet(myplanets: Dict[str, int], text: str) -> List[Tuple[str, int]]:
    "Search through planet keys, and return the planets with the matching keys."
    planets = []
    for planet in myplanets.keys():
        if planet in text:
            planets.append((planet, myplanets[planet]))
    return planets


faction_dict = {1: "Human", 2: "Terminid", 3: "Automaton", 4: "Illuminate"}


def get_faction(text: str) -> int:
    "Get the Faction from the text."
    if "AUTOMATON" in text.upper() or "AUTOMAT" in text.upper():
        return 3
    if "TERMINID" in text.upper():
        return 2
    if "HUMAN" in text.upper():
        return 1
    return 0


def get_event_type(text: str) -> Tuple[str, str]:
    """Get the event type from the text"""
    match = None
    if "MAJOR ORDER" in text.upper():
        match = "Major Order"
        if "is issued" in text.lower():
            return "Major Order Start", match
        if "is won" in text.lower():
            return "Major Order Won", match
        if "is failed" in text.lower():
            return "Major Order Lost", match
        return "Major Order EVENT", match
    if "is liberated" in text.lower():
        match = "is liberated"
        return "planet won", match
    if "instantly flips to" in text.lower():
        match = "instantly flips to"
        return "planet flip", match
    if "defense is failed" in text.lower():
        match = "defense is failed"
        return "defense lost", match
    if "is attacked by" in text.lower() or "assaulted into a defense" in text.lower():
        match = (
            "is attacked by"
            if "is attacked by" in text.lower()
            else "assaulted into a defense"
        )
        return "defense start", match
    if "monitoring satellites are launched" in text.lower():
        match = "monitoring satellites are launched"
        return "warhistoryapilaunch", match
    if "defense is won" in text.lower():
        match = "defense is won"
        return "defense won", match
    if "defense is auto-won" in text.lower():
        match = "defense is auto-won"
        return "defense won", match
    if "is destroyed via planetary implosion" in text.lower():
        match = "is destroyed via planetary implosion"
        return "planet superwon", match
    if "is added" in text.lower():
        match = "is added"
        return "newlink", match
    if "is removed" in text.lower():
        match = "is removed"
        return "destroylink", match
    if "are obliterated" in text.lower():
        match = "are obliterated"
        return "clearlinks", match
    if "campaign starts" in text.lower():
        match = "campaign starts"
        return "cstart", match
    if "campaign ends" in text.lower():
        match = "campaign ends"
        return "cend", match
    if "fully liberated" in text.lower():
        match = "fully liberated"
        return "full_lib", match
    if "is fully under" in text.lower():
        match = "is fully under"
        return "full_occ", match
    if "is not accessible despite" in text.lower():
        match = "is not accessible despite"
        return "inaccessable", match
    if "is still accessible despite" in text.lower():
        match = "is still accessible despite"
        return "accessible_anomaly", match

    text_lower = text.lower()
    keywords = ["day", "start"]
    if all(keyword in text_lower for keyword in keywords):
        match = "day start"
        return "Day Start", match
    return "unknown", "?????"


def make_day_obj() -> None:
    '''Load the HOWL google doc, create day/event/date dictionary'''
    get_web_file()
    pattern = r"^(Day #(?P<day>\d+)\s+(?P<day_time>\d{1,2}:\d{2}+\s*(am|pm)\s+\d{1,2}(st|nd|rd|th)\s+\w+\s+(\d{4})*)|(?P<text>.*?)\s+\((?P<time>\d{1,2}:\d{2}+\s*(am|pm)?\s+UTC\s+\d{1,2}(st|nd|rd|th)\s+\w+\s*\d*)\))"
    text = open("./src/data/gen_data/text.md", "r", encoding="utf8").read()
    text = text.replace("’", "'")
    days: Dict[str, Any] = {"events": []}
    daykey = "DK"
    #Create the inital days dictionary.
    for line in text.split("\n"):
        matches = re.finditer(pattern, line, re.MULTILINE)
        for match in matches:
            if match.group("day"):
                timestamp = parse_timestamp(match.group("day_time"))
                daykey = f"{match.group('day')}"
                days["events"].append(
                    {
                        "text": f"Day #{daykey} Start",
                        "timestamp": timestamp.timestamp(),
                        "time": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                        "day": daykey,
                    }
                )
            else:
                timestamp = parse_timestamp(match.group("time"))
                print(match.group("text"), timestamp)
                days["events"].append(
                    {
                        "text": match.group("text"),
                        "timestamp": timestamp.timestamp(),
                        "time": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                        "day": daykey,
                    }
                )

    with open("./src/data/gen_data/out.json", "w", encoding="utf8") as json_file:
        json.dump(days, json_file, indent=4)


def format_event_obj() -> None:
    '''Using the dictionary at out.json,
      determine the type of each event and the event parameters using the
      event text strings.'''
    days_out = check_and_load_json("./src/data/gen_data/out.json")
    allplanets = check_and_load_json("./allplanet.json")
    planets_Dict = allplanets["planets"]
    planets_Dict2 = {planet["name"]: key for key, planet in planets_Dict.items()}
    sectors = get_unique_sectors(planets_Dict)

    defenses: Dict[str, str] = {}
    days_out["events"].sort(key=lambda event: event["timestamp"])
    monitoring = False
    lasttime = None
    newevents = []
    event_type_sort = {"unknown": []}

    for event in days_out["events"]:
        text = event["text"]
        event["planet"] = get_planet(planets_Dict2, text)
        event["type"], match = get_event_type(text)

        if monitoring:
            newevents, lasttime = monitor_event(event, lasttime, newevents)
        if event["type"] == "warhistoryapilaunch":
            monitoring = True

        lasttime = datetime.fromtimestamp(event["timestamp"], tz=timezone.utc)
        event["faction"] = get_faction(text)
        event_type_sort = sort_event_type(event, text, match, sectors, event_type_sort)

        if event["planet"]:
            defenses = update_defenses(event, defenses)

    days_out["events"].extend(newevents)
    days_out["events"].sort(key=lambda event: event["timestamp"])

    save_json_data("./src/data/gen_data/out2.json", days_out)
    save_json_data("./src/data/gen_data/typesort.json", event_type_sort)


def get_unique_sectors(planets_Dict: Dict[str, Any]) -> List[str]:
    '''Return all unique sectors.'''
    sectors = [planet["sector"] for planet in planets_Dict.values()]
    return list(set(sectors))


def monitor_event(event: Dict[str, Any], lasttime: datetime, newevents: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], datetime]:
    '''Add events between between two timestamps if the distance is great enough.'''
    time = datetime.fromtimestamp(event["timestamp"], tz=timezone.utc)
    time=time-timedelta(minutes=time.minute)
    lasttime=lasttime-timedelta(minutes=lasttime.minute)
    while (time - lasttime) > timedelta(hours=12):
        timestamp = lasttime + timedelta(
            hours=(9 - lasttime.hour % 9), minutes=(60-lasttime.minute)%60
        )
        newevents.append(
            {
                "text": "Midday Status",
                "timestamp": timestamp.timestamp(),
                "time": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "day": event["day"],
                "planet": [],
                "faction": "unknown",
                "type": "monitor",
            }
        )
        lasttime = timestamp
    return newevents, lasttime


def sort_event_type(event: Dict[str, Any], text: str, match: str, sectors: List[str], event_type_sort: Dict[str, Any]) -> Dict[str, Any]:
    '''Modify the event type sort dictionary, which determines which lines have an UNKNOWN event.'''
    if event["type"] == "unknown":
        event_type_sort["unknown"].append(text)
    else:
        if not event["type"] in event_type_sort:
            event_type_sort[event["type"]] = [text, [], []]

        nt = format_event_text(event, text, match, sectors)
        if nt not in event_type_sort[event["type"]][1]:
            event_type_sort[event["type"]][1].append(nt)
    return event_type_sort


def format_event_text(event: Dict[str, Any], text: str, match: str, sectors: List[str]) -> str:
    if "Major Order" in event["type"]:
        result = extract_mo_details(event["text"])
        if result:
            type_, name, case, objective = result
            text = text.replace(type_, "[TYPE]").replace(name, "[MO NAME]").replace(case, "[MO CASE]").replace(objective, "[MO OBJECTIVE]")
    else:
        text = text.replace(match, "[TYPETEXT]")
        for e, v in enumerate(event["planet"]):
            p, ind = v
            text = text.replace(p, f"[PLANET {e}]")
        e = sum(1 for s in sectors if s in text)
        text = re.sub(f"({'|'.join(sectors)})", lambda m: f"[SECTOR {e}]", text)
        text = text.replace(faction_dict.get(event["faction"], "UNKNOWN"), f"[FACTION]")
    return text


def update_defenses(event: Dict[str, Any], defenses: Dict[str, str]) -> Dict[str, str]:
    for p in event["planet"]:
        planet = p[1]
        if event["type"] == "defense start":
            defenses[planet] = event["faction"]
        if event["type"] == "defense won":
            defenses.pop(str(planet))
        if event["type"] == "defense lost":
            event["faction"] = defenses.pop(str(planet))
    return defenses


async def create_planet_sectors():
    """Create the planet sectors file, given an inital set of all planets,
      with a waypoint configuration"""
    pda = check_and_load_json("./src/data/gen_data/theseplanets.json")
    sectors = {}
    for ind, planet in pda.items():
        if not planet["sector"] in sectors:
            sectors[planet["sector"]] = []
        sectors[planet["sector"]].append(planet)
    st2 = {}
    for ind, value in sectors.items():
        isvalid = [planet for planet in value if planet.get("link")]
        # print(len(isvalid))
        if len(isvalid) >= 0:
            st2[ind] = [planet for planet in value]
    sectors = {ind: value for ind, value in st2.items() if value}
    with open(
        "./src/data/gen_data/planet_sectors_2.json", "w", encoding="utf8"
    ) as json_file:
        json.dump(sectors, json_file, indent=4)



hashlists = {}
valid_waypoints = {}

async def main_code() -> None:
    '''Create the historydata.json file using result from format_event_object.'''
    planetlist: List[Tuple[int, Dict[str, Any]]] = []
    planets, temp = initialize_planets()
    planetlist.append((0, planets))

    days_out =check_and_load_json("./src/data/gen_data/out2.json")
    d = 0

    all_times_new = {}

    lastday: int = 0
    laststats: Dict[int, Dict[str, Any]] = {}
    march_5th = datetime(2024, 3, 5, tzinfo=timezone.utc)
    store: Dict[str, str] = {}
    galaxy_states = {}
    days_out["days"] = {}
    days_out["galaxystatic"] = planets
    days_out["lastday"] = 1
    days_out["dayind"] = {}
    days_out["new_events"] = []

    events_by_timestamp = {}
    for i, event in enumerate(days_out["events"]):
        # Group all events by the timestamp in which they occoured.
        timestamp = event["timestamp"]
        if timestamp not in events_by_timestamp:
            events_by_timestamp[timestamp] = []
        events_by_timestamp[timestamp].append(event)
    newevt = []
    grouped_events = list(events_by_timestamp.values())
    for i, event_group in enumerate(grouped_events):
        elog = []
        ne = {
            "timestamp": event_group[0]["timestamp"],
            "time": event_group[0]["time"],
            "day": event_group[0]["day"],
        }
        for e, event in enumerate(event_group):
            temp = await process_event(
                days_out,
                temp,
                laststats,
                lastday,
                event,
                i,
                march_5th,
                store,
                all_times_new,
            )
            elog.append(
                {
                    "planet": event["planet"],
                    "text": event["text"],
                    "type": event["type"],
                    "faction": event["faction"],
                }
            )
            ne["galaxystate"] = event["galaxystate"]
            galaxy_states[ne["timestamp"]] = event["galaxystate"]
            ne["mo"] = event["mo"]
        ne["log"] = elog
        newevt.append(ne)
    days_out["events"] = newevt
    bef = 0
    aft = 0

    # for t, s in galaxy_states.items():
    #     for p, res in s.items():
    #         if 'link' in res:
    #             link=unordered_list_hash(res['link'])
    #             if not link in hashlists:
    #                 hashlists[link]=[res['link'],1]
    #             else:
    #                 if sorted(res['link'])!=sorted(hashlists[link][0]):
    #                     print("MISMATCH",res['link'],hashlists[link][0])
    #                 hashlists[link][1]+=1
    #             bef+=len(str(res['link']))
    #             res['link']=link
    #             aft+=len(str(link))

    markdowncode = list_all(days_out)
    # print(markdowncode)
    with open("./src/history_log_full.md", "w", encoding="utf8") as file:
        file.write(markdowncode)
    print("saving data")
    save_json_data("./src/data/historydata.json", days_out)
    print("saving time cache")
    for d, v in all_times_new.items():
        save_json_data(f"./src/data/gen_data/alltimes_{d}.json", all_times_new[d])
    save_json_data("./src/data/gstates.json", galaxy_states)
    print(bef, aft)
    print(hashlists)


mainHeader = """---
title: Galactic War History Log Full
toc: True
sidebar: true
---
# Full Galactic War History Log

Data aquired thanks to Herald/Cobfish's excelllent [Galactic Archive Log](https://docs.google.com/document/d/1lvlNVU5aNPcUtPpxAsFS93P2xOJTAt-4HfKQH-IxRaA) and Kejax's [War History Api](https://github.com/helldivers-2/War-History-API), this would not be possible without either of them.

"""


def suffix(d):
    return {1: "st", 2: "nd", 3: "rd"}.get(d % 20, "th")


def custom_strftime(format, t):
    return t.strftime(format).replace("{S}", str(t.day) + suffix(t.day))


def list_all(history):
    markdown_output = ["\n"]

    def create_card(entry):
        for each in entry["log"]:
            # print(markdown_output[-1]);
            if each["type"] == "Day Start":
                if (int(entry["day"]) % 10) == 0 or int(entry["day"]) == 1:
                    markdown_output.append(f"\n# Day: #{entry['day']}\n")
                else:
                    markdown_output.append(f"\n### Day: #{entry['day']}\n")
            else:
                timestamp = datetime.fromtimestamp(entry["timestamp"], tz=timezone.utc)
                formatted_time = timestamp.strftime("%Y-%m-%d %H:%M")
                # formatted_time = custom_strftime("%#I:%M%p UTC %b {S} %Y",timestamp)
                # formatted_time=formatted_time.replace("AM",'am')
                # formatted_time=formatted_time.replace("PM",'pm')

                markdown_output.append(f"{each['text']} ({formatted_time})<br/>\n")

    for event in history["events"]:
        create_card(event)
    return mainHeader + "".join(markdown_output)





def unordered_list_hash(int_list: List[int]):
    # Initialize two hash values
    xor_hash = 0
    sum_hash = 0
    # Iterate through the given list of integers
    for num in int_list:
        # Compute the XOR for all elements in the list
        xor_hash ^= num
        # Compute the sum for all elements in the list
        sum_hash += num
    # print(xor_hash,sum_hash)
    # Return the combined hash
    hashc = xor_hash * sum_hash
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
            }
            if not t["link"]:
                t.pop("link")
            per = {
                "name": p["name"],
                "position": p["position"],
                "sector": p["sector"],
                "index": p["index"],
            }
            planets[str(p["index"])] = per
            temp[str(p["index"])] = t

    return planets, temp


async def process_event(
    days_out: Dict[str, Any],
    planets: Dict[str, Dict[str, Any]],
    laststats: Dict[int, Dict[str, Any]],
    lastday: int,
    event: Dict[str, Any],
    index: int,
    march_5th: datetime,
    store: Dict[str, str],
    all_times_new: Dict[str, Dict[int, Dict[str, Any]]],
) -> Dict[str, Dict[str, Any]]:
    """Process each event, extrapoliating the current state of the game at each step."""
    # Apply major order details to event
    if "Major Order" in event["type"]:
        result = extract_mo_details(event["text"])
        if result:
            type_, name, case, objective = result
            event["mo_name"] = name
            event["mo_case"] = case
            event["mo_objective"] = objective
            if case == "is issued":
                store["mo"] = f"{name}, {objective}"
            else:
                store["mo"] = "Awaiting orders"
            # print(index, event["day"], event["time"], event["text"])
    event["mo"] = store.get("mo", "")

    # Extract day data
    if not event["day"] in days_out["days"]:
        days_out["days"][event["day"]] = index
        days_out["dayind"][event["day"]] = []
    if days_out["lastday"] < int(event["day"]):
        days_out["lastday"] = int(event["day"])
    days_out["dayind"][event["day"]].append(index)

    # Apply last stats
    planetclone = json.loads(json.dumps(planets))
    for i, v in laststats.items():
        if str(i) in planetclone:
            planetclone[str(i)]["hp"] = v["health"]
            planetclone[str(i)]["r"] = float(v["regenPerSecond"])

            planetclone[str(i)]["pl"] = v["players"]

    timestamp = str(event["timestamp"])
    dc = str(int(event["day"]) // 30)
    if str(dc) not in all_times_new:
        all_times_new[str(dc)] = check_and_load_json(
            f"./src/data/gen_data/alltimes_{dc}.json"
        )
    if timestamp not in all_times_new[str(dc)]:
        time = datetime.fromtimestamp(event["timestamp"], tz=timezone.utc)

        if time > march_5th:

            print(
                f"{event['text']},{event['time']} fetching game data for time {timestamp}"
            )
            planetstats = await get_game_stat_at_time(time)
            # all_times[timestamp] = planetstats
            all_times_new[str(dc)][timestamp] = planetstats
            if lastday != event["day"]:
                lastday = event["day"]
                print("SAVING")
                # save_json_data("./src/data/gen_data/alltimes.json", all_times)
        else:
            all_times_new[str(dc)][timestamp] = {}
            # all_times[timestamp] = {}
    else:
        pass

    time = datetime.fromtimestamp(event["timestamp"], tz=timezone.utc)
    planetstats = all_times_new[str(dc)][timestamp]

    update_planet_stats(planetclone, planetstats)

    if planetstats:
        all_differences = {
            k: {"health": v["health"], "players": v["players"]}
            for k, v in planetstats.items()
            if k not in laststats
            or v["health"] != laststats[k]["health"]
            or v["players"] != laststats[k]["players"]
        }
        # event["changes"] = all_differences
        laststats = planetstats

    if event["planet"]:
        update_planet_ownership(event, planetclone)
    # Create hash list for waypoints, this is to eventually
    #cut down on the file size
    for ind in planetclone.keys():
        if "link" in planetclone[str(ind)]:
            link = unordered_list_hash(planetclone[str(ind)]["link"])
            if link not in hashlists:
                hashlists[link] = [planetclone[str(ind)]["link"], 1]
            else:
                if sorted(planetclone[str(ind)]["link"]) != sorted(hashlists[link][0]):
                    print("MISMATCH", planetclone[str(ind)]["link"], hashlists[link][0])
                hashlists[link][1] += 1

    event["galaxystate"] = planetclone
    return planetclone


def update_planet_stats(
    planetclone: Dict[str, Dict[str, Any]], planetstats: Dict[int, Dict[str, Any]]
) -> None:
    '''Update HP, regenPerSecond, and playercount'''
    for i, v in planetstats.items():
        if str(i) in planetclone:
            planetclone[str(i)]["hp"] = v["health"]
            planetclone[str(i)]["r"] = float(v["regenPerSecond"])

            planetclone[str(i)]["pl"] = v["players"]


def update_planet_ownership(
    event: Dict[str, Any], planetclone: Dict[str, Dict[str, Any]]
) -> None:
    '''Update planet ownership and warp links, if applicable.'''
    for p in event["planet"]:
        name, ind = p
        ind = int(ind)
        if str(ind) not in planetclone:
            print("WARNING,", ind, name, "Not in planetclone!")
        dec = list(DECODE(planetclone[str(ind)]["t"]))
        if event["type"] == "cstart":
            dec[2] = 1
        if event["type"] == "cend":
            dec[2] = 0

        if event["type"] == "planet won":
            dec[0] = 1
            dec[2] = 0
        if event["type"] == "planet superwon":
            dec[0] = 1
            dec[2] = 0
        if event["type"] == "defense lost":
            dec[0] = event["faction"]
            dec[1] = 0
            dec[2] = 0
        if event["type"] == "planet flip":
            dec[0] = event["faction"]
        if event["type"] == "defense start":
            dec[1] = event["faction"]
            dec[2] = 1
        if event["type"] == "defense won":
            dec[1] = 0
            dec[2] = 0
        planetclone[str(ind)]["t"] = ENCODE(dec[0], dec[1], dec[2])
    #Warp link updates
    if event["type"] == "newlink":
        update_waypoints(event["planet"], planetclone, add=True)

    if event["type"] == "destroylink":
        update_waypoints(event["planet"], planetclone, add=False)

    if event["type"] == "clearlinks":
        for name, ind in event["planet"]:
            planetclone[str(ind)]["link"] = []
            for id2 in planetclone.keys():
                if "link" in planetclone[str(ind)]:
                    while int(id2) in planetclone[str(ind)]["link"]:
                        # print('founda')
                        planetclone[str(ind)]["link"].remove(int(id2))
                    if not planetclone[str(ind)]["link"]:
                        planetclone[str(ind)].pop("link")
                if "link" in planetclone[str(id2)]:
                    while int(ind) in planetclone[str(id2)]["link"]:
                        # print('foundb')
                        planetclone[str(id2)]["link"].remove(int(ind))
                    if not planetclone[str(id2)]["link"]:
                        planetclone[str(id2)].pop("link")
                        
def add_waypoint(
    planetclone: Dict[str, Dict[str, Any]], ind: int, other_ind: int
) -> None:
    if "link" not in planetclone[str(ind)]:
        planetclone[str(ind)]["link"] = []
    if int(other_ind) not in planetclone[str(ind)]["link"]:
        if "link" in planetclone[str(other_ind)] and (
            int(ind) in planetclone[str(other_ind)]["link"]
        ):
            return
        planetclone[str(ind)]["link"].append(int(other_ind))


def remove_waypoint(
    planetclone: Dict[str, Dict[str, Any]], ind: int, other_ind: int
) -> None:
    if "link" in planetclone[str(ind)]:
        while int(other_ind) in planetclone[str(ind)]["link"]:
            planetclone[str(ind)]["link"].remove(int(other_ind))
        if not planetclone[str(ind)]["link"]:
            planetclone[str(ind)].pop("link")
    if "link" in planetclone[str(other_ind)]:
        while int(ind) in planetclone[str(other_ind)]["link"]:
            planetclone[str(other_ind)]["link"].remove(int(ind))
        if not planetclone[str(other_ind)]["link"]:
            planetclone[str(other_ind)].pop("link")


def update_waypoints(
    planet_list: List[Tuple[str, int]],
    planetclone: Dict[str, Dict[str, Any]],
    add: bool = True,
) -> None:
    """Add/Remove waypoints between planets in planetslist."""
    planet_pairs = ((p1, p2) for p1 in planet_list for p2 in planet_list)
    for (name, ind), (other_name, other_ind) in planet_pairs:
        if name == other_name:
            continue
        if add:
            add_waypoint(planetclone, ind, other_ind)
        else:
            remove_waypoint(planetclone, ind, other_ind)



def save_json_data(file_path: str, data: Any) -> None:
    '''Save json data to a file.'''
    with open(file_path, "w", encoding="utf8") as json_file:
        json.dump(data, json_file)


if not os.path.exists("./src/data/gen_data"):

    os.makedirs("./src/data/gen_data", exist_ok=True)
    raise FileNotFoundError("The directory ./src/data/gen_data does not exist.")



asyncio.run(create_planet_sectors())
make_day_obj()
format_event_obj()
asyncio.run(main_code())
