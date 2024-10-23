class GameSubEvent {
    constructor({ text = null, type = null, faction = 0, planet = [] } = {}) {
        this.text = text;
        this.type = type;
        this.faction = faction;
        this.planet = planet; // Expecting an array of [string, int] tuples
    }
}

class GameEvent {
    constructor({
        timestamp,
        time,
        day,
        text = null,
        type = null,
        faction = 0,
        planet = [],
        mo = null,
        mo_name = null,
        mo_case = null,
        mo_objective = null,
        log = [],
        all_players = null,
        eind = null,
    } = {}) {
        this.timestamp = timestamp;
        this.time = time;
        this.day = day;
        this.text = text;
        this.type = type;
        this.faction = faction;
        this.planet = planet; // Expecting an array of [string, string] tuples
        this.mo = mo;
        this.mo_name = mo_name;
        this.mo_case = mo_case;
        this.mo_objective = mo_objective;
        this.log = log.map((subEvent) => new GameSubEvent(subEvent)); // Array of GameSubEvent instances
        this.all_players = all_players;
        this.eind = eind;
    }

    // Comparator to sort GameEvent objects by timestamp
    compareTo(other) {
        return this.timestamp - other.timestamp;
    }
}

class DaysObject {
    constructor({
        events = [],
        days = {},
        dayind = {},
        timestamps = [],
        lastday = 1,
        galaxystatic = {},
    } = {}) {
        this.events = events.map((event) => new GameEvent(event)); // Array of GameEvent instances
        this.days = days;
        this.dayind = dayind;
        this.timestamps = timestamps;
        this.lastday = lastday;
        this.galaxystatic = galaxystatic; // Assume mapping to PlanetStatic instances
    }
}

class Row {
    constructor({
        index = 0,
        planet_name = "",
        sector_name = "",
        front = "",
        sector_front = "",
        initial_owner = "",
        current_owner = "",
        position = null, // specify concrete types if possible
        waypoints = [],
        player_count = 0,
        image = "",
        missionsWon = 0,
        missionsLost = 0,
        missionTime = 0,
        missionsTotal = 0,
        timePerMission = 0.0,
        kills = 0,
        bug_kills = 0,
        bot_kills = 0,
        squid_kills = 0,
        bulletsFired = 0,
        bulletsHit = 0,
        timePlayed = 0,
        timePlayedPerMission = 0.0,
        deaths = 0,
        revives = 0,
        friendlies = 0,
        MSR = 0,
        accuracy = 0,
        DPM = 0.0,
        KPM = 0.0,
        KTD = 0.0,
        FKR = 0.0,
        WTL = 0.0,
        biome = "",
        hazards = "",
    } = {}) {
        this.index = index;
        this.planet_name = planet_name;
        this.sector_name = sector_name;
        this.front = front;
        this.sector_front = sector_front;
        this.initial_owner = initial_owner;
        this.current_owner = current_owner;
        this.position = position;
        this.waypoints = waypoints;
        this.player_count = player_count;
        this.image = image;
        this.missionsWon = missionsWon;
        this.missionsLost = missionsLost;
        this.missionTime = missionTime;
        this.missionsTotal = missionsTotal;
        this.timePerMission = timePerMission;
        this.kills = kills;
        this.bug_kills = bug_kills;
        this.bot_kills = bot_kills;
        this.squid_kills = squid_kills;
        this.bulletsFired = bulletsFired;
        this.bulletsHit = bulletsHit;
        this.timePlayed = timePlayed;
        this.timePlayedPerMission = timePlayedPerMission;
        this.deaths = deaths;
        this.revives = revives;
        this.friendlies = friendlies;
        this.MSR = MSR;
        this.accuracy = accuracy;
        this.DPM = DPM;
        this.KPM = KPM;
        this.KTD = KTD;
        this.FKR = FKR;
        this.WTL = WTL;
        this.biome = biome;
        this.hazards = hazards;
    }
}

export { DaysObject, GameSubEvent, GameEvent, Row };
