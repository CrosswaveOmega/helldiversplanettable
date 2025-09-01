"""This code will fetch the current game statistics from the
Helldivers 2 community API wrapper, and saves them to a csv and json file."""

import sys
from typing import *
import aiohttp
import asyncio
import json
from pydantic import Field, BaseModel


# Define Statistics model using Pydantic for better type validation
class Statistics(BaseModel):
    missionsWon: Optional[int] = Field(alias="missionsWon", default=0)
    missionsLost: Optional[int] = Field(alias="missionsLost", default=0)
    missionTime: Optional[int] = Field(alias="missionTime", default=0)
    terminidKills: Optional[int] = Field(alias="terminidKills", default=0)
    automatonKills: Optional[int] = Field(alias="automatonKills", default=0)
    illuminateKills: Optional[int] = Field(alias="illuminateKills", default=0)
    bulletsFired: Optional[int] = Field(alias="bulletsFired", default=0)
    bulletsHit: Optional[int] = Field(alias="bulletsHit", default=0)
    timePlayed: Optional[int] = Field(alias="timePlayed", default=0)
    deaths: Optional[int] = Field(alias="deaths", default=0)
    revives: Optional[int] = Field(alias="revives", default=0)
    friendlies: Optional[int] = Field(alias="friendlies", default=0)
    missionSuccessRate: Optional[int] = Field(alias="missionSuccessRate", default=0)
    accuracy: Optional[int] = Field(alias="accuracy", default=0)
    playerCount: Optional[int] = Field(alias="playerCount", default=0)


# Fetch data asynchronously from a URL
async def fetch_planets_json() -> Any:
    """Fetch the planets endpoint from the helldivers-2 community api.
    While it is possible to use arrowhead's api directly, the
    community api formats the planet data into one call.
    """
    url = "https://api.helldivers2.dev/api/v1/planets"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Super-Client": "stat_table_builder",
        "X-Super-Contact": "contact",
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            response.raise_for_status()
            return await response.json()


# Get the "front" of the planet
def get_planet_fronts(
    planet_index: int, planets: Dict[str, Dict[str, Any]]
) -> List[str]:
    """The front is determined by the which occupied planets the current one
    is connected to via waypoint.  So if a planet is connected to planets with
    human and automation owners, the front will be HUMANS, AUTOMATON"""
    results = depth_first_planet_search(planet_index, planets)
    fronts = {
        planets[index]["currentOwner"].upper() for index in results if index in planets
    }
    return list(fronts)


# Perform depth-first search to gather connected planets
def depth_first_planet_search(
    planet_index: int, planets: Dict[str, Dict[str, Any]]
) -> List[int]:
    """Get all connected planets to the current index."""
    visited = set()
    stack = [planet_index]
    result = []

    while stack:
        current_index = stack.pop()
        planet = planets.get(current_index)
        if not planet:
            continue
        if planet["index"] not in visited:
            visited.add(planet["index"])
            result.append(planet["index"])
            for neighbor_index in planet["waypoints"]:
                stack.append(neighbor_index)
            for v in planets.values():
                if current_index in v["waypoints"]:
                    stack.append(v["index"])

    return result


# Add biome and hazards information to a planet
def add_overrides(allplanet: Dict[str, Any], index: int) -> Tuple[str, str]:
    """Retrieve the current biome and hazard data from the allplanet dictionary."""
    central = allplanet["planets"].get(str(index))
    if not central:
        return "unknown", "none"

    biome = (
        allplanet["biomes"].get(central["biome"], {}).get("name", "[GWW SEARCH ERROR]")
    )
    hazards = ", ".join(
        allplanet["environmentals"]
        .get(hazard, {})
        .get("name", "Unknown Hazard")
        .upper()
        for hazard in central["environmentals"]
    )
    return biome, hazards


def bad_stats_filter(planet, stats):
    """Remove any api errors
    , currently in Rirga Bay's death count."""
    if planet["index"] == 226:
        stats.deaths = stats.deaths - 1000000000  # 65244
        stats.illuminateKills = stats.illuminateKills - 1000000000  # 65244

    return stats


