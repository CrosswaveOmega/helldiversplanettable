import json

import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timezone
from datetime import datetime
from script_making.models import (
    GameEvent,
    DaysObject,
)

from script_making.web_utils import get_web_file

logger = logging.getLogger("StatusLogger")


faction_dict = {1: "Human", 2: "Terminid", 3: "Automaton", 4: "Illuminate"}


def suffix(d):
    return {1: "st", 2: "nd", 3: "rd"}.get(d % 20, "th")


def custom_strftime(format, t):
    return t.strftime(format).replace("{S}", str(t.day) + suffix(t.day))


def get_planet(myplanets: Dict[str, int], text: str) -> List[Tuple[str, int]]:
    "Search through planet keys and return the planets with matching keys, avoiding partial word matches."
    planets = []
    t2 = text
    keys = sorted(list(myplanets.keys()), key=len, reverse=True)

    for planet in keys:
        if re.search(rf"\b{re.escape(planet)}\b", t2, flags=re.IGNORECASE):
            planets.append((planet, myplanets[planet]))
            # Replace the matched planet name with a placeholder to prevent re-matching
            t2 = re.sub(
                rf"\b{re.escape(planet)}\b",
                "[PLANETPROCESSED]",
                t2,
                flags=re.IGNORECASE,
            )

    return planets


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
        logger.info(
            "Naive datetime: %s, Timestamp string: %s", naive_datetime, timestamp_str
        )

        return naive_datetime
    else:
        raise ValueError("The timestamp string does not match the expected format.")


def make_day_obj(text: str) -> None:
    """Load the HOWL google doc, create day/event/date dictionary"""
    print("Getting web file...")

    pattern = r"^(Day #(?P<day>\d+)\s+(?P<day_time>\d{1,2}:\d{2}+\s*(am|pm)\s+\d{1,2}(st|nd|rd|th)\s+\w+\s+(\d{4})*)|(?P<text>.*?)\s+\((?P<time>\d{1,2}:\d{2}+\s*(am|pm)?\s+UTC\s+\d{1,2}(st|nd|rd|th)\s+\w+\s*\d*)\))"
    text = text.replace("’", "'")
    days = DaysObject(events_all=[])
    daykey = "DK"
    # Create the inital days dictionary.
    for line in text.split("\n"):
        matches = re.finditer(pattern, line, re.MULTILINE)
        for match in matches:
            if match.group("day"):
                timestamp = parse_timestamp(match.group("day_time"))
                daykey = f"{match.group('day')}"

                daykey = (
                    timestamp - datetime(2024, 2, 7, 9, 0, tzinfo=timezone.utc)
                ).days
                days.events_all.append(
                    GameEvent(
                        text=f"Day #{daykey} Start",
                        timestamp=timestamp.timestamp(),
                        time=timestamp.strftime("%Y-%m-%d %H:%M"),
                        day=int(daykey),
                    )
                )
            else:
                timestamp = parse_timestamp(match.group("time"))
                logger.info(
                    "Text: %s, Timestamp string: %s", match.group("text"), timestamp
                )
                day = (timestamp - datetime(2024, 2, 7, 9, 0, tzinfo=timezone.utc)).days
                days.events_all.append(
                    GameEvent(
                        text=match.group("text"),
                        timestamp=timestamp.timestamp(),
                        time=timestamp.strftime("%Y-%m-%d %H:%M"),
                        day=day,
                    )
                )
    with open("./src/data/gen_data/out.json", "w", encoding="utf8") as json_file:
        json.dump(days.model_dump(), json_file, indent=4)


def format_event_text(
    event: GameEvent, text: str, match: str, sectors: List[str]
) -> str:
    """For the typesort dictionary, format the event's text."""
    special = {}
    if "Major Order" in event.type:
        result = extract_mo_details(event.text)
        if result:
            type_, name, case, objective = result
            text = (
                text.replace(type_, "[TYPE]")
                .replace(name, "[MO NAME]")
                .replace(case, "[MO CASE]")
                .replace(objective, "[MO OBJECTIVE]")
            )
            special = {"TYPE": type_, "CASE": case, "OBJECTIVE": objective}
    else:
        text = text.replace(match, "[TYPETEXT]")
        special["TYPETEXT"] = match
        for e, v in enumerate(event.planet):
            p, ind = v
            text = text.replace(p, f"[PLANET {e}]")
        e = sum(1 for s in sectors if s in text)
        text = re.sub(f"({'|'.join(sectors)})", lambda m: f"[SECTOR {e}]", text)
        faction = faction_dict.get(event.faction, "UNKNOWN")
        if faction in text:
            text = text.replace(faction, "[FACTION]")
            special["FACTION"] = faction
        text = re.sub(r"\#[0-9]*", lambda m: "[DAY]", text)

    return text, special


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


