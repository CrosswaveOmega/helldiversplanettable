import sqlite3

from typing import Any, Dict, List, Optional, Tuple, Union

PlanetStatusDict = Dict[str, Dict[str, float]]
# They're structurally identical
RegionStatusDict = PlanetStatusDict

PlanetStatusTimestamp = Dict[str, PlanetStatusDict]
PlanetStatusDays = Dict[str, PlanetStatusTimestamp]

RegionStatusDays = Dict[str, PlanetStatusTimestamp]


def migrate_tables(conn: sqlite3.Connection) -> bool:
    """Create tables"""
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(alltimedata)")
    columns = cursor.fetchall()
    if not any(column[1] == "interval" for column in columns):
        cursor.execute("ALTER TABLE alltimedata ADD COLUMN interval INTEGER")
        print("migrating...")
        cursor.execute(
            """
        UPDATE alltimedata SET interval = CAST(timestamp AS INTEGER) / 900
        """
        )

    conn.commit()
    return True


def initalize_tables(conn: sqlite3.Connection) -> bool:
    """Create tables"""
    cursor = conn.cursor()
    script = """
    CREATE TABLE IF NOT EXISTS alltimedata (
        timestamp TEXT,
        dayval TEXT,
        pindex INTEGER,
        warID INTEGER,
        health INTEGER,
        owner INTEGER,
        regenPerSecond REAL,
        players INTEGER,
        interval INTEGER
    )

    CREATE TABLE IF NOT EXISTS allregiondata (
        timestamp TEXT,
        dayval TEXT,
        pindex INTEGER,
        warID INTEGER,
        rindex INTEGER,
        rname TEXT,
        health INTEGER,
        owner INTEGER,
        regenPerSecond REAL,
        availabilityFactor REAL,
        players INTEGER,
        isAvailable BOOL,
        interval INTEGER
    )
    """
    cursor.executescript(script)
    return True


def fetch_entries_by_timestamp(
    conn: sqlite3.Connection, timestamp: float
) -> Dict[int, Dict[str, Any]]:
    """Fetch all entries with a given timestamp."""
    cursor = conn.cursor()

    cursor.execute(
        """
    SELECT * FROM alltimedata WHERE timestamp = ?
    """,
        (str(timestamp),),
    )
    entries = cursor.fetchall()
    # print(entries)
    keys = [column[0] for column in cursor.description]
    # print(entries,keys)
    all_entries = {}
    for index, entry in enumerate(entries):
        indexv = {key: entry[i] for i, key in enumerate(keys)}
        all_entries[indexv["pindex"]] = indexv
    return all_entries


def fetch_entries_by_interval(
    conn: sqlite3.Connection, timestamp: float
) -> Dict[int, Dict[str, Any]]:
    """Fetch all entries with a given timestamp."""
    cursor = conn.cursor()

    cursor.execute(
        """
    SELECT * FROM alltimedata WHERE interval = ?
    """,
        (int(timestamp) // 900,),
    )
    entries = cursor.fetchall()
    # print(entries)
    keys = [column[0] for column in cursor.description]
    # print(entries,keys)
    all_entries = {}
    for index, entry in enumerate(entries):
        indexv = {key: entry[i] for i, key in enumerate(keys)}
        all_entries[indexv["pindex"]] = indexv
    return all_entries


def fetch_region_entries_by_interval(
    conn: sqlite3.Connection, timestamp: float
) -> Dict[int, Dict[str, Any]]:
    """Fetch all entries with a given timestamp."""
    cursor = conn.cursor()

    cursor.execute(
        """
    SELECT * FROM allregiondata WHERE interval = ?
    """,
        (int(timestamp) // 900,),
    )
    entries = cursor.fetchall()
    # print(entries)
    keys = [column[0] for column in cursor.description]
    # print(entries,keys)
    all_entries = {}
    for index, entry in enumerate(entries):
        indexv = {key: entry[i] for i, key in enumerate(keys)}

        key = f"{indexv['pindex']}_{indexv['rname']}"
        all_entries[key] = indexv
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
        interval = int(float(timestamp)) // 900
        if interval not in all_entries:
            all_entries[interval] = {}
        all_entries[interval][indexv["pindex"]] = indexv
    print(all_entries.keys())
    # input()
    return all_entries


def fetch_region_entries_by_dayval(
    conn: sqlite3.Connection, dayval: int
) -> PlanetStatusDays:
    """Fetch all entries with the same dayval."""
    cursor = conn.cursor()
    print(f"FETCHING ALL VALUES FOR DAYVAL {dayval}")
    cursor.execute(
        """
    SELECT * FROM allregiondata WHERE dayval = ?
    """,
        (str(dayval),),
    )
    entries = cursor.fetchall()
    keys = [column[0] for column in cursor.description]
    all_entries = {}
    for entry in entries:
        indexv = {key: entry[i] for i, key in enumerate(keys)}
        timestamp = indexv["timestamp"]
        interval = int(float(timestamp)) // 900
        if interval not in all_entries:
            all_entries[interval] = {}
        key = f"{indexv['pindex']}_{indexv['rname']}"
        all_entries[interval][key] = indexv
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