# Main function to gather data and write to a CSV file
def make_rows(planets: Dict, allplanet: Dict):
    # format the data retrieved from API into a list of CSV rows.
    rows = []
    sector_fronts = {}
    for _, planet in planets.items():
        index = planet["index"]
        front = get_planet_fronts(index, planets)
        # Remove human faction from front list for easier reading.
        if "HUMANS" in front and len(front) > 1:
            front.remove("HUMANS")
        tf = ",".join(front)
        if planet["sector"].upper() in sector_fronts:
            if sector_fronts[planet["sector"].upper()] == "HUMANS":
                sector_fronts[planet["sector"].upper()] = tf
        else:
            sector_fronts[planet["sector"].upper()] = tf
    for _, planet in planets.items():
        # Each planet is identified by an integer, not a name.
        index = planet["index"]
        # create biome and hazards using the allplanet.json file.
        # because, again, the community api won't update the files.
        biome, hazards = add_overrides(allplanet, index)
        # The statistics are loaded into a special container object.
        # This is to keep the code easier to read.
        stats = Statistics(**planet["statistics"])

        stats = bad_stats_filter(planet, stats)
        missions = (stats.missionsWon) + (stats.missionsLost)
        kills = sum([stats.terminidKills, stats.automatonKills, stats.illuminateKills])

        front = get_planet_fronts(index, planets)
        # Remove human faction from front list for easier reading.
        if "HUMANS" in front and len(front) > 1:
            front.remove("HUMANS")

        row = {
            "index": planet["index"],
            "planet_name": planet["name"],
            "sector_name": planet["sector"].upper(),
            "front": ",".join(front),
            "sector_front": sector_fronts[planet["sector"].upper()],
            "initial_owner": planet["initialOwner"],
            "current_owner": planet["currentOwner"],
            "position": planet["position"],
            "waypoints": planet["waypoints"],
            "player_count": stats.playerCount,
            "image": f"planet_{planet['index']}_rotate.gif",
            "missionsWon": stats.missionsWon,
            "missionsLost": stats.missionsLost,
            "missionTime": stats.missionTime,
            "missionsTotal": missions,
            "timePerMission": (
                0 if missions <= 0 else (stats.missionTime or 0) / missions
            ),
            "kills": kills,
            "bug_kills": stats.terminidKills,
            "bot_kills": stats.automatonKills,
            "squid_kills": stats.illuminateKills,
            "bulletsFired": stats.bulletsFired,
            "bulletsHit": stats.bulletsHit,
            "timePlayed": stats.timePlayed,
            "timePlayedPerMission": (
                0 if missions <= 0 else (stats.timePlayed or 0) / missions
            ),
            "deaths": stats.deaths,
            "revives": stats.revives,
            "friendlies": stats.friendlies,
            "MSR": stats.missionSuccessRate,
            "accuracy": stats.accuracy,
            "DPM": 0 if missions <= 0 else (stats.deaths or 0) / missions,
            "KPM": 0 if missions <= 0 else kills / missions,
            "KTD": kills / max(stats.deaths or 1, 1),
            "FKR": ((stats.friendlies) / max(stats.deaths, 1)) * 100.0,
            "WTL": (
                0
                if stats.missionsLost <= 0 or stats.missionsWon <= 0
                else (stats.missionsWon or 0) / max(stats.missionsLost or 1, 1)
            ),
            "biome": biome,
            "hazards": hazards,
        }
        rows.append(row)
    return rows


async def main():
    # Fetch the current game data from the community api wrapper.
    planet_list = await fetch_planets_json()
    # allplanet.json is a massive JSON file that lists the current
    # Biome and Hazards of each planet.  While biome and hazards are
    # present in the community api, they haven't been updated since march 2024.

    allplanet = {}
    with open("allplanet.json", "r") as f:
        allplanet = json.load(f)

    #
    # with open("current_api_output.json", "w+") as jsonf:  json.dump(planet_list, jsonf, sort_keys=True, indent=4)

    planets = {p["index"]: p for p in planet_list}
    rows = make_rows(planets, allplanet)

    json.dump(rows, sys.stdout)


asyncio.run(main())
