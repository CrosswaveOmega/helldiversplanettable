function make_biome_data(data) {
    /**
     * Aggregates and transforms biome data.
     *
     * This function processes the input data to aggregate statistics for each biome and then
     * calculates derived metrics such as deaths per mission, kills per mission, kills to deaths ratio,
     * and win to loss ratio.
     *
     * @param {Array<Row>} data - An array of objects where each object contains data for a specific entry,
     *                       including fields like biome, missionsWon, missionsLost, bot_kills, bug_kills,
     *                       deaths, and friendlies.
     *
     * @returns {Array} An array of transformed objects containing aggregated data and derived metrics for each biome.
     */
    console.log("DATA");
    console.log(data);
    let fronts = ["all"];
    let biome_data = data.reduce((acc, entry) => {
        let front = entry.front;
        if (!fronts.includes(front)) fronts.unshift(front);
        if (!acc["all"]) {
            acc["all"] = {};
        }
        let targetcolumn = entry.biome;
        if (!acc["all"][targetcolumn]) {
            acc["all"][targetcolumn] = { ...entry, count: 1 };
        } else {
            acc["all"][targetcolumn].missionsWon += entry.missionsWon;
            acc["all"][targetcolumn].missionsLost += entry.missionsLost;
            acc["all"][targetcolumn].bot_kills += entry.bot_kills;
            acc["all"][targetcolumn].bug_kills += entry.bug_kills;
            acc["all"][targetcolumn].squid_kills += entry.squid_kills;
            acc["all"][targetcolumn].revives += entry.revives;
            acc["all"][targetcolumn].deaths += entry.deaths;
            acc["all"][targetcolumn].friendlies += entry.friendlies;
            acc["all"][targetcolumn].bulletsFired += entry.bulletsFired;
            acc["all"][targetcolumn].bulletsHit += entry.bulletsHit;
            acc["all"][targetcolumn].missionTime += entry.missionTime;
            acc["all"][targetcolumn].timePlayed += entry.timePlayed;

            acc["all"][targetcolumn].count += 1;
        }
        if (!acc[front]) {
            acc[front] = {};
        }
        if (!acc[front][targetcolumn]) {
            acc[front][targetcolumn] = { ...entry, count: 1 };
        } else {
            acc[front][targetcolumn].missionsWon += entry.missionsWon;
            acc[front][targetcolumn].missionsLost += entry.missionsLost;
            acc[front][targetcolumn].bot_kills += entry.bot_kills;
            acc[front][targetcolumn].bug_kills += entry.bug_kills;
            acc[front][targetcolumn].squid_kills += entry.squid_kills;
            acc[front][targetcolumn].revives += entry.revives;
            acc[front][targetcolumn].deaths += entry.deaths;
            acc[front][targetcolumn].friendlies += entry.friendlies;
            acc[front][targetcolumn].bulletsFired += entry.bulletsFired;
            acc[front][targetcolumn].bulletsHit += entry.bulletsHit;
            acc[front][targetcolumn].missionTime += entry.missionTime;
            acc[front][targetcolumn].timePlayed += entry.timePlayed;

            acc[front][targetcolumn].count += 1;
        }

        return acc;
    }, {});
    console.log(biome_data);

    let transformedData = {};
    for (const front of fronts) {
        let thislist = [];
        for (const [, entry] of Object.entries(biome_data[front])) {
            let missions = Math.max(entry.missionsWon + entry.missionsLost, 1);
            let killsum = Math.max(entry.bot_kills + entry.bug_kills, 1);
            let DPM = entry.deaths / missions;
            let KPM = killsum / missions;
            let KTD = killsum / Math.max(entry.deaths, 1);
            let timePerMission = entry.missionTime / missions;
            let timePlayedPerMission = entry.timePlayed / missions;
            
            let FKR = ((entry.friendlies) / Math.max(entry.deaths,1))*100.0;
            let MSR = entry.missionsWon / missions;
            let WTL = entry.missionsWon / Math.max(entry.missionsLost, 1);
            thislist.push({
                ...entry,
                missions,
                killsum,
                kills: killsum,
                DPM,
                KPM,
                KTD,
                WTL,
                FKR,
                timePerMission,
                timePlayedPerMission,
                MSR,
            });
        }
        transformedData[front] = thislist;
        console.log(transformedData);
    }
    return transformedData;
}