def extract_poi_details(text: str):
    match = re.search(r"is established as a (.*?) POI", text)

    if match:
        return match.group(1)

    match = re.search(r"of the .*?'s (.*?) POI", text)

    if match:
        return match.group(1)
    return "SITEUNKNOWN"


def extract_assault_division(text: str):
    match = re.search(r"Assault Division: (.*?) deploys", text)

    if match:
        return match.group(1)

    match = re.search(r"Assault Division: (.*?) leaves", text)
    if match:
        return match.group(1)

    match = re.search(r"Assault Division: (.*?) is routed", text)
    if match:
        return match.group(1)

    return "SITEUNKNOWN"


def extract_biome_change_details(
    text: str,
    biomes: Dict[str, Any],
) -> Optional[Tuple[str, str, str, str, str, str, str]]:
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
        slug = "moor_baseplanet"
        for i, v in biomes.items():
            if new_biome in v["name"] and new_type in v["name"]:
                slug = i

        return planet, sector, orig_biome, orig_type, new_biome, new_type, slug
    else:
        return None


def sort_event_type(
    event: GameEvent,
    text: str,
    match: str,
    sectors: List[str],
    event_type_sort: Dict[str, Any],
) -> Dict[str, Any]:
    """Modify the event type sort dictionary, which determines which lines have an UNKNOWN event."""
    if event.type == "unknown":
        event_type_sort["unknown"].append(text)
    else:
        if not event.type in event_type_sort:
            event_type_sort[event.type] = [text, [], {}]

        nt, dx = format_event_text(event, text, match, sectors)
        if nt not in event_type_sort[event.type][1]:
            event_type_sort[event.type][1].append(nt)
        for key, value in dx.items():
            if key not in event_type_sort[event.type][2]:
                event_type_sort[event.type][2][key] = []
            if value not in event_type_sort[event.type][2][key]:
                event_type_sort[event.type][2][key].append(value)
    return event_type_sort


def get_faction(text: str) -> int:
    "Get the Faction from the text."
    if "ILLUMINATE" in text.upper() or "ILLUMIN" in text.upper():
        return 4
    if "AUTOMATON" in text.upper() or "AUTOMAT" in text.upper():
        return 3
    if "TERMINID" in text.upper():
        return 2
    if "HUMAN" in text.upper():
        return 1
    return 0


def get_unique_sectors(planets_Dict: Dict[str, Any]) -> List[str]:
    """Return all unique sectors."""
    sectors = [planet["sector"] for planet in planets_Dict.values()]
    return list(set(sectors))


def update_defenses(event: GameEvent, defenses: Dict[str, str]) -> Dict[str, str]:
    for p in event.planet:
        planet = p[1]
        if event.type == "defense start":
            defenses[planet] = event.faction
        if event.type == "invasion start":
            defenses[planet] = event.faction
        if event.type == "defense won":
            defenses.pop(str(planet))
        if event.type == "invasion won":
            defenses.pop(str(planet))
        if event.type == "defense lost":
            event.faction = defenses.pop(str(planet))
        if event.type == "invasion lost":
            event.faction = defenses.pop(str(planet))
    return defenses


def human_format(num: float):
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
    numa = "{:f}".format(num).rstrip("0").rstrip(".")
    return int(float(numa) * (1000**magnitude))


def enote(num: int):
    # Anything smaller than 100 is to be ignored.
    num = (num // 100) * 100
    if num < 10:
        return "<10"
    if num < 100:
        return "<100"
    return num


def get_event_type(text: str, event_types: Dict[str, Any]) -> Tuple[str, str]:
    """Get the event type from the text."""
    text_lower = text.lower()

    for main_event, details in event_types.items():
        main_name = details.get("name", "")
        matchable_phrases = details.get("matchable", [])
        sub_events = details.get("sub", [])
        must = details.get("must", False)
        mode = details.get("mode", "or")

        # Check main event matchable phrases
        if mode == "and":
            it = True
            for phrase in matchable_phrases:
                if phrase not in text_lower:
                    it = False
            if it:
                return main_name, " ".join(matchable_phrases)
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


def longest_common_substring(s1, s2):
    s1, s2 = s1.upper(), s2.upper()
    m = [[0] * (1 + len(s2)) for _ in range(1 + len(s1))]
    longest, x_longest = 0, 0
    for x in range(1, 1 + len(s1)):
        for y in range(1, 1 + len(s2)):
            if s1[x - 1] == s2[y - 1]:
                m[x][y] = m[x - 1][y - 1] + 1
                if m[x][y] > longest:
                    longest = m[x][y]
                    x_longest = x
            else:
                m[x][y] = 0
    return s1[x_longest - longest : x_longest]
