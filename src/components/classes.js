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
        eind = null
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
        this.log = log.map(subEvent => new GameSubEvent(subEvent)); // Array of GameSubEvent instances
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
        galaxystatic = {}
    } = {}) {
        this.events = events.map(event => new GameEvent(event)); // Array of GameEvent instances
        this.days = days;
        this.dayind = dayind;
        this.timestamps = timestamps;
        this.lastday = lastday;
        this.galaxystatic = galaxystatic; // Assume mapping to PlanetStatic instances
    }
}

export {DaysObject,GameSubEvent,GameEvent}