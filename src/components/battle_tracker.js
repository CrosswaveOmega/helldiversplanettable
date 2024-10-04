function add_to_entry(acc, planet, value, time) {
    if (!acc[planet[1]]) {
        acc[planet[1]] = { name: planet[0], index: planet[1], events: [] };
    }
    acc[planet[1]]["events"].push({ time: time, event: value });
}

function displayUTCTime(timestamp) {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toISOString().replace("T", " ").slice(0, 16);
}

function calculateElapsedTime(timestamp1, timestamp2) {
    const time1 = new Date(parseInt(timestamp1) * 1000);
    const time2 = new Date(parseInt(timestamp2) * 1000);
    const elapsed = Math.abs(time2 - time1);

    const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

    if (days === 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${days}d ${hours}h ${minutes}m`;
}

class BattleManager {
    constructor(history, showEvts, sector_data) {
        this.history = history;
        this.showEvts = showEvts;
        this.sector_data = sector_data;
        this.planetTypes = {};
        this.battles = {};
        
        this.sector_battles = {};
    }

    addBattle(planet, pid, logEntry, event) {
        //Add if not present...
        if (!this.battles[pid]) {
            this.battles[pid] = {
                start: null,
                sector: null,
                planet: null,
                pc: 0,
                lc: 0,
                dc: 0,
                cl: 0,
                def: null,
            };
        }
        let sector = "unknown";
        if (this.history.galaxystatic[pid.toString()]) {
            sector = this.history.galaxystatic[pid.toString()].sector;
        }


        if (!this.planetTypes[sector]) {
            this.planetTypes[sector] = this.createSector(sector);
        }
        if (!this.sector_battles[sector]) {
            this.sector_battles[sector] = {
                start: null,
                sector: null,
                planet: null,
                pc: 0,
                lc: 0,
                dc: 0,
                cl: 0,
                def: null,
            };
        }

        if (this.showEvts) {
            this.addToEntry(this.planetTypes[sector].planets, planet, logEntry.text, event.time);
        }

        this.handleLogEntry(logEntry, planet, pid, event, sector);
    }

    createSector(sector) {
        let sectorObj = {
            name: sector,
            front: "ALL",
            planets: {},
            battles: 0,
            win: 0,
            loss: 0,
            current: 0,
            campaign_start: 0,
            campaign_end: 0,
            flips: 0,
            planetwon: 0,
            defensestart: 0,
            defensewon: 0,
            defenselost: 0,
            events:[],
            sub:{},
            activeCampaigns: 0,
        };
        let tofind = this.sector_data["all"].find(el => el.sector_name === sector.toUpperCase());
        if (tofind) {
            sectorObj.front = tofind.sector_front;
        }
        return sectorObj;
    }

    handleLogEntry(logEntry, planet, pid, event, sector) {
        if (
            logEntry.type === "campaign_start" ||
            logEntry.type === "defense start"
        ) {
            if (this.battles[pid].planet === null) {
                this.planetTypes[sector].activeCampaigns += 1;
                if (this.planetTypes[sector].activeCampaigns == 1) {
                    
                    if (this.tickets[sector]) {
                        console.log("Sector present")
                    }
                    else{
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
        if (
            logEntry.type === "campaign_end" ||
            logEntry.type === "planet won" ||
            logEntry.type === "planet superwon" ||
            logEntry.type === "defense won" ||
            logEntry.type === "defense lost"
        ) {
            if (this.battles[pid].planet !== null) {
                this.planetTypes[sector].activeCampaigns -= 1;
                if (this.planetTypes[sector].activeCampaigns == 0) {
                    this.tickets[sector] = logEntry;
                }
            }
        }
        if (logEntry.type === "campaign_end") {
            this.endCampaign(logEntry, planet, pid, event, sector);
        }
        if (logEntry.type === "campaign_start") {
            this.startCampaign(planet, pid, event, sector);
        }
        if (logEntry.type === "defense start") {
            this.startDefense(planet, pid, event, sector, logEntry);
        }
        if (logEntry.type === "planet won" || logEntry.type === "planet superwon") {
            this.planetWon(planet, pid, event, sector);
        }
        if (logEntry.type === "planet flip") {
            this.planetTypes[sector].flips += 1;
        }
        if (logEntry.type === "defense won") {
            this.defenseWon(planet, pid, event, sector);
        }
        if (logEntry.type === "defense lost") {
            this.defenseLost(planet, pid, event, sector);
        }
        switch (logEntry.type) {
            case 'campaign_start':
            case 'defense start':
                this.startBattle(planet, pid, event, sector);
                break;
            case 'campaign_end':
            case 'planet won':
            case 'planet superwon':
            case 'defense won':
            case 'defense lost':
                this.endBattle(pid, logEntry, event, sector);
                break;
            case 'planet flip':
                this.planetTypes[sector].flips += 1;
                break;
            default:
                break;
        }
    }
    startBattle(planet, pid, event, sector){
        if (this.battles[pid].planet === null) {
            this.planetTypes[sector].activeCampaigns += 1;
            if (this.planetTypes[sector].activeCampaigns == 1) {
                
                if (this.tickets[sector]) {
                    console.log("Sector present")
                }
                else{
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
    endBattle(pid, logEntry, event, sector){
        if (this.battles[pid].planet !== null) {
            this.planetTypes[sector].activeCampaigns -= 1;
            if (this.planetTypes[sector].activeCampaigns == 0) {
                this.tickets[sector] = logEntry;
            }
        }
    }
    
    startCampaign(planet, pid, event, sector) {
        this.battles[pid].pc += 1;
        this.battles[pid].lc += 1;
        this.battles[pid].start = event.timestamp;
        this.battles[pid].planet = planet;
        this.battles[pid].sector = sector;

        this.planetTypes[sector].battles += 1;
        this.planetTypes[sector].current += 1;
        this.planetTypes[sector].campaign_start += 1;
    }

    endCampaign(logEntry, planet, pid, event, sector) {
        let battle = `Battle ${this.battles[pid].pc} for ${planet[0]}, ${displayUTCTime(this.battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(this.battles[pid].start, event.timestamp)}, failure)`;
        this.addToEntry(this.planetTypes[sector].planets, planet, battle, null);
        this.addToEntry(this.planetTypes[sector].sub, planet, battle, null);
        
        this.battles[pid].planet = null;
        this.planetTypes[sector].loss += 1;
        this.planetTypes[sector].campaign_end += 1;
        this.planetTypes[sector].current -= 1;
    }

    startDefense(planet, pid, event, sector, logEntry) {
        this.battles[pid].pc += 1;
        this.battles[pid].dc += 1;

        this.battles[pid].start = event.timestamp;
        this.battles[pid].planet = planet;
        
        this.battles[pid].sector = sector;
        this.planetTypes[sector].battles += 1;
        this.planetTypes[sector].defensestart += 1;
        this.planetTypes[sector].current += 1;
    }

    planetWon(planet, pid, event, sector) {
        let battle = `Battle ${this.battles[pid].pc} for ${planet[0]}, ${displayUTCTime(this.battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(this.battles[pid].start, event.timestamp)}, victory)`;
        this.addToEntry(
            this.planetTypes[sector].sub,
            planet,
            battle,
            null,
        );
        this.addToEntry(this.planetTypes[sector].planets, planet, battle, null);
        this.battles[pid].planet = null;
        this.planetTypes[sector].win += 1;
        this.planetTypes[sector].planetwon += 1;
        this.planetTypes[sector].current -= 1;
    }

    defenseWon(planet, pid, event, sector) {
        let battle = `Battle ${this.battles[pid].pc} for ${planet[0]}, ${displayUTCTime(this.battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(this.battles[pid].start, event.timestamp)}, victory)`;
        this.addToEntry(this.planetTypes[sector].planets, planet, battle, null);
        this.addToEntry(
            this.planetTypes[sector].sub,
            planet,
            battle,
            null,
        );
        this.battles[pid].cl += 1;
        this.battles[pid].now = null;
        this.battles[pid].planet = null;
        this.planetTypes[sector].win += 1;
        this.planetTypes[sector].defensewon += 1;
        this.planetTypes[sector].current -= 1;
    }

    defenseLost(planet, pid, event, sector) {
        let battle = `Battle ${this.battles[pid].pc} for ${planet[0]}, ${displayUTCTime(this.battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(this.battles[pid].start, event.timestamp)}, failure)`;
        this.addToEntry(this.planetTypes[sector].planets, planet, battle, null);
        this.addToEntry(this.planetTypes[sector].sub, planet, battle, null);
        this.battles[pid].cl += 1;
        this.battles[pid].now = null;
        this.battles[pid].planet = null;
        this.planetTypes[sector].loss += 1;
        this.planetTypes[sector].defenselost += 1;
        this.planetTypes[sector].current -= 1;
    }

    addToEntry(acc, planet, value, time) {
        if (!acc[planet[1]]) {
            acc[planet[1]] = { name: planet[0], index: planet[1], events: [] };
        }
        acc[planet[1]]["events"].push({ time: time, event: value });
    }

    processOngoingBattles() {
        let ongoing = {};
        for (let [key, value] of Object.entries(this.battles)) {
            if (value.dc != value.cl) {
                console.log("PLANET ID", key, "IS MISSING A DEFENSE WON/LOST", value.now, value.start);
            }
            if (value.planet !== null) {
                let planet = value.planet;
                let battle = `Battle ${value.pc} for ${planet[0]}, ${displayUTCTime(value.start)} onwards (${calculateElapsedTime(value.start, new Date().getTime() / 1000)}, ongoing)`;
                let sector = value.sector;
                this.addToEntry(this.planetTypes[value.sector].planets, planet, battle, null);
                
                this.addToEntry(this.planetTypes[value.sector].sub, planet, battle, null);
                if (!ongoing[sector]) {
                    ongoing[sector] = {
                        name: sector,
                        front: "ALL",
                        planets: {},
                        'events': [],
                    };
                }
                
                this.addToEntry(ongoing[sector].planets, planet, battle, null);
            }
        }
        for (let [key, value] of Object.entries(this.sector_battles)) {
            if (value.planet !== null) {
                let battle = `Battle ${value.pc} for ${value.sector}, ${displayUTCTime(value.start)} onwards (${calculateElapsedTime(value.start, new Date().getTime() / 1000)}, ongoing)`;
                let sector = value.sector;
                
                this.planetTypes[value.sector]["events"].push({ time: null, event: battle, subevents:this.planetTypes[sector]['sub'] });
                //this.addToEntry(this.planetTypes[value.sector].planets, planet, battle, null);
                if (!ongoing[sector]) {
                    ongoing[sector] = {
                        name: sector,
                        front: "ALL",
                        planets: {},
                        
                        'events': [],
                    };
                }
                ongoing[sector]["events"].push({ time: null, event: battle,subevents:this.planetTypes[sector]['sub'] });
            }
        }

        return ongoing;
    }

    countDistinctPlanetBattles() {
        for (let event of this.history.events) {
            this.tickets={}
            for (let logEntry of event.log) {
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
                        let battle = `Battle ${this.planetTypes[sector].battles} for ${sector}, ${displayUTCTime(this.sector_battles[sector].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(this.sector_battles[sector].start, event.timestamp)}, failure)`;
                        this.planetTypes[sector]["events"].push({ time: null, event: battle, subevents:this.planetTypes[sector]['sub']})
                        this.planetTypes[sector]['sub']={};
                        this.planetTypes[sector].loss += 1;
    
                        this.planetTypes[sector].current -= 1;
                    }
                    if (
                        logEntry.type === "planet won" ||
                        logEntry.type === "planet superwon" ||
                        logEntry.type === "defense won"
                    ) {
                        let battle = `Battle ${this.planetTypes[sector].battles} for ${sector}, ${displayUTCTime(this.sector_battles[sector].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(this.sector_battles[sector].start, event.timestamp)}, victory)`;
                        this.planetTypes[sector]["events"].push({ time: null, event: battle, subevents:this.planetTypes[sector]['sub']});
                        this.planetTypes[sector]['sub']={};
                        this.planetTypes[sector].win += 1;
                        this.planetTypes[sector].current -= 1;
                    }
                }
            }
        }
        let ongoing = this.processOngoingBattles();
        return { planetTypes: this.planetTypes, ongoing: ongoing };
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