function make_sector_data(data) {
    /**
     * Aggregates and transforms targetcolumn data.
     *
     * This function processes the input data to aggregate statistics for each sector and then
     * calculates derived metrics such as deaths per mission, kills per mission, kills to deaths ratio,
     * and win to loss ratio.
     *
     * @param {Array} data - An array of objects where each object contains data for a specific entry,
     *                       including fields like biome, missionsWon, missionsLost, bot_kills, bug_kills,
     *                       deaths, and friendlies.
     *
     * @returns {Array} An array of transformed objects containing aggregated data and derived metrics for each sector.
     */
    console.log("DATA");
    console.log(data);
    let fronts = ["all"];

    let sector_data = data.reduce((acc, entry) => {
        let front = entry.front;
        if (!fronts.includes(front)) fronts.unshift(front);
        if (!acc["all"]) {
            acc["all"] = {};
        }
        let targetcolumn = entry.sector_name;
        if (!acc["all"][targetcolumn]) {
            acc["all"][targetcolumn] = { ...entry, count: 1 };
        } else {
            acc["all"][targetcolumn].missionsWon += entry.missionsWon;
            acc["all"][targetcolumn].missionsLost += entry.missionsLost;
            acc["all"][targetcolumn].bot_kills += entry.bot_kills;
            acc["all"][targetcolumn].bug_kills += entry.bug_kills;
            acc["all"][targetcolumn].squid_kills += entry.squid_kills;
            acc["all"][targetcolumn].revives += entry.revives;
            acc["all"][targetcolumn].deaths += entry.deaths;
            acc["all"][targetcolumn].friendlies += entry.friendlies;
            acc["all"][targetcolumn].bulletsFired += entry.bulletsFired;
            acc["all"][targetcolumn].bulletsHit += entry.bulletsHit;
            acc["all"][targetcolumn].missionTime += entry.missionTime;
            acc["all"][targetcolumn].timePlayed += entry.timePlayed;

            acc["all"][targetcolumn].count += 1;
        }
        if (!acc[front]) {
            acc[front] = {};
        }
        if (!acc[front][targetcolumn]) {
            acc[front][targetcolumn] = { ...entry, count: 1 };
        } else {
            acc[front][targetcolumn].missionsWon += entry.missionsWon;
            acc[front][targetcolumn].missionsLost += entry.missionsLost;
            acc[front][targetcolumn].bot_kills += entry.bot_kills;
            acc[front][targetcolumn].bug_kills += entry.bug_kills;
            acc[front][targetcolumn].squid_kills += entry.squid_kills;
            acc[front][targetcolumn].revives += entry.revives;
            acc[front][targetcolumn].deaths += entry.deaths;
            acc[front][targetcolumn].friendlies += entry.friendlies;
            acc[front][targetcolumn].bulletsFired += entry.bulletsFired;
            acc[front][targetcolumn].bulletsHit += entry.bulletsHit;
            acc[front][targetcolumn].missionTime += entry.missionTime;
            acc[front][targetcolumn].timePlayed += entry.timePlayed;

            acc[front][targetcolumn].count += 1;
        }

        return acc;
    }, {});
    console.log(sector_data);

    let transformedData = {};
    for (const front of fronts) {
        let thislist = [];
        for (const [, entry] of Object.entries(sector_data[front])) {
            let missions = Math.max(entry.missionsWon + entry.missionsLost, 1);
            let killsum = Math.max(entry.bot_kills + entry.bug_kills, 1);
            let DPM = entry.deaths / missions;
            let KPM = killsum / missions;
            let KTD = killsum / Math.max(entry.deaths, 1);
            let timePerMission = entry.missionTime / missions;
            let timePlayedPerMission = entry.timePlayed / missions;
            let MSR = entry.missionsWon / missions;
            
            let FKR = ((entry.friendlies) / Math.max(entry.deaths,1))*100.0;
            let WTL = entry.missionsWon / Math.max(entry.missionsLost, 1);
            thislist.push({
                ...entry,
                missions,
                killsum,
                kills: killsum,
                DPM,
                KPM,
                KTD,
                WTL,
                FKR,
                timePerMission,
                timePlayedPerMission,
                MSR,
            });
        }
        transformedData[front] = thislist;
        console.log(transformedData);
    }
    return transformedData;
}

