import sqlite3

from typing import Any, Dict, List, Optional, Tuple, Union

PlanetStatusDict = Dict[str, Dict[str, float]]

PlanetStatusTimestamp = Dict[str, PlanetStatusDict]
PlanetStatusDays = Dict[str, PlanetStatusTimestamp]


def fetch_entries_by_timestamp(
    conn: sqlite3.Connection, timestamp: float
) -> Dict[int, Dict[str, Any]]:
    """Fetch all entries with a given timestamp."""
    cursor = conn.cursor()

    cursor.execute(
        """
    SELECT * FROM alltimedata WHERE timestamp = ?
    """,
        (str(timestamp),)
    )
    entries = cursor.fetchall()
    print(entries)
    keys = [column[0] for column in cursor.description]
    print(entries,keys)
    all_entries = {}
    for index, entry in enumerate(entries):
        indexv = {key: entry[i] for i, key in enumerate(keys)}
        all_entries[indexv["pindex"]] = indexv
    return all_entries


def fetch_entries_by_dayval(conn: sqlite3.Connection, dayval: int) -> PlanetStatusDays:
    """Fetch all entries with the same dayval."""
    cursor = conn.cursor()
    print(f"FETCHING ALL VALUES FOR DAYVAL {dayval}")
    cursor.execute(
        """
    SELECT * FROM alltimedata WHERE dayval = ?
    """,
        (str(dayval),),
    )
    entries = cursor.fetchall()
    keys = [column[0] for column in cursor.description]
    all_entries = {}
    for entry in entries:
        indexv = {key: entry[i] for i, key in enumerate(keys)}
        timestamp = indexv["timestamp"]
        if timestamp not in all_entries:
            all_entries[timestamp] = {}
        all_entries[timestamp][indexv["pindex"]] = indexv
    print(all_entries.keys())
    # input()
    return all_entries


def add_entry(
    conn: sqlite3.Connection,
    timestamp: float,
    index: int,
    warID: int,
    health: int,
    owner: int,
    regenPerSecond: float,
    players: int,
) -> None:
    """Add a new entry using the provided data."""
    cursor = conn.cursor()

    cursor.execute(
        """
    INSERT INTO alltimedata (timestamp, index, warID, health, owner, regenPerSecond, players)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """,
        (
            float(timestamp),
            int(index),
            int(warID),
            int(health),
            int(owner),
            float(regenPerSecond),
            int(players),
        ),
    )
    conn.commit()
