import json
import re
from typing import Any, Dict, List, Optional, Tuple, Union
from datetime import datetime, timezone, timedelta
import os
import asyncio
import aiohttp
import urllib.request

from pydantic import BaseModel, Field
from datetime import datetime

import os
import sys

import logging
import logging.handlers

from hd2json.jsonutils import load_and_merge_json_files
import sqlite3

# Define the database file
DATABASE_FILE = './src/data/gen_data/alltimedata.db'


if not os.path.exists("./logs/"):
    os.makedirs("./logs/")

MAX_HOUR_DISTANCE=6
MIN_HOUR_CHANGE=2


logger = logging.getLogger("StatusLogger")
logger.setLevel(logging.DEBUG)

warn_error_handler = logging.handlers.RotatingFileHandler("./logs/warn_error.log", maxBytes=8 * 1024 * 1024, backupCount=1, encoding="utf8")
warn_error_handler.setLevel(logging.WARNING)

info_handler = logging.handlers.RotatingFileHandler("./logs/info.log", maxBytes=8 * 1024 * 1024, backupCount=1, encoding="utf8")
info_handler.setLevel(logging.INFO)

dt_fmt = "%Y-%m-%d %H:%M:%S"
formatter = logging.Formatter(
            "[LINE] [{asctime}] [{levelname:<8}] {name}: {message}", dt_fmt, style="{"
        )
warn_error_handler.setFormatter(formatter)
info_handler.setFormatter(formatter)

logger.addHandler(warn_error_handler)
logger.addHandler(info_handler)


# Create allplanet.json if not done already
vjson = load_and_merge_json_files("./hd2json/planets/")
json.dump(vjson, open("allplanet.json", "w+",encoding="utf8"), indent=4)

is_redirected = not sys.stdout.isatty()
if is_redirected:
    is_power_shell = len(os.getenv('PSModulePath', '').split(os.pathsep)) >= 3
    if is_power_shell:
        sys.stdout.reconfigure(encoding='utf-16')
    else:
        sys.stdout.reconfigure(encoding='utf-8')

class GameSubEvent(BaseModel):
    text:Optional[str]=Field(alias='text',default=None)
    type:Optional[str]=Field(alias='type',default=None)
    faction:Optional[int]=Field(alias='faction',default=0)
    planet: Optional[List[Tuple[str,int]]]=Field(alias='planet',default=[])

class GameEvent(BaseModel):

    timestamp: float
    time: str
    day: int
    text:Optional[str]=Field(alias='text',default=None)
    type:Optional[str]=Field(alias='type',default=None)
    faction:Optional[int]=Field(alias='faction',default=0)
    planet: Optional[List[Tuple[str,str]]]=Field(alias='planet',default=[])

    mo:Optional[str]=Field(alias='mo',default=None)
    mo_name:Optional[str]=Field(alias='mo_name',default=None)
    mo_case:Optional[str]=Field(alias='mo_case',default=None)
    mo_objective:Optional[str]=Field(alias='type',default=None)
    galaxystate:Dict[str, Any] = Field(default_factory=dict)
    log:Optional[List[GameSubEvent]]=Field(default_factory=list)
    all_players: Optional[int]=Field(alias='all_players',default=None)
    eind:Optional[int]=Field(alias='eind',default=None)

    # Comparator to sort GameEvent objects by timestamp
    def __lt__(self, other: 'GameEvent') -> bool:
        return self.timestamp < other.timestamp

# Now you can simply sort a list of GameEvent using the sorted() built-in function or list.sort()


    
class Position(BaseModel):
    x: float
    y: float

class PlanetStatic(BaseModel):
    name: str
    position: Position
    sector: str
    index: int


class PlanetState(BaseModel):
    hp: Optional[int]=Field(alias='hp',default=None)
    pl: Optional[Union[str,int]]=Field(alias='pl',default=None)
    r: Optional[float]=Field(alias='float',default=None)
    t: int
    link: Optional[List[int]]=Field(alias='link',default=[])
    link2: Optional[int]=Field(alias='link2',default=None)
    gls: Optional[int]=Field(alias='gloom',default=None)
    biome: Optional[str]=Field(alias='biome',default=None)




