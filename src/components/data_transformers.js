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

    if (!acc[front]) {
      acc[front] = {};
    }

    if (!acc["all"][entry.biome]) {
      acc["all"][entry.biome] = { ...entry, count: 1 };
    } else {
      acc["all"][entry.biome].missionsWon += entry.missionsWon;
      acc["all"][entry.biome].missionsLost += entry.missionsLost;
      acc["all"][entry.biome].bot_kills += entry.bot_kills;
      acc["all"][entry.biome].bug_kills += entry.bug_kills;
      acc["all"][entry.biome].deaths += entry.deaths;
      acc["all"][entry.biome].friendlies += entry.friendlies;
      acc["all"][entry.biome].count += 1;
    }

    if (!acc[front][entry.biome]) {
      acc[front][entry.biome] = { ...entry, count: 1 };
    } else {
      acc[front][entry.biome].missionsWon += entry.missionsWon;
      acc[front][entry.biome].missionsLost += entry.missionsLost;
      acc[front][entry.biome].bot_kills += entry.bot_kills;
      acc[front][entry.biome].bug_kills += entry.bug_kills;
      acc[front][entry.biome].deaths += entry.deaths;
      acc[front][entry.biome].friendlies += entry.friendlies;
      acc[front][entry.biome].count += 1;
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
      let dpm = entry.deaths / missions;
      let kpm = killsum / missions;
      let ktd = killsum / Math.max(entry.deaths, 1);
      let wtl = entry.missionsWon / Math.max(entry.missionsLost, 1);
      thislist.push({ ...entry, missions, killsum, dpm, kpm, ktd, wtl });
    }
    transformedData[front] = thislist;
    console.log(transformedData);
  }
  return transformedData;
}

function make_sector_data(data) {
  /**
   * Aggregates and transforms sector data.
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
    
    if (!acc["all"]) {
      acc["all"] = {};
    }
    let sector=entry.sector_name;
    if (!acc["all"][sector]) {
      acc["all"][sector] = { ...entry, count: 1 };
    } else {
      acc["all"][sector].missionsWon += entry.missionsWon;
      acc["all"][sector].missionsLost += entry.missionsLost;
      acc["all"][sector].bot_kills += entry.bot_kills;
      acc["all"][sector].bug_kills += entry.bug_kills;
      acc["all"][sector].deaths += entry.deaths;
      acc["all"][sector].friendlies += entry.friendlies;
      acc["all"][sector].count += 1;
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
      let dpm = entry.deaths / missions;
      let kpm = killsum / missions;
      let ktd = killsum / Math.max(entry.deaths, 1);
      let wtl = entry.missionsWon / Math.max(entry.missionsLost, 1);
      thislist.push({ ...entry, missions, killsum, dpm, kpm, ktd, wtl });
    }
    transformedData[front] = thislist;
    console.log(transformedData);
  }
  return transformedData;
}

export {
make_biome_data,
make_sector_data
};