function make_front_data(data) {
    /**
     * Aggregates and transforms targetcolumn data.
     *
     * This function processes the input data to aggregate statistics for each sector and then
     * calculates derived metrics such as deaths per mission, kills per mission, kills to deaths ratio,
     * and win to loss ratio.
     *
     * @param {Array} data - An array of objects where each object contains data for a specific entry,
     *                       including fields like biome, missionsWon, missionsLost, bot_kills, bug_kills,
     *                       deaths, and friendlies.
     *
     * @returns {Array} An array of transformed objects containing aggregated data and derived metrics for each front.
     */
    console.log("DATA");
    console.log(data);
    let fronts = ["all"];

    let sector_data = data.reduce((acc, entry) => {
        let front = entry.front;
        if (!fronts.includes(front)) fronts.unshift(front);
        let targetcolumn = entry.front;
        if (!acc[front]) {
            acc[front] = { ...entry, count: 1, planets:[entry.planet_name],sectors:[entry.sector_name] };
        } else {
            acc[front].missionsWon  += entry.missionsWon;
            acc[front].missionsLost += entry.missionsLost;
            acc[front].bot_kills    += entry.bot_kills;
            acc[front].bug_kills    += entry.bug_kills;
            acc[front].squid_kills  += entry.squid_kills;
            acc[front].revives      += entry.revives;
            acc[front].deaths       += entry.deaths;
            acc[front].friendlies   += entry.friendlies;
            acc[front].bulletsFired += entry.bulletsFired;
            acc[front].bulletsHit   += entry.bulletsHit;
            acc[front].missionTime  += entry.missionTime;
            acc[front].timePlayed   += entry.timePlayed;
            if (!acc[front].planets.includes(entry.planet_name)){
                acc[front].planets.unshift(entry.planet_name);
            }
            
            if (!acc[front].sectors.includes(entry.sector_name)){
                acc[front].sectors.unshift(entry.sector_name);
            }
            

            acc[front].count += 1;
        }
        return acc;
    }, {});
    let everything = { planets: [], sectors: [],
        front:"TOTAL",
        missionsWon:0,
        missionsLost:0,
        bot_kills:0,
        bug_kills:0,
        squid_kills:0,
        revives:0,
        deaths:0,
        friendlies:0,
        bulletsFired:0,
        bulletsHit:0,
        missionTime:0,
        timePlayed:0,
    };
    for (const [, entry] of Object.entries(sector_data)) {
        everything.missionsWon  += entry.missionsWon;
        everything.missionsLost += entry.missionsLost;
        everything.bot_kills    += entry.bot_kills;
        everything.bug_kills    += entry.bug_kills;
        everything.squid_kills  += entry.squid_kills;
        everything.revives      += entry.revives;
        everything.deaths       += entry.deaths;
        everything.friendlies   += entry.friendlies;
        everything.bulletsFired += entry.bulletsFired;
        everything.bulletsHit   += entry.bulletsHit;
        everything.missionTime  += entry.missionTime;
        everything.timePlayed   += entry.timePlayed;
        
        everything.planets.push(...entry.planets);
        everything.sectors.push(...entry.sectors);


        everything.count += 1;
    }
    sector_data['TOTAL']=everything;
    
    console.log(sector_data);
    let transformedData = {};
    let thislist = [];
    for (const [, entry] of Object.entries(sector_data)) {
        let missions = Math.max(entry.missionsWon + entry.missionsLost, 1);
        let killsum = Math.max(entry.bot_kills + entry.bug_kills, 1);
        let DPM = entry.deaths / missions;
        let KPM = killsum / missions;
        let KTD = killsum / Math.max(entry.deaths, 1);
        let timePerMission = entry.missionTime / missions;
        let timePlayedPerMission = entry.timePlayed / missions;
        let MSR = entry.missionsWon / missions;
        let WTL = entry.missionsWon / Math.max(entry.missionsLost, 1);
        let FKR = ((entry.friendlies) / Math.max(entry.deaths,1))*100.0;
        let planets =entry.planets.length;
        let sectors = entry.sectors.length;
        thislist.push({
            ...entry,
            missions,
            killsum,
            kills: killsum,
            DPM,
            KPM,
            KTD,
            WTL,
            timePerMission,
            timePlayedPerMission,
            MSR,
            FKR,
            planets,
            sectors
        });
    }
    transformedData['all'] = thislist;

    return transformedData;
}

export { make_biome_data, make_sector_data, make_front_data };
