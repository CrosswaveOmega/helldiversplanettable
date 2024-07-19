import * as Inputs from "npm:@observablehq/inputs";
function planetTable(
  data,
  { width, all_columns, sortby = "index", front_filter, show_if, hidecol }
) {
  let filteredData = data.filter((d) => front_filter.includes(d.front));
  filteredData = filteredData.filter(
    (d) => (show_if.includes(1) && d.missionsWon > 1) || !show_if.includes(1)
  );
  filteredData = filteredData.filter(
    (d) =>
      (show_if.includes(10) && d.missionsWon > 10 && d.missionsLost > 10) ||
      !show_if.includes(10)
  );

  const filteredColumns = all_columns.filter((col) => !hidecol.includes(col));

  return Inputs.table(filteredData, {
    columns: filteredColumns,
    header: {
      index: "Index",
      planet_name: "Planet Name",
      sector_name: "Sector Name",
      front: "Front",
      current_owner: "Current Owner",
      missionsWon: "Missions Won",
      missionsLost: "Missions Lost",
      kills: "Kills",
      deaths: "Deaths",
      friendlies: "Friendlies",
      DPM: "DPM",
      KPM: "KPM",
      KTD: "KTD",
      WTL: "WTL",
      biome: "Biome",
      hazards: "Hazards",
      MSR: "MSR",
      missionTime: "Mission Time",
      timePerMission: "Time Per Mission",
      timePlayed: "Time Played",
      timePlayedPerMission: "Time Played Per Mission",
      bulletsFired: "Bullets Fired",
      bulletsHit: "Bullets Hit",
      accuracy: "Accuracy",
      bug_kills: "Bug Kills",
      bot_kills: "Bot Kills",
      squid_kills: "Squid Kills",
      initial_owner: "Initial Owner",
      revives: "Revives",
    },
    sort: sortby,
    reverse: false,

    width: width,
  });
}

const headerMapSector = new Map([
  ["Sector Name", "sector_name"],
  ["Front", "front"],
  ["Missions Won", "missionsWon"],
  ["Missions Lost", "missionsLost"],
  ["Kills", "kills"],
  ["Deaths", "deaths"],
  ["Friendlies", "friendlies"],
  ["DPM", "DPM"],
  ["KPM", "KPM"],
  ["KTD", "KTD"],
  ["WTL", "WTL"],

  ["MSR", "MSR"],
  ["Mission Time", "missionTime"],
  ["Time Per Mission", "timePerMission"],
  ["Time Played", "timePlayed"],
  ["Time Played Per Mission", "timePlayedPerMission"],
  ["Bullets Fired", "bulletsFired"],
  ["Bullets Hit", "bulletsHit"],
  ["Accuracy", "accuracy"],
  ["Bug Kills", "bug_kills"],
  ["Bot Kills", "bot_kills"],
  ["Squid Kills", "squid_kills"],
  ["Revives", "revives"],
]);

const headerMapBiome = new Map([
  ["Biome", "biome"],
  ["Missions Won", "missionsWon"],
  ["Missions Lost", "missionsLost"],
  ["Kills", "kills"],
  ["Deaths", "deaths"],
  ["Friendlies", "friendlies"],
  ["DPM", "DPM"],
  ["KPM", "KPM"],
  ["KTD", "KTD"],
  ["WTL", "WTL"],

  ["MSR", "MSR"],
  ["Mission Time", "missionTime"],
  ["Time Per Mission", "timePerMission"],
  ["Time Played", "timePlayed"],
  ["Time Played Per Mission", "timePlayedPerMission"],
  ["Bullets Fired", "bulletsFired"],
  ["Bullets Hit", "bulletsHit"],
  ["Accuracy", "accuracy"],
  ["Bug Kills", "bug_kills"],
  ["Bot Kills", "bot_kills"],
  ["Squid Kills", "squid_kills"],
  ["Revives", "revives"],
]);

export { planetTable, headerMapSector, headerMapBiome };
