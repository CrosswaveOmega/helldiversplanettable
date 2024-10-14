import json
import sqlite3

# Define the database file
DATABASE_FILE = "./helldiversplanettable/src/data/gen_data/alltimedata.db"
# Define the JSON file path
JSON_FILE = "src/data/gen_data/alltimes_0.json"

# Connect to SQLite database (or create it if it doesn't exist)
conn = sqlite3.connect(DATABASE_FILE)


def fetch_entries_by_timestamp(conn, timestamp):
    """Fetch all entries with a given timestamp."""
    cursor = conn.cursor()

    cursor.execute(
        """
    SELECT * FROM alltimedata WHERE timestamp = ?
    """,
        (timestamp,),
    )
    entries = cursor.fetchall()
    keys = [column[0] for column in cursor.description]
    all_entries = {}
    for index, entry in enumerate(entries):
        indexv = {key: entry[i] for i, key in enumerate(keys)}
        all_entries[indexv["pindex"]] = indexv
    return all_entries


def add_entry(conn, timestamp, index, warID, health, owner, regenPerSecond, players):
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


def migrate(json_file, dayval, conn):
    # Load data from the JSON file
    # Create the table if it doesn't exist
    cursor = conn.cursor()

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS alltimedata (
        timestamp TEXT,
        dayval TEXT,
        pindex INTEGER,
        warID INTEGER,
        health INTEGER,
        owner INTEGER,
        regenPerSecond REAL,
        players INTEGER
    )
    """
    )
    with open(json_file, "r") as file:
        data = json.load(file)

    # Iterate through the JSON data and insert into the database
    for timestamp, pindexes in data.items():
        for pindex, details in pindexes.items():
            cursor.execute(
                """
            INSERT INTO alltimedata (timestamp, dayval, pindex, warID, health, owner, regenPerSecond, players)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    float(timestamp),
                    str(dayval),
                    int(pindex),
                    int(details["warId"]),
                    int(details["health"]),
                    int(details["owner"]),
                    float(details["regenPerSecond"]),
                    int(details["players"]),
                ),
            )

    # Commit the changes and close the connection
    conn.commit()


if True:
    for i in range(0, 8):
        jsonv = f"./helldiversplanettable/src/data/gen_data/alltimes_{i}.json"
        migrate(jsonv, i, conn)

out = fetch_entries_by_timestamp(conn, "1709665200.0")
print(out)

conn.close()

print("Data inserted successfully!")
