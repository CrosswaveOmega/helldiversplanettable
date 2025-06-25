/**
 * Returns the name of the faction based on its numeric owner code.
 *
 * @param {number} owner - The numeric code representing the faction owner.
 * @returns {string} The name of the faction.
 */
function getFactionName(owner) {
    switch (owner) {
        case 2:
            return "Terminid";
        case 3:
            return "Automaton";
        case 4:
            return "Illuminate";
        case 1:
            return "Super Earth";
        default:
            return "Unknown";
    }
}

/**
 * Converts a UNIX timestamp (in seconds) to a formatted UTC time string.
 *
 * @param {number|string} timestamp - The UNIX timestamp in seconds.
 * @returns {string} The formatted UTC time string (YYYY-MM-DD HH:mm).
 */
function displayUTCTime(timestamp) {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toISOString().replace("T", " ").slice(0, 16);
}

/**
 * Calculates the absolute difference in minutes between two UNIX timestamps.
 *
 * @param {number|string} timestamp1 - The first UNIX timestamp in seconds.
 * @param {number|string} timestamp2 - The second UNIX timestamp in seconds.
 * @returns {number} The difference in minutes.
 */
function calculateMinutes(timestamp1, timestamp2) {
    const time1 = new Date(parseInt(timestamp1) * 1000);
    const time2 = new Date(parseInt(timestamp2) * 1000);
    const elapsed = Math.abs(time2 - time1);
    return Math.floor(elapsed / (1000 * 60));
}

/**
 * Formats a given total number of minutes into a human-readable string
 * representing the equivalent duration in weeks, days, hours, and minutes.
 *
 * @param {number} total_minutes - The total number of minutes to format.
 * @returns {string} A formatted string in the form of "Xw Yd Zh Wm", omitting any zero-value units.
 *
 * @example
 * format_minutes(1500); // "1d 1h"
 * format_minutes(10080); // "1w"
 */
