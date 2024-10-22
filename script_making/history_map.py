import logging
from typing import Any, Dict, List, Tuple
from script_making.format_utils import enote, faction_dict
from script_making.models import DaysObject, PlanetState, GameEvent


MAX_HOUR_DISTANCE = 6

logger = logging.getLogger("StatusLogger")


def add_waypoint(planetclone: Dict[str, PlanetState], ind: int, other_ind: int) -> None:
    if not planetclone[str(ind)].link:
        planetclone[str(ind)].link = []
    if int(other_ind) not in planetclone[str(ind)].link:
        if planetclone[str(other_ind)].link and (
            int(ind) in planetclone[str(other_ind)].link
        ):
            return
        planetclone[str(ind)].link.append(int(other_ind))


def remove_waypoint(
    planetclone: Dict[str, PlanetState], ind: int, other_ind: int
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


def all_in_same_sector(planet_list, all_planets):
    first_sector = planet_list[0]["sector"]
    return all(planet["sector"] == first_sector for planet in planet_list)


def all_have_same_owner(planet_list, all_planets):
    first_owner = planet_list[0]["owner"]
    return all(planet["owner"] == first_owner for planet in planet_list)


def group_by_sector(planet_list, all_planets):
    # Get the sector of the first planet in the list
    sectors = {}
    for pl in planet_list:
        if not pl["sector"] in sectors:
            sectors[pl["sector"]] = []
        sectors[pl["sector"]].append(pl)
    print(sectors)
    return list(sectors.keys())


def derive_decay_names(names, vjson):
    if len(names) <= 3:
        return [s["name"] for s in names]
    same_sector = all_in_same_sector(names, vjson["planets"])
    same_owner = all_have_same_owner(names, vjson["planets"])

    if same_sector:
        return [names[0]["sector"] + " sector"]
    elif same_owner:
        return [faction_dict.get(names[0]["owner"], "???") + " worlds"]
    elif len(names) > 7:
        sectors = group_by_sector(names, vjson)
        return [s + " sector" for s in sectors]
    else:
        return [s["name"] for s in names]


def group_events_by_timestamp(days_out: DaysObject) -> List[List[GameEvent]]:
    """
    Groups events by their timestamps.

    Args:
        days_out (DaysObject): Object containing a list of events.

    Returns:
        List[List[GameEvent]]: A list of lists, where each sublist
        contains events that occurred at the same timestamp.
    """
    events_by_timestamp = {}
    # Inital event grouping.
    for i, event in enumerate(days_out.events_all):
        print(i, event)
        timestamp = event.timestamp
        if timestamp not in events_by_timestamp:
            events_by_timestamp[timestamp] = []
        events_by_timestamp[timestamp].append(event)
    outs = list(events_by_timestamp.values())
    days_out.events_all = []
    return outs


def check_planet_stats_for_change(
    planetclone: Dict[str, PlanetState], planetstats: Dict[int, Dict[str, Any]]
) -> bool:
    """check if HP or decay changed"""
    decay_change = False
    hp_change = False
    times = 250000

    decay_changed_on = []
    hp_changed_on = []

    for i, v in planetstats.items():
        if str(i) in planetclone:
            lasthp = planetclone[str(i)].hp
            if lasthp:
                if lasthp // times != v.get("health", 0) // times:
                    hp_change = True
                    hp_changed_on.append((i, v.get("owner", 0), v.get("health", 0)))
            lastregen = planetclone[str(i)].r
            if lastregen != float(v.get("regenPerSecond", 0)):
                decay_change = True
                newregen = v.get("regenPerSecond", 0)
                decay_changed_on.append((i, v.get("owner", 0), newregen))
                # print(f"planet {i} decay change to {newregen}")

    logger.info(
        f"checking the planet stats: hp:{hp_change}, decay:{decay_change} are significant"
    )
    return decay_changed_on, hp_changed_on


def check_planet_stats_dict_for_change(
    planetclone: Dict[str, Dict[str, Any]], planetstats: Dict[int, Dict[str, Any]]
) -> bool:
    """check if HP or decay changed"""
    decay_change = False
    hp_change = False
    times = 250000

    decay_changed_on = []
    hp_changed_on = []

    for i, v in planetstats.items():
        if i in planetclone:
            lasthp = planetclone[i]["health"]
            if lasthp:
                if lasthp // times != v.get("health", 0) // times:
                    hp_change = True
                    hp_changed_on.append((i, v.get("owner", 0), v.get("health", 0)))
            lastregen = planetclone[i]["regenPerSecond"]
            if lastregen != float(v.get("regenPerSecond", 0)):
                decay_change = True
                newregen = v.get("regenPerSecond", 0)
                decay_changed_on.append((i, v.get("owner", 0), newregen))
                # print(f"planet {i} decay change to {newregen}")
        else:
            newregen = v.get("regenPerSecond", 0)
            decay_changed_on.append((i, v.get("owner", 0), newregen))

    logger.info(
        f"checking the planet stats: hp:{hp_change}, decay:{decay_change} are significant"
    )
    return decay_changed_on, hp_changed_on
