function make_biome_data(data) {
  /**
   * Aggregates and transforms biome data.
   *
   * This function processes the input data to aggregate statistics for each biome and then
   * calculates derived metrics such as deaths per mission, kills per mission, kills to deaths ratio,
   * and win to loss ratio.
   *
   * @param {Array} data - An array of objects where each object contains data for a specific entry,
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
   * This function processes the input data to aggregate statistics for each biome and then
   * calculates derived metrics such as deaths per mission, kills per mission, kills to deaths ratio,
   * and win to loss ratio.
   *
   * @param {Array} data - An array of objects where each object contains data for a specific entry,
   *                       including fields like biome, missionsWon, missionsLost, bot_kills, bug_kills,
   *                       deaths, and friendlies.
   *
   * @returns {Array} An array of transformed objects containing aggregated data and derived metrics for each biome.
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

export { make_biome_data, make_sector_data };