export function format_minutes(total_minutes) {
    const weeks = Math.floor(total_minutes / (60 * 24 * 7));
    const days = Math.floor(
        (total_minutes % (60 * 24 * 7)) / (60 * 24)
    );
    const hours = Math.floor(
        (total_minutes % (60 * 24)) / 60,
    );
    const minutes = Math.floor((total_minutes % 60));

    const parts = [];
    if (weeks > 0) parts.push(`${weeks}w`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ');
}

/**
 * Calculates the elapsed time between two timestamps and returns it as a formatted string.
 *
 * @param {number|string} timestamp1 - The start UNIX timestamp in seconds.
 * @param {number|string} timestamp2 - The end UNIX timestamp in seconds.
 * @returns {string} The formatted elapsed time string.
 */
function calculateElapsedTime(timestamp1, timestamp2) {
    const total_minutes = calculateMinutes(timestamp1, timestamp2)
    return format_minutes(total_minutes);
}

class PlanetType {
    constructor(name, front = "ALL") {
        this.name = name;
        this.front = front;
        this.planets = {};
        this.battles = 0;
        this.sbattles = 0;
        this.scurrent = 0;
        this.win = 0;
        this.loss = 0;
        this.swin = 0;
        this.sloss = 0;
        this.mins = 0;
        this.current = 0;
        this.campaign_start = 0;
        this.campaign_end = 0;
        this.flips = 0;
        this.planetwon = 0;
        this.defensestart = 0;
        this.defensewon = 0;
        this.defenselost = 0;
        this.events = [];
        this.sub = {};
        this.activeCampaigns = 0;
    }
}

//
class FactionType {
    constructor(name) {
        this.name = name;
        this.front = name;
        this.planets = {};
        this.battles = 0;
        this.sbattles = 0;
        this.scurrent = 0;
        this.win = 0;
        this.loss = 0;
        this.swin = 0;
        this.sloss = 0;
        this.mins = 0;
        this.current = 0;
        this.campaign_start = 0;
        this.campaign_end = 0;
        this.flips = 0;
        this.planetwon = 0;
        this.defensestart = 0;
        this.defensewon = 0;
        this.defenselost = 0;
        this.events = [];
        this.sub = {};
        this.activeCampaigns = 0;
    }
}


//This class is for Region Battles, battles on a specific planet.
class RegionBattleEntry {
    constructor(region) {
        this.start = null;
        this.sector = null;
        this.planet = null;
        this.region = region;
        this.type = "?";
        this.active = false;
        this.pc = 0;
        this.lc = 0;
        this.dc = 0;
        this.cl = 0;
        this.def = null;
        this.faction = null;
    }

    startSiege(planet, pid, event, sector, logEntry) {
        this.pc += 1;
        this.lc += 1;
        this.start = event.timestamp;
        this.planet = planet;
        this.sector = sector;
        this.type = "Region Siege";
        this.active = true;
        this.faction = getFactionName(logEntry.faction);
    }
    startDefense(planet, pid, event, sector, logEntry) {
        this.pc += 1;
        this.dc += 1;
        this.start = event.timestamp;
        this.planet = planet;
        this.type = "Defense";
        this.faction = getFactionName(logEntry.faction)
        this.sector = sector;
    }
    siegeFinish(planet, pid, event, sector, logEntry) {
        //The siege is finished.
        console.log(this.start, event.timestamp)
        if (this.start == null) {
            this.start = 0
        }
        let out = `(${calculateElapsedTime(this.start, event.timestamp)}, fallen)`;
        let timev = `${displayUTCTime(this.start)} to ${displayUTCTime(event.timestamp)}`;
        let battle = `${this.type} Battle ${this.pc} by ${this.faction} for ${planet[0]}'s ${this.region[0]} ${out}: ${timev};`;
        let mins = calculateMinutes(this.start, event.timestamp);
        this.active = false;
        return [battle, mins];
    }
    siegeEnd(planet, pid, event, sector, logEntry) {
        let out = `(${calculateElapsedTime(this.start, event.timestamp)}, ended)`;
        let timev = `${displayUTCTime(this.start)} to ${displayUTCTime(event.timestamp)}`;
        let battle = `${this.type} Battle ${this.pc} by ${this.faction} for ${planet[0]}'s ${this.region[0]} ${out}: ${timev};`;
        let mins = calculateMinutes(this.start, event.timestamp);
        this.active = false;
        return [battle, mins];
    }
    siegeContinue(planet, pid, event, sector, logEntry) {
        let out = `(${calculateElapsedTime(this.start, event.timestamp)}, continued)`;
        let timev = `${displayUTCTime(this.start)} to ${displayUTCTime(event.timestamp)}`;
        let battle = `${this.type} Battle ${this.pc} by ${this.faction} for ${planet[0]}'s ${this.region[0]} ${out}: ${timev};`;
        let mins = calculateMinutes(this.start, event.timestamp);
        this.active = false;
        return [battle, mins];
    }

}

class BattleEntry {
    constructor() {
        this.start = null;
        this.sector = null;
        this.planet = null;
        this.type = "?";
        this.pc = 0;
        this.lc = 0;
        this.dc = 0;
        this.cl = 0;
        this.def = null;
        this.faction = null;
        this.region_battles = {};//rname,battle
        this.region_entries = [];
    }

    startCampaign(planet, pid, event, sector, logEntry) {
        this.pc += 1;
        this.lc += 1;
        this.start = event.timestamp;
        this.planet = planet;
        this.sector = sector;
        this.type = "Liberation";
        this.faction = getFactionName(logEntry.faction);
    }
    startDefense(planet, pid, event, sector, logEntry) {
        this.pc += 1;
        this.dc += 1;
        this.start = event.timestamp;
        this.planet = planet;
        this.type = "Defense";
        this.faction = getFactionName(logEntry.faction)
        this.sector = sector;
    }
    start_regions(planet, pid, event, sector, logEntry) {
        for (let region of logEntry.region) {
            let rid = region[1]
            if (!this.region_battles[rid]) {
                this.region_battles[rid] = new RegionBattleEntry(region);
            }
            if (logEntry.type === "region_siege_start") {

                this.region_battles[rid].startSiege(planet, pid, event, sector, logEntry);
            }

            if (logEntry.type === "region_siege_end") {

                this.region_battles[rid].siegeEnd(planet, pid, event, sector, logEntry);
            }
            if (logEntry.type === "region_siege_lost") {

                let endl = this.region_battles[rid].siegeFinish(planet, pid, event, sector, logEntry);
                let battle = endl[0];
                let mins = endl[1];
                this.region_entries.push(endl);
            }



        }
    }
    reset() {
        this.planet = null;
        this.region_entries = [];
    }

    finalizeActiveRegionBattles(planet, pid, event, sector, logEntry) {
        for (let rid in this.region_battles) {
            let regionBattle = this.region_battles[rid];
            if (regionBattle.active === true) {
                let endl = regionBattle.siegeEnd(planet, pid, event, sector, logEntry);
                this.region_entries.push(endl);
                regionBattle.active = false;
            }
        }
    }

    finalizeActiveRegionBattlesOngoing(planet, pid, event, sector, logEntry) {
        for (let rid in this.region_battles) {
            let regionBattle = this.region_battles[rid];
            if (regionBattle.active === true) {
                let endl = regionBattle.siegeContinue(planet, pid, event, sector, logEntry);
                this.region_entries.push(endl);
                regionBattle.active = false;
            }
        }
    }
    generate_end_message(planet, pid, event, sector, logEntry) {
        let out = `(${calculateElapsedTime(this.start, event.timestamp)}, failure)`;
        let timev = `${displayUTCTime(this.start)} to ${displayUTCTime(event.timestamp)}`;
        let battle = `${this.type} Battle ${this.pc} against ${this.faction} for ${planet[0]} ${out}: ${timev};`;
        let mins = calculateMinutes(this.start, event.timestamp);
        this.finalizeActiveRegionBattles(planet, pid, event, sector, logEntry);
        return [battle, mins];
    }
    generate_win_message(planet, pid, event, sector, logEntry) {
        let out = `(${calculateElapsedTime(this.start, event.timestamp)}, victory)`;
        let timev = `${displayUTCTime(this.start)} to ${displayUTCTime(event.timestamp)}`;
        let battle = `${this.type} Battle ${this.pc} against ${this.faction} for ${planet[0]} ${out}: ${timev};`;
        let mins = calculateMinutes(this.start, event.timestamp);

        this.finalizeActiveRegionBattles(planet, pid, event, sector, logEntry);
        return [battle, mins];
    }
    generate_ongoing_message(planet, pid, event, sector, logEntry) {
        let out = `(${calculateElapsedTime(this.start, new Date().getTime() / 1000)}, ongoing)`;
        let timev = `${displayUTCTime(this.start)} onwards`;
        let battle = `${this.type} Battle ${this.pc} against ${this.faction
            } for ${planet[0]} ${out}: ${timev}; `;
        //let battle = `${value.type} Battle ${value.pc} for ${planet[0]}, ${displayUTCTime(value.start)} onwards `;
        let mins = calculateMinutes(this.start, new Date().getTime() / 1000);

        this.finalizeActiveRegionBattlesOngoing(planet, pid, event, sector, logEntry);
        return [battle, mins];
    }

}

class SectorBattle {
    constructor(sector) {
        this.start = null;
        this.sector = sector;
        this.planet = null;
        this.type = "?";
        this.pc = 0;
        this.lc = 0;
        this.dc = 0;
        this.cl = 0;
        this.def = null;
    }
}



/*Class which creates and formats the battle history
for planets and sectors.*/
class BattleManager {
    /**
     * @param {DaysObject} history - Historical data for battles.
     * @param {boolean} showEvts - Flag to determine if events should be shown.
     * @param {STATS} sector_data - Sector data that includes statistical information.
     */
    constructor(history, showEvts, sector_data) {
        this.history = history;
        this.showEvts = showEvts;
        this.sector_data = sector_data;

        this.planetTypes = {}; // sector_name -> PlanetType
        this.factionTypes = {}; // faction_name -> FactionType
        this.battles = {}; // pid -> BattleEntry
        this.sector_battles = {}; // sector_name -> SectorBattle

    }

    addBattle(planet, pid, logEntry, event) {
        if (!this.battles[pid]) {
            this.battles[pid] = new BattleEntry();
        }

        let sector = "unknown";
        if (this.history.galaxystatic[pid.toString()]) {
            sector = this.history.galaxystatic[pid.toString()].sector;
        }

        if (!this.planetTypes[sector]) {
            this.planetTypes[sector] = this.createSector(sector);
        }
        if (!this.sector_battles[sector]) {
            this.sector_battles[sector] = new SectorBattle(sector);
        }

        if (this.showEvts) {
            this.addToEntry(
                this.planetTypes[sector].planets,
                planet,
                logEntry.text,
                event.time,
            );
        }

        this.handleLogEntry(logEntry, planet, pid, event, sector);
    }

    createSector(sector) {
        const sectorObj = new PlanetType(sector);
        const found = this.sector_data["all"].find(
            (el) => el.sector_name === sector.toUpperCase(),
        );
        if (found) {
            sectorObj.front = found.sector_front;
        }
        return sectorObj;
    }

    createFaction(faction) {
        if (!this.factionTypes[faction]) {
            this.factionTypes[faction] = new FactionType(faction);
        }
    }

    handleLogEntry(logEntry, planet, pid, event, sector) {
        //Take in the current log entry type, and
        //Apply the needed processing.
        this.createFaction(getFactionName(logEntry.faction));
        // For Sector Battles
        if (
            logEntry.type === "campaign_start" ||
            logEntry.type === "defense start" ||
            logEntry.type === "invasion start"
        ) {
            if (this.battles[pid].planet === null) {
                this.planetTypes[sector].activeCampaigns += 1;
                if (this.planetTypes[sector].activeCampaigns == 1) {
                    if (this.tickets[sector]) {
                        console.log("Sector present");
                    } else {
                        this.sector_battles[sector].start = event.timestamp;
                        this.sector_battles[sector].planet = planet;
                        this.sector_battles[sector].pc += 1;
                        this.sector_battles[sector].sector = sector;
                        //this.planetTypes[sector].battles += 1;
                        this.planetTypes[sector].sbattles += 1;
                        this.planetTypes[sector].scurrent += 1;

                        //this.planetTypes[sector].current += 1;
                    }
                }
            }
        }
        if (
            logEntry.type === "campaign_end" ||
            logEntry.type === "planet won" ||
            logEntry.type === "planet superwon" ||
            logEntry.type === "defense won" ||
            logEntry.type === "invasion won" ||
            logEntry.type === "defense lost" ||
            logEntry.type === "invasion lost"
        ) {
            if (this.battles[pid].planet !== null) {
                this.planetTypes[sector].activeCampaigns -= 1;
                if (this.planetTypes[sector].activeCampaigns == 0) {
                    this.tickets[sector] = logEntry;
                }
            }
        }
        //End sector battles logic.

        if (
            logEntry.type === "region_siege_start" ||
            logEntry.type === "region_siege_end" ||
            logEntry.type === "region_siege_lost"
        ) {
            this.battles[pid].start_regions(planet, pid, event, sector, logEntry);
        }
        if (logEntry.type === "campaign_end") {
            this.endCampaign(planet, pid, event, sector, logEntry);
        }
        if (logEntry.type === "campaign_start") {
            this.startCampaign(planet, pid, event, sector, logEntry);
        }
        if (logEntry.type === "defense start") {
            this.startDefense(planet, pid, event, sector, logEntry);
        }
        if (logEntry.type === "invasion start") {
            this.startDefense(planet, pid, event, sector, logEntry);
        }
        //Conclusions
        if (
            logEntry.type === "planet won" ||
            logEntry.type === "planet superwon"
        ) {
            this.planetWon(planet, pid, event, sector, logEntry);
        }
        if (logEntry.type === "planet flip") {
            this.planetTypes[sector].flips += 1;
            this.planetFlip(planet, pid, event, sector, logEntry)
        }
        if (logEntry.type === "defense won") {
            this.defenseWon(planet, pid, event, sector);
        }
        if (logEntry.type === "invasion won") {
            this.defenseWon(planet, pid, event, sector);
        }
        if (logEntry.type === "defense lost") {
            this.defenseLost(planet, pid, event, sector);
        }
        if (logEntry.type === "invasion lost") {
            this.defenseLost(planet, pid, event, sector);
        }
        switch (logEntry.type) {
            case "campaign_start":
            case "defense start":
            case "invasion start":
                this.startBattle(planet, pid, event, sector);
                break;
            case "campaign_end":
            case "planet won":
            case "planet superwon":
            case "defense won":
            case "invasion won":
            case "defense lost":
                this.endBattle(pid, logEntry, event, sector);
                break;
            case "invasion lost":
                this.endBattle(pid, logEntry, event, sector);
                break;
            case "planet flip":
                this.planetTypes[sector].flips += 1;
                break;
            default:
                break;
        }
    }

    startBattle(planet, pid, event, sector) {
        //For Sector Battles.
        if (this.battles[pid].planet === null) {
            this.planetTypes[sector].activeCampaigns += 1;
            if (this.planetTypes[sector].activeCampaigns == 1) {
                if (this.tickets[sector]) {
                    console.log("Sector present");
                } else {
                    this.sector_battles[sector].start = event.timestamp;
                    this.sector_battles[sector].planet = planet;
                    this.sector_battles[sector].pc += 1;
                    this.sector_battles[sector].sector = sector;
                    this.planetTypes[sector].battles += 1;
                    this.planetTypes[sector].current += 1;
                }
            }
        }
    }
    endBattle(pid, logEntry, event, sector) {
        //For Sector Battles.
        if (this.battles[pid].planet !== null) {
            this.planetTypes[sector].activeCampaigns -= 1;
            if (this.planetTypes[sector].activeCampaigns == 0) {
                this.tickets[sector] = logEntry;
            }
        }
    }

    startCampaign(planet, pid, event, sector, logEntry) {
        //For Planet Liberation Campaigns.
        this.battles[pid].startCampaign(planet, pid, event, sector, logEntry)

        this.planetTypes[sector].battles += 1;
        this.planetTypes[sector].current += 1;
        this.planetTypes[sector].campaign_start += 1;


        this.factionTypes[this.battles[pid].faction].battles += 1;
        this.factionTypes[this.battles[pid].faction].current += 1;
        this.factionTypes[this.battles[pid].faction].campaign_start += 1;
    }

    endCampaign(planet, pid, event, sector, logEntry) {
        //For planet liberation Campaigns.
        let endl = this.battles[pid].generate_end_message(planet, pid, event, sector, logEntry);

        let battle = endl[0];
        let mins = endl[1];
        this.addToEntry(this.planetTypes[sector].planets, planet, battle, null, mins);
        this.addToEntry(this.planetTypes[sector].sub, planet, battle, null, mins);
        let regions = this.battles[pid].region_entries;
        for (let r of regions) {
            this.addToEntry(this.planetTypes[sector].planets, planet, r[0], null, r[1]);
            this.addToEntry(this.planetTypes[sector].sub, planet, r[0], null, r[1]);
        }

        this.battles[pid].reset();
        this.planetTypes[sector].loss += 1;
        this.planetTypes[sector].campaign_end += 1;
        this.planetTypes[sector].current -= 1;

        this.factionTypes[this.battles[pid].faction].loss += 1;
        this.factionTypes[this.battles[pid].faction].campaign_end += 1;
        this.factionTypes[this.battles[pid].faction].current -= 1;
    }


    planetWon(planet, pid, event, sector, logEntry) {
        let endl = this.battles[pid].generate_win_message(planet, pid, event, sector, logEntry);
        let battle = endl[0];
        let mins = endl[1];
        this.addToEntry(this.planetTypes[sector].planets, planet, battle, null, mins);
        this.addToEntry(this.planetTypes[sector].sub, planet, battle, null, mins);
        let regions = this.battles[pid].region_entries;
        for (let r of regions) {
            this.addToEntry(this.planetTypes[sector].planets, planet, r[0], null, r[1]);
            this.addToEntry(this.planetTypes[sector].sub, planet, r[0], null, r[1]);
        }
        this.battles[pid].reset();
        this.planetTypes[sector].win += 1;
        this.planetTypes[sector].planetwon += 1;
        this.planetTypes[sector].current -= 1;

        this.factionTypes[this.battles[pid].faction].win += 1;
        this.factionTypes[this.battles[pid].faction].planetwon += 1;
        this.factionTypes[this.battles[pid].faction].current -= 1;

    }

    startDefense(planet, pid, event, sector, logEntry) {
        this.battles[pid].startDefense(planet, pid, event, sector, logEntry);

        this.planetTypes[sector].battles += 1;
        this.planetTypes[sector].defensestart += 1;
        this.planetTypes[sector].current += 1;

        this.factionTypes[this.battles[pid].faction].battles += 1;
        this.factionTypes[this.battles[pid].faction].defensestart += 1;
        this.factionTypes[this.battles[pid].faction].current += 1;
    }

    planetFlip(planet, pid, event, sector, logEntry) {
        if (!this.showEvts) {
            let faction = getFactionName(logEntry.faction);
            let battle = `${planet[0]} flips to ${faction} Control: ${displayUTCTime(event.timestamp)} `;
            this.factionTypes[faction].flips += 1;
            this.addToEntry(
                this.planetTypes[sector].planets,
                planet,
                battle,
                null,
            );
        }
    }

    defenseWon(planet, pid, event, sector, logEntry) {
        let endl = this.battles[pid].generate_win_message(planet, pid, event, sector, logEntry);
        let battle = endl[0];
        let mins = endl[1];
        this.addToEntry(this.planetTypes[sector].planets, planet, battle, null, mins);
        this.addToEntry(this.planetTypes[sector].sub, planet, battle, null, mins);
        let regions = this.battles[pid].region_entries;
        for (let r of regions) {
            this.addToEntry(this.planetTypes[sector].planets, planet, r[0], null, r[1]);
            this.addToEntry(this.planetTypes[sector].sub, planet, r[0], null, r[1]);
        }
        this.battles[pid].cl += 1;
        this.battles[pid].now = null;
        this.battles[pid].reset();
        this.planetTypes[sector].win += 1;
        this.planetTypes[sector].defensewon += 1;
        this.planetTypes[sector].current -= 1;

        this.factionTypes[this.battles[pid].faction].win += 1;
        this.factionTypes[this.battles[pid].faction].defensewon += 1;
        this.factionTypes[this.battles[pid].faction].current -= 1;
    }

    defenseLost(planet, pid, event, sector, logEntry) {
        let endl = this.battles[pid].generate_end_message(planet, pid, event, sector, logEntry);
        let battle = endl[0];
        let mins = endl[1];
        this.addToEntry(this.planetTypes[sector].planets, planet, battle, null, mins);
        this.addToEntry(this.planetTypes[sector].sub, planet, battle, null, mins);
        let regions = this.battles[pid].region_entries;
        for (let r of regions) {
            this.addToEntry(this.planetTypes[sector].planets, planet, r[0], null, r[1]);
            this.addToEntry(this.planetTypes[sector].sub, planet, r[0], null, r[1]);
        }
        this.battles[pid].cl += 1;
        this.battles[pid].now = null;
        this.battles[pid].reset();
        this.planetTypes[sector].loss += 1;
        this.planetTypes[sector].defenselost += 1;
        this.planetTypes[sector].current -= 1;

        this.factionTypes[this.battles[pid].faction].loss += 1;
        this.factionTypes[this.battles[pid].faction].defenselost += 1;
        this.factionTypes[this.battles[pid].faction].current -= 1;
    }

    /**
     * Adds an event entry to the accumulator object for a specific planet or sector.
     *
     * @param {Object} acc - The accumulator object that stores planet data.
     * @param {[string, number]} planet - An array where the first element is the planet name and the second is the planet index.
     * @param {*} value - The event value to be added to the planet's events.
     * @param {*} time - The timestamp or time associated with the event.
     * @param {number} [mins=0] - The number of minutes to add to the planet's total minutes (optional, defaults to 0).
     */
    addToEntry(acc, planet, value, time, mins = 0) {
        if (!acc[planet[1]]) {
            acc[planet[1]] = { name: planet[0], index: planet[1], events: [], mins: 0 };
        }
        acc[planet[1]]["events"].push({ time: time, event: value });
        acc[planet[1]]["mins"] = acc[planet[1]]["mins"] + mins
    }

    processOngoingBattles() {
        let ongoing = {};
        for (let [key, value] of Object.entries(this.battles)) {
            if (value.dc != value.cl) {
                console.log(
                    "PLANET ID",
                    key,
                    "IS MISSING A DEFENSE WON/LOST",
                    value.now,
                    value.start,
                );
            }
            if (value.planet !== null) {

                let planet = value.planet;
                /*                 let out = `(${calculateElapsedTime(value.start, new Date().getTime() / 1000)}, ongoing)`;
                                let timev = `${displayUTCTime(value.start)} onwards`;
                                let battle = `${value.type} Battle ${value.pc} against ${value.faction
                                    } for ${planet[0]} ${out}: ${timev}; `;
                                //let battle = `${value.type} Battle ${value.pc} for ${planet[0]}, ${displayUTCTime(value.start)} onwards `;
                                let mins = calculateMinutes(value.start, new Date().getTime() / 1000);
                 */
                let pid = planet[1]
                let event = { 'timestamp': (new Date().getTime() / 1000) }
                let endl = value.generate_ongoing_message(planet, pid, event, value.sector, null);

                let battle = endl[0];
                let mins = endl[1];

                let sector = value.sector;
                this.addToEntry(
                    this.planetTypes[value.sector].planets,
                    planet,
                    battle,
                    null,
                    mins
                );

                this.addToEntry(
                    this.planetTypes[value.sector].sub,
                    planet,
                    battle,
                    null,
                    mins,
                );
                let regions = value.region_entries;
                for (let r of regions) {
                    this.addToEntry(this.planetTypes[sector].planets, planet, r[0], null, r[1]);
                    this.addToEntry(this.planetTypes[sector].sub, planet, r[0], null, r[1]);
                }

                let lastminutetotal = this.planetTypes[value.sector].planets[planet[1]].mins

                if (!ongoing[sector]) {
                    ongoing[sector] = {
                        name: sector,
                        front: "ALL",
                        planets: {},
                        events: [],
                        mins: 0
                    };
                }

                this.addToEntry(ongoing[sector].planets, planet, battle, null, lastminutetotal);
                for (let r of regions) {
                    this.addToEntry(ongoing[sector].planets, planet, r[0], null, r[1]);
                }
            }
        }
        for (let [key, value] of Object.entries(this.sector_battles)) {
            if (value.planet !== null) {
                let out = `(${calculateElapsedTime(value.start, new Date().getTime() / 1000)}, ongoing)`;
                let timev = `${displayUTCTime(value.start)} onwards`;
                let battle = `${value.sector} Battle ${value.pc} for ${value.sector} ${out}: ${timev};`;
                let sector = value.sector;

                let mins = calculateMinutes(value.start, new Date().getTime() / 1000);

                this.planetTypes[value.sector]["events"].push({
                    time: null,
                    event: battle,
                    subevents: this.planetTypes[sector]["sub"],
                });
                this.planetTypes[value.sector].mins += mins

                //this.addToEntry(this.planetTypes[value.sector].planets, planet, battle, null);

                let lastminutetotal = this.planetTypes[value.sector].mins
                if (!ongoing[sector]) {
                    ongoing[sector] = {
                        name: sector,
                        front: "ALL",
                        planets: {},
                        events: [],
                        mins: lastminutetotal,
                    };
                }
                ongoing[sector]["events"].push({
                    time: null,
                    event: battle,
                    subevents: this.planetTypes[sector]["sub"],
                });
                //ongoing[sector].mins+=mins;
            }
        }

        return ongoing;
    }

    countDistinctPlanetBattles() {
        for (let event of this.history.events) {
            this.tickets = {};
            for (let logEntry of event.log) {
                if (logEntry.region && logEntry.region.length > 0) {
                    console.log(logEntry);
                }
                if (logEntry.planet) {
                    for (let planet of logEntry.planet) {

                        this.addBattle(planet, planet[1], logEntry, event);
                    }
                }
            }
            for (let [sector, logEntry] of Object.entries(this.tickets)) {
                if (this.planetTypes[sector].activeCampaigns == 0) {
                    this.sector_battles[sector].planet = null;

                    if (
                        logEntry.type == "defense lost" ||
                        logEntry.type == "campaign_end"
                    ) {

                        let battle = `Battle ${this.sector_battles[sector].pc} for ${sector}, ${displayUTCTime(this.sector_battles[sector].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(this.sector_battles[sector].start, event.timestamp)}, failure);`;
                        let mins = calculateMinutes(this.sector_battles[sector].start, event.timestamp);

                        this.planetTypes[sector]["events"].push({
                            time: null,
                            event: battle,
                            subevents: this.planetTypes[sector]["sub"],
                        });
                        this.planetTypes[sector]["sub"] = {};
                        this.planetTypes[sector].sloss += 1;
                        this.planetTypes[sector].mins += mins;
                        this.planetTypes[sector].scurrent -= 1;
                    }
                    if (
                        logEntry.type === "planet won" ||
                        logEntry.type === "planet superwon" ||
                        logEntry.type === "defense won"

                    ) {
                        let battle = `Battle ${this.sector_battles[sector].pc} for ${sector}, ${displayUTCTime(this.sector_battles[sector].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(this.sector_battles[sector].start, event.timestamp)}, victory);`;

                        let mins = calculateMinutes(this.sector_battles[sector].start, event.timestamp);
                        this.planetTypes[sector]["events"].push({
                            time: null,
                            event: battle,
                            subevents: this.planetTypes[sector]["sub"],
                        });
                        this.planetTypes[sector]["sub"] = {};
                        this.planetTypes[sector].swin += 1;


                        this.planetTypes[sector].mins += mins;
                        this.planetTypes[sector].scurrent -= 1;
                    }
                }
            }
        }
        let ongoing = this.processOngoingBattles();
        return { planetTypes: this.planetTypes, ongoing: ongoing, factionTypes: this.factionTypes };
    }
}




export function count_distinct_planet_battles(history, showEvts, sector_data) {
    /**
     * Generate the battle and sector battle list
     * @param {DaysObject} history - Historical data.
     * @param {boolean} showEvt - Flag to show events.
     * @param {Object} sectorData - Data of the sectors.
     * @returns {Array} - An empty array.
     */
    const manager = new BattleManager(history, showEvts, sector_data);
    return manager.countDistinctPlanetBattles();
}