class DaysObject(BaseModel):
    events: List[GameEvent] = Field(default_factory=list, alias='events')
    days: Dict[int, int] = Field(default_factory=dict)
    dayind: Dict[int, List[int]] = Field(default_factory=dict)
    
    timestamps: List[int] = Field(default_factory=list)
    lastday: int = Field(default=1)

    galaxystatic: Dict[str,PlanetStatic] = Field(default_factory=dict)




class GalaxyStates(BaseModel):
   
    gstatic: Optional[Dict[str,PlanetStatic]] = Field(default=None,alias='gstatic')
    states: Optional[Dict[str,PlanetState]]=Field(default=None,alias='states')
    gstate: Optional[Dict[str,Any]]=Field(default_factory=dict,alias='gstate')
    links: Optional[Dict[int,List[int]]]=Field(default_factory=dict)
    



def get_web_file():
    """Parse the google doc into a text format."""

    url = "https://docs.google.com/document/d/1lvlNVU5aNPcUtPpxAsFS93P2xOJTAt-4HfKQH-IxRaA/export?format=txt"
    with urllib.request.urlopen(url) as response:
        print("reading...")
        data = response.read()

    with open("./src/data/gen_data/text.md", "wb") as file:
        file.write(data)


async def get_game_stat_at_time(timev: datetime) -> Dict[int, Dict[str, Any]]:
    """Request the game's status at the given datetime using the war history api."""
    try:
        current_time = timev.isoformat()
        url = "https://api-helldivers.kejax.net/api/planets/at"
        params = {"time": current_time}
        timeout = aiohttp.ClientTimeout(total=10)  # Set the timeout to 10 seconds

        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, params=params) as response:
                response_json = await response.json()
                outv = {p["index"]: p for p in response_json}
                return outv
    except Exception as e:
        logger.warning(str(e))
        return {}

def fetch_entries_by_timestamp(conn, timestamp):
    """Fetch all entries with a given timestamp."""
    cursor = conn.cursor()

    cursor.execute('''
    SELECT * FROM alltimedata WHERE timestamp = ?
    ''', (timestamp,))
    entries = cursor.fetchall()
    keys = [column[0] for column in cursor.description]
    all_entries = {}
    for index, entry in enumerate(entries):
        indexv={key: entry[i] for i, key in enumerate(keys)}
        all_entries[indexv['pindex']] = indexv
    return all_entries

def fetch_entries_by_dayval(conn, dayval):
    """Fetch all entries with the same dayval."""
    cursor = conn.cursor()

    cursor.execute('''
    SELECT * FROM alltimedata WHERE dayval = ?
    ''', (dayval,))
    entries = cursor.fetchall()
    keys = [column[0] for column in cursor.description]
    all_entries = {}
    for entry in entries:
        indexv = {key: entry[i] for i, key in enumerate(keys)}
        timestamp = indexv['timestamp']
        if timestamp not in all_entries:
            all_entries[timestamp] = {}
        all_entries[timestamp][indexv['pindex']] = indexv
    print(all_entries.keys())
    #input()
    return all_entries


def add_entry(conn, timestamp, index, warID, health, owner, regenPerSecond, players):
    """Add a new entry using the provided data."""
    cursor = conn.cursor()

    cursor.execute('''
    INSERT INTO alltimedata (timestamp, index, warID, health, owner, regenPerSecond, players)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        float(timestamp),
        int(index),
        int(warID),
        int(health),
        int(owner),
        float(regenPerSecond),
        int(players)
    ))
    conn.commit()

def check_and_load_json(filepath: str):
    '''Make sure the json at filepath exists, and load it.'''
    try:
        if os.path.exists(filepath) and os.path.isfile(filepath):
            with open(filepath, "r", encoding="utf8") as json_file:
                return json.load(json_file)
    except Exception as e:
        logger.error(str(e))
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
        logger.info("Naive datetime: %s, Timestamp string: %s", naive_datetime, timestamp_str)

        return naive_datetime
    else:
        raise ValueError("The timestamp string does not match the expected format.")


def extract_mo_details(text: str) -> Optional[Tuple[str, str, str, str]]:
    pattern = r"^(?P<type>.*?)\s*\|\s*(?P<name>.*?)(?P<case>\s(is issued|is won|is failed|was compromised))\s*\|\s*Objective:\s*(?P<objective>.*)$"
    match = re.match(pattern, text)
    if match:
        type_ = match.group("type")
        name = match.group("name").strip()
        case = match.group("case").strip()
        objective = match.group("objective").strip()
        return type_, name, case, objective
    else:
        return None



def extract_biome_change_details(text: str) -> Optional[Tuple[str, str, str, str, str, str,str]]:
    """
    Extracts biome change details from a text.

    Args:
        text (str): The input text containing biome change details.

    Returns:
        Optional[Tuple[str, str, str, str, str, str,str]]: Returns a tuple containing
        planet name, sector name, original biome, original type, new biome, new type, and slug if matched, else None.
    """
    
    pattern = r"(?P<planet>.*?) of the (?P<sector>.*?) sector's biome is changed from (?P<orig_biome>.*?) \[(?P<orig_type>.*?)\] to (?P<new_biome>.*?) \[(?P<new_type>.*?)\]"
    match = re.match(pattern, text)
    if match:
        planet = match.group("planet").strip()
        sector = match.group("sector").strip()
        orig_biome = match.group("orig_biome").strip()
        orig_type = match.group("orig_type").strip()
        new_biome = match.group("new_biome").strip()
        new_type = match.group("new_type").strip()
        slug='moor_baseplanet'
        for i, v in vjson['biomes'].items():
            if new_biome in v['name'] and new_type in v['name']:
                slug=i

            
        return planet, sector, orig_biome, orig_type, new_biome, new_type, slug
    else:
        return None


def get_planet_old(myplanets: Dict[str, int], text: str) -> List[Tuple[str, int]]:
    "Search through planet keys, and return the planets with the matching keys."
    planets = []
    t2=text
    keys = sorted(list(myplanets.keys()), key=len,reverse=True)
    for planet in keys:
        if planet.upper() in t2.upper():
            
            planets.append((planet, myplanets[planet]))
            t2 = re.sub(planet, '[PLANETPROCESSED]', t2, flags=re.IGNORECASE)
                
    return planets

def get_planet(myplanets: Dict[str, int], text: str) -> List[Tuple[str, int]]:
    "Search through planet keys and return the planets with matching keys, avoiding partial word matches."
    planets = []
    t2 = text
    keys = sorted(list(myplanets.keys()), key=len, reverse=True)

    for planet in keys:
        # Use \b word boundaries to ensure we match the full planet name
        if re.search(rf'\b{re.escape(planet)}\b', t2, flags=re.IGNORECASE):
            planets.append((planet, myplanets[planet]))
            # Replace the matched planet name with a placeholder to prevent re-matching
            t2 = re.sub(rf'\b{re.escape(planet)}\b', '[PLANETPROCESSED]', t2, flags=re.IGNORECASE)

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


def load_event_types(json_file: str) -> Dict[str, Any]:
    """Load event types from a JSON file."""
    with open(json_file, 'r') as file:
        return json.load(file)

def get_event_type(text: str, event_types: Dict[str, Any]) -> Tuple[str, str]:
    """Get the event type from the text."""
    text_lower = text.lower()
    
    for main_event, details in event_types.items():
        main_name = details.get("name", "")
        matchable_phrases = details.get("matchable", [])
        sub_events = details.get("sub", [])
        must=details.get("must", False)
        mode= details.get('mode','or')

        # Check main event matchable phrases
        if mode=='and':
            it=True
            for phrase in matchable_phrases:
                if phrase not in text_lower:
                    it=False
            if it:
                return main_name, ' '.join(matchable_phrases)
            continue
        for phrase in matchable_phrases:
            if phrase.lower() in text_lower:
                if not sub_events:
                    return main_name, phrase
                for sub_event in sub_events:
                    sub_name = sub_event.get("name", "")
                    sub_phrases = sub_event.get("matchable", [])
                    for sub_phrase in sub_phrases:
                        if sub_phrase.lower() in text_lower:
                            return sub_name, sub_phrase
                if not must:
                    return main_name, phrase
                
    return "unknown", "?????"



def make_day_obj() -> None:
    '''Load the HOWL google doc, create day/event/date dictionary'''
    print("Getting web file...")
    get_web_file()
    pattern = r"^(Day #(?P<day>\d+)\s+(?P<day_time>\d{1,2}:\d{2}+\s*(am|pm)\s+\d{1,2}(st|nd|rd|th)\s+\w+\s+(\d{4})*)|(?P<text>.*?)\s+\((?P<time>\d{1,2}:\d{2}+\s*(am|pm)?\s+UTC\s+\d{1,2}(st|nd|rd|th)\s+\w+\s*\d*)\))"
    text = open("./src/data/gen_data/text.md", "r", encoding="utf8").read()
    text = text.replace("’", "'")
    days= DaysObject()
    daykey = "DK"
    #Create the inital days dictionary.
    for line in text.split("\n"):
        matches = re.finditer(pattern, line, re.MULTILINE)
        for match in matches:
            if match.group("day"):
                timestamp = parse_timestamp(match.group("day_time"))
                daykey = f"{match.group('day')}"
                
                daykey = (timestamp - datetime(2024, 2, 7, 9, 0, tzinfo=timezone.utc)).days
                days.events.append(
                    GameEvent(
                        text=f"Day #{daykey} Start",
                        timestamp=timestamp.timestamp(),
                        time=timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                        day=int(daykey),
                    )
                )
            else:
                timestamp = parse_timestamp(match.group("time"))
                logger.info("Text: %s, Timestamp string: %s", match.group("text"), timestamp)
                day = (timestamp - datetime(2024, 2, 7, 9, 0, tzinfo=timezone.utc)).days
                days.events.append(
                    GameEvent(
                        text=match.group("text"),
                        timestamp=timestamp.timestamp(),
                        time=timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                        day=day,
                    )
                )
    with open("./src/data/gen_data/out.json", "w", encoding="utf8") as json_file:
        json.dump(days.model_dump(), json_file, indent=4)


def format_event_obj() -> None:
    '''Using the dictionary at out.json,
      determine the type of each event and the event parameters using the
      event text strings.'''

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
        logger.info("Text: %s, Time: %s, Planet: %s, Type: %s", event.text, event.time, event.planet, event.type)
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
    save_json_data("./src/data/gen_data/out2.json", days_out.model_dump(warnings='error'))
    with open("./src/data/gen_data/typesort.json", "w", encoding="utf8") as json_file:
        json.dump(event_type_sort, json_file,indent=2,sort_keys=True,default=str)


def get_unique_sectors(planets_Dict: Dict[str, Any]) -> List[str]:
    '''Return all unique sectors.'''
    sectors = [planet["sector"] for planet in planets_Dict.values()]
    return list(set(sectors))


def monitor_event(event: GameEvent, lasttime: datetime, newevents: List[GameEvent]) -> Tuple[List[GameEvent], datetime]:
    '''Add events between between two timestamps if the distance is great enough.'''
    time = datetime.fromtimestamp(event.timestamp, tz=timezone.utc)
    time = time - timedelta(minutes=time.minute)
    lasttime = lasttime - timedelta(minutes=lasttime.minute)
    while (time - lasttime) > timedelta(hours=MIN_HOUR_CHANGE):
        timestamp = lasttime + timedelta(
            hours=(MIN_HOUR_CHANGE - lasttime.hour % MIN_HOUR_CHANGE), minutes=(60-lasttime.minute)%60
        )
        dayval = (timestamp - datetime(2024, 2, 7, 9, 0, tzinfo=timezone.utc)).days

        new_evt=GameEvent(
                text="Monitoring",
                timestamp=timestamp.timestamp(),
                time=timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                day=dayval,
                planet=[],
                faction=0,
                type="monitor",
            )
        newevents.append(
            new_evt
        )
        lasttime = timestamp
    return newevents, lasttime

def sort_event_type(event: GameEvent, text: str, match: str, sectors: List[str], event_type_sort: Dict[str, Any]) -> Dict[str, Any]:
    '''Modify the event type sort dictionary, which determines which lines have an UNKNOWN event.'''
    if event.type == "unknown":
        event_type_sort["unknown"].append(text)
    else:
        if not event.type in event_type_sort:
            event_type_sort[event.type] = [text, [], {}]

        nt,dx = format_event_text(event, text, match, sectors)
        if nt not in event_type_sort[event.type][1]:
            event_type_sort[event.type][1].append(nt)
        for key, value in dx.items():
            if key not in event_type_sort[event.type][2]:
                event_type_sort[event.type][2][key]=[]
            if value not in  event_type_sort[event.type][2][key]:
                event_type_sort[event.type][2][key].append(value)
    return event_type_sort

def format_event_text(event: GameEvent, text: str, match: str, sectors: List[str]) -> str:
    '''For the typesort dictionary, format the event's text.'''
    special={}
    if "Major Order" in event.type:
        result = extract_mo_details(event.text)
        if result:
            type_, name, case, objective = result
            text = text.replace(type_, "[TYPE]").replace(name, "[MO NAME]").replace(case, "[MO CASE]").replace(objective, "[MO OBJECTIVE]")
            special={'TYPE':type_,'CASE':case,'OBJECTIVE':objective}
    else:
        text = text.replace(match, "[TYPETEXT]")
        special['TYPETEXT']=match
        for e, v in enumerate(event.planet):
            p, ind = v
            text = text.replace(p, f"[PLANET {e}]")
        e = sum(1 for s in sectors if s in text)
        text = re.sub(f"({'|'.join(sectors)})", lambda m: f"[SECTOR {e}]", text)
        faction=faction_dict.get(event.faction, "UNKNOWN")
        if faction in text:
            text = text.replace(faction, f"[FACTION]")
            special['FACTION']=faction
        text = re.sub(r"\#[0-9]*", lambda m: f"[DAY]", text)

    return text, special


def update_defenses(event: GameEvent, defenses: Dict[str, str]) -> Dict[str, str]:
    for p in event.planet:
        planet = p[1]
        if event.type == "defense start":
            defenses[planet] = event.faction
        if event.type == "defense won":
            defenses.pop(str(planet))
        if event.type == "defense lost":
            event.faction = defenses.pop(str(planet))
    return defenses



def human_format(num:float):
    """Format a large number"""

    # Format the number to 2 significant digits, converting it to float
    num = float("{:.3g}".format(num))

    magnitude = 0
    # Divide the number by 1000 until it's less than 1000, increasing the magnitude with each division
    while abs(num) >= 1000:
        magnitude += 1
        num /= 1000.0

    suffixes = ["", "K", "M", "B", "T", "Q", "Qi"]  # Suffixes for each magnitude step
    # Convert the number to string, remove trailing zeros and dots, and append the appropriate suffix
    numa="{:f}".format(num).rstrip("0").rstrip(".")
    return int(float(numa)*(1000**magnitude))


def enote(num:int):
    #Anything smaller than 100 is to be ignored.
    num=(num//100)*100
    if num<10:
        return '<10'
    if num<100:
        return '<100'
    return num
    
    

hashlists = {}
valid_waypoints = {0:[]}

async def get_planet_stats(conn,ne: GameEvent, all_times_new: Dict[str, Dict[str, Any]], march_5th: datetime) -> Dict[int, Dict[str, Any]]:
    timestamp = str(ne.timestamp)
    dc = str(int(ne.day) // 30)
    cursor = conn.cursor()

    if dc not in all_times_new:
        ents=fetch_entries_by_dayval(conn,dc)
        #print(ents)
        all_times_new[dc] = ents

    if timestamp not in all_times_new[dc]:
        time = datetime.fromtimestamp(ne.timestamp, tz=timezone.utc)
        
        if time > march_5th:
            print(f"{ne.time} fetching game data for time {timestamp}")
            logger.info(f"{ne.time} fetching game data for time {timestamp}")
            planetstats = await get_game_stat_at_time(time)
            for pindex, details in planetstats.items():
                cursor.execute('''
                INSERT INTO alltimedata (timestamp, dayval,pindex, warID, health, owner, regenPerSecond, players)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    str(timestamp),
                    str(dc),
                    int(pindex),
                    int(details['warId']),
                    int(details['health']),
                    int(details['owner']),
                    float(details['regenPerSecond']),
                    int(details['players'])
                ))
            conn.commit()
            print("fetch complete")
            all_times_new[dc][timestamp] = planetstats
        else:
            all_times_new[dc][timestamp] = {}
    else:
        pass

    planetstats = all_times_new[dc][timestamp]
    return planetstats





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


def make_markdown_log(history:DaysObject):
    markdown_output = ["\n"]

    def make_entry(entry:GameEvent):
        for each in entry.log:
            if each.type == "Day Start":
                if (int(entry.day) % 10) == 0 or int(entry.day) == 1:
                    markdown_output.append(f"\n# Day: #{entry.day}\n")
                else:
                    markdown_output.append(f"\n### Day: #{entry.day}\n")
            elif each.type == "monitor":
                print("Skipping addition, monitoring")
                logger.info("Skipping addition, monitoring.")
            else:
                timestamp = datetime.fromtimestamp(entry.timestamp, tz=timezone.utc)
                formatted_time = timestamp.strftime("%Y-%m-%d %H:%M")
                # formatted_time = custom_strftime("%#I:%M%p UTC %b {S} %Y",timestamp)
                # formatted_time=formatted_time.replace("AM",'am')
                # formatted_time=formatted_time.replace("PM",'pm')
                text=f"{each.text}"
                for i, v in each.planet:
                    text=text.replace(i,f"*{i}*")
                markdown_output.append(f"{text} ({formatted_time})<br/>\n")

    for event in history.events:
        make_entry(event)
    return mainHeader + "".join(markdown_output)





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
    #hashc = hash((xor_hash,sum_hash))
    hashc=list(sorted(int_list))
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
                "biome":p.get('biome','unknown')
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
            store['mo'] = f"{name}, {objective}" if case == "is issued" else "Awaiting orders"

    event.mo = store.get("mo", "")

    if event.day not in days_out.days:
        days_out.days[int(event.day)] = int(index)
        days_out.dayind[int(event.day)] = []
    if days_out.lastday < int(event.day):
        days_out.lastday = int(event.day)
    if not int(index) in days_out.dayind[int(event.day)]:
        days_out.dayind[int(event.day)].append(int(index))

    planetclone = planets.copy()
    #Copy in last planet status
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

    event.galaxystate = planetclone
    return planetclone



def update_planet_stats(
    planetclone: Dict[str, PlanetState], planetstats: Dict[int, Dict[str, Any]]
) -> None:
    '''Update HP, regenPerSecond, and playercount'''
    for i, v in planetstats.items():
        if str(i) in planetclone:
            planetclone[str(i)].hp = v.get("health", 0)
            lastregen=planetclone[str(i)].r 
            if lastregen!=float(v.get("regenPerSecond", 0)):
                print(f"planet {i} decay change to {lastregen}")
            planetclone[str(i)].r = float(v.get("regenPerSecond", 0))
            planetclone[str(i)].pl = enote(v.get("players", 0))

def check_planet_stats_for_change(
    planetclone: Dict[str, PlanetState], planetstats: Dict[int, Dict[str, Any]]
) -> bool:
    '''check HP, regenPerSecond, and playercount'''
    decay_change=False
    hp_change=False
    times=100000
    for i, v in planetstats.items():
        if str(i) in planetclone:
            lasthp=planetclone[str(i)].hp
            if lasthp:
                if lasthp//times!=v.get("health",0)//times:
                    hp_change=True
            lastregen=planetclone[str(i)].r 
            if lastregen!=float(v.get("regenPerSecond", 0)):
                decay_change=True
                print(f"planet {i} decay change to {lastregen}")
            #planetclone[str(i)].r = float(v.get("regenPerSecond", 0))
            #planetclone[str(i)].pl = enote(v.get("players", 0))
    
    logger.info(f"checking the planet stats: hp:{hp_change}, decay:{decay_change} are significant")
    return decay_change or hp_change

def update_planet_ownership(
    event: GameEvent, planetclone: Dict[str, PlanetState]
) -> None:
    '''Update planet ownership and warp links, if applicable.'''
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
            if event.type=="no_gloom":
                planetclone[str(ind)].gls=None
            elif event.type=="light_gloom":
                planetclone[str(ind)].gls=1
            elif event.type=="medium_gloom":
                planetclone[str(ind)].gls=2
            elif event.type=="heavy_gloom":
                planetclone[str(ind)].gls=3
            elif event.type=="gloom_border":
                planetclone[str(ind)].gls=4
        
        if event.type == "Biome Change":
            _,_,_,_,_,_,slug= extract_biome_change_details(event.text)
            planetclone[str(ind)].biome=slug
        if event.type =="Black Hole":
            planetclone[str(ind)].biome='blackhole'

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




def add_waypoint(
    planetclone: Dict[str, PlanetState], ind: int, other_ind: int
) -> None:
    if not planetclone[str(ind)].link:
        planetclone[str(ind)].link = []
    if int(other_ind) not in planetclone[str(ind)].link:
        if planetclone[str(other_ind)].link and (
            int(ind) in planetclone[str(other_ind)].link
        ):
            return
        planetclone[str(ind)].link.append(int(other_ind))


def remove_waypoint(
    planetclone: Dict[str,PlanetState], ind: int, other_ind: int
) -> None:
    if planetclone[str(ind)].link:
        while int(other_ind) in planetclone[str(ind)].link:
            planetclone[str(ind)].link.remove(int(other_ind))

    if planetclone[str(other_ind)].link:
        while int(ind) in planetclone[str(other_ind)].link:
            planetclone[str(other_ind)].link.remove(int(ind))

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




async def main_code() -> None:
    '''Create the historydata.json file using result from format_event_object.'''
    conn = sqlite3.connect(DATABASE_FILE)
    planetlist: List[Tuple[int, Dict[str, Any]]] = []
    planets, temp = initialize_planets()
    planetlist.append((0, planets))
    logger.info("loading objects")
    days_out =DaysObject(**check_and_load_json("./src/data/gen_data/out2.json"))
    logger.info('done')
    d = 0

    all_times_new = {}

    lastday: int = 0
    laststats: Dict[int, Dict[str, Any]] = {}
    march_5th = datetime(2024, 3, 5, tzinfo=timezone.utc)
    store: Dict[str, str] = {}
    galaxy_states =GalaxyStates(gstatic=planets,states={})
    days_out.days = {}
    days_out.galaxystatic = planets
    
    days_out.lastday = 1
    days_out.dayind = {}
    #days_out["new_events"] = []

    events_by_timestamp = {}
    # Inital event grouping.
    for i, event in enumerate(days_out.events):
        # Group all events by the timestamp in which they occoured.
        timestamp = event.timestamp
        if timestamp not in events_by_timestamp:
            events_by_timestamp[timestamp] = []
        events_by_timestamp[timestamp].append(event)
    newevt = []
    grouped_events = list(events_by_timestamp.values())
    days_out.timestamps=[]
    last_time=0
    for i, event_group in enumerate(grouped_events):
        elog = []
        ne = GameEvent(
            timestamp=event_group[0].timestamp,
            time=event_group[0].time,
            day=event_group[0].day,
            
        )
        if event_group[0].type=='monitor':
            ne.type='m'
        else:
            ne.type='g'
            last_time=ne.timestamp

        #Add eind- this is the overall event group index.
        
        planetstats=await get_planet_stats(conn,ne,all_times_new,march_5th)
        all_players=0
        for ie, v in planetstats.items():
            if 'players' in v:
                all_players+=v['players']
        ne.all_players=all_players
        print(f"On event group number {i}, timestamp {ne.time}")
        logger.info(f"On event group number {i}, timestamp {ne.time}")
        ptemp={k:v.model_copy(deep=True) for k, v in temp.items()}
        if ne.type=='m':
            time_since=ne.timestamp-last_time
            if time_since<MAX_HOUR_DISTANCE*60*60:
                dc = str(int(ne.day) // 30)
    
                time = datetime.fromtimestamp(ne.timestamp, tz=timezone.utc)
                planetstats = all_times_new[str(dc)][str(ne.timestamp)]
                if check_planet_stats_for_change(ptemp,planetstats):
                    print("Checking for max hour difference...")
                    logger.info(f"On event group number {i}, Planet Stats changed significantly between calls.")
                else:
                    logger.info(f"On event group number {i}, disreguarding outcome.")
                    continue
            time_since=ne.timestamp
        if not int(ne.timestamp) in days_out.timestamps:
            days_out.timestamps.append(int(ne.timestamp))
        ind = days_out.timestamps.index(int(ne.timestamp))
        ne.eind=ind


        for e, event in enumerate(event_group):
            #
            ptemp = await process_event(
                days_out,
                ptemp,
                laststats,
                event,
                i,
                store,
                all_times_new,
            )
            elog.append(
                GameSubEvent(
                    planet=event.planet,
                    text=event.text,
                    type=event.type,
                    faction=event.faction,
                )
            )
            #ne.galaxystate = event.galaxystate
            galaxy_states.states[int(ne.eind)] = ptemp
            temp=ptemp
            ne.mo = event.mo
        ne.log = elog
        newevt.append(ne)
    days_out.events = newevt
    bef = 0
    aft = 0



    markdowncode = make_markdown_log(days_out)
    # print(markdowncode)
    with open("./src/history_log_full.md", "w", encoding="utf8") as file:
        file.write(markdowncode)
    logger.info("saving data")
    print("saving data")
    save_json_data("./src/data/historydata.json", days_out.model_dump(exclude_none=True,warnings='error'))
    logger.info("saving time caches...")
    print("saving time caches...")
    # for d, v in all_times_new.items():
    #     logger.info(f"saving time cache for day set {d}")
    #     print(f"saving time cache for day set {d}")
    #     save_json_data(f"./src/data/gen_data/alltimes_{d}.json", all_times_new[d])
    hashlinks={}

    resort={}
    laststate={}
    
    for t, s in galaxy_states.states.items():
        for p, resa in s.items():
            if isinstance(resa.link,list):
                link=unordered_list_hash(resa.link)
                if not link in hashlinks:
                    hashlinks[link]=resa.link
                else:
                    #print(link)
                    if sorted(resa.link)!=sorted(hashlinks[link]):
                        logger.warning("MISMATCH: resa.link=%s, hashlinks[link]=%s", resa.link, hashlinks[link])
                    #hashlists[link][1]+=1
                bef+=len(str(resa.link))
                resa.link2=link
                resa.link=None
                aft+=len(str(link))
        if laststate:
            for p, rese in s.items():
                res=rese.model_dump(warnings='error')
                if not p in resort:
                    resort[p]=[]
                
                last=laststate[p]
                keys_all=list(res.keys())
                keysb=list(last.keys())

                keysa=set(last.keys())
                keysb=set(res.keys())

                toad={}
                for key in keys_all:
                    if key not in laststate[p]:
                        laststate[p][key]=None
                    if laststate[p][key]!=res[key]:
                        toad[key]=res[key]
                if toad:
                    #eind is event index
                    toad['eind']=t
                    resort[p].append(toad)
        else:
            for p, rese in s.items():
                res=rese.model_dump(warnings='error')
                if not p in resort:
                    #eind is event index
                    resort[p]=[res]
                    resort[p][0]['eind']=t
        laststate={k: v.model_dump(warnings='error') for k, v in s.items() }
    print("saving galaxy states.")
    logger.info("saving galaxy states.")
    galaxy_states.states={}
    galaxy_states.gstate=resort
    galaxy_states.links=hashlinks
    for state_name, state_value in galaxy_states.__dict__.items():
        # process each state as needed
        print(state_name)
        logger.info("%s", state_name)
        if isinstance(state_value, BaseModel):
            print(state_value.model_dump(warnings='error'))
            logger.info("%s", state_value.model_dump(warnings='error'))
        else:
            print(f"Expected BaseModel but got {type(state_value).__name__} for {state_name}")
            logger.info("Expected BaseModel but got %s for %s", type(state_value).__name__, state_name)


    save_json_data("./src/data/gstates.json", galaxy_states.model_dump(warnings='error'))
    print(bef, aft)
    logger.info("%s %s", bef, aft)
    print(hashlists)
    logger.info("%s", hashlists)
    
    save_json_data("./src/data/resort.json", resort,indent=3)
    conn.close()


def save_json_data(file_path: str, data: Any,**kwargs) -> None:
    '''Save json data to a file.'''
    with open(file_path, "w", encoding="utf8") as json_file:
        json.dump(data, json_file,**kwargs)



if not os.path.exists("./src/data/gen_data"):

    os.makedirs("./src/data/gen_data", exist_ok=True)
    raise FileNotFoundError("The directory ./src/data/gen_data does not exist.")

#asyncio.run(create_planet_sectors())
print("Starting up...")
make_day_obj()
format_event_obj()

asyncio.run(main_code())
