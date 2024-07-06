---
theme: dashboard
title: Helldivers 2 Planet Table
toc: false
---


# Helldivers Data Table



```js

import {
    bugKills,
    botKills,
    allKills,
    allDeaths,
    kdRatio,
    missionsWon,
    missionsLost,
    missionsWonAndLost
  } from "./components/dataplots.js";
  import {
    planetTable, headerMapReversed,
  } from "./components/tables.js";
  
const planets = FileAttachment("./data/planets.json").json();
const lasttime = FileAttachment("./data/lasttime.json").json();
```
```js
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { inputs } from "@observablehq/inputs";

const timestamp = new Date();
const formattedTimestamp = timeFormat("%Y-%m-%d %H:%M:%S %Z")(timestamp);
const update_time = "This table was last updated on " + lasttime['update_time'];
const ns = Inputs.text().classList[0];
console.log(ns);
function addDynamicCSS(ns) {
  const style = document.createElement("style");
  style.innerHTML = `
    .${ns}, .${ns}-checkbox {
      max-width: 100% !important;
    }
  `;
  document.head.appendChild(style);
}
addDynamicCSS(ns);
```

${update_time}

```js

const factcolor = Plot.scale({
  color: {
    type: "categorical",
    domain: ["TERMINIDS", "AUTOMATON", "HUMANS","TERMINIDSL", "AUTOMATONL", "HUMANSL"],  // specify known categories directly
    unknown: "purple",  // specify the color for unknown categories
    range: ["orange", "red", "blue","darkorange", "darkred", "darkblue"],  // colors for TERMINIDS, AUTOMATON, and HUMANS
  }
});
```


```js


const front_filter = Inputs.checkbox(['HUMANS','AUTOMATON','TERMINIDS'], {value:['AUTOMATON','TERMINIDS'], label:'Filter by front'})
const front_filterg= Generators.input(front_filter);
const show_if =   Inputs.checkbox(
    new Map([
      ["Has at least one missions", 1],
      ["Has at least ten missions won and ten missions lost", 10],
    ]),
    {value: [1,10], label: "Filter on missions", format: ([name, value]) => `${name}`}
  );
const show_ifg= Generators.input(show_if);
const headerMapReversed = new Map([
    ["Index", "index"],
    ["Planet Name", "planet_name"],
    ["Sector Name", "sector_name"],

    ["Front", "front"],
    ["Biome", "biome"],
    ["Hazards", "hazards"],
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
    ["Current Owner", "current_owner"],
    ["Squid Kills", "squid_kills"],
    ["Initial Owner", "initial_owner"],
    ["Revives", "revives"]
]);
let all_columns=[ 'index',
  "planet_name",
        "sector_name",
        "front",
        "biome",
        "hazards",
        "missionsWon",
        "missionsLost",
        "kills",
        "deaths",
        "friendlies",
        "DPM",
        "KPM",
        "KTD",
        "WTL",

        "MSR",
        "missionTime",
        "timePerMission",
        "timePlayed",
        "timePlayedPerMission",
        "bulletsFired",
        "bulletsHit",
        "accuracy",
        "bug_kills",
        "bot_kills",
        "squid_kills",
        "current_owner",
        "initial_owner",
        "revives",];
const hidecol = 
  Inputs.checkbox(
    headerMapReversed,
    {value: ['index','hazards','bulletsFired','bulletsHit','accuracy','bug_kills','bot_kills','current_owner','squid_kills','initial_owner','revives'], label: "Show/hide columns", format: ([name, value]) => `${name}`}
  )
;
const hidecolg= Generators.input(hidecol);

```




<div class="grid grid-cols-1">
  <div class="card">
  ${front_filter}
  ${show_if}
  ${hidecol}
    ${resize((width) => planetTable(planets, {width, all_columns, front_filter:front_filterg, sortby:'index',show_if:show_ifg,hidecol:hidecolg}))}
  </div>
</div>
<!-- Cards with big numbers -->

<div class="grid grid-cols-3">
  <div class="card">
    <h2>Terminid front planets</h2>
    <span class="big">${planets.filter((d) => d.front === "TERMINIDS").length.toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>Bot front planets</h2>
    <span class="big">${planets.filter((d) => d.front=== "AUTOMATON").length.toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>Safe Worlds</h2>
    <span class="big">${planets.filter((d) => d.front=== "HUMANS").length.toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>Owned by Terminds</h2>
    <span class="big">${planets.filter((d) => d.current_owner === "Terminids").length.toLocaleString("en-US")}</span>
  </div>
    <div class="card">
    <h2>Owned by Bots</h2>
    <span class="big">${planets.filter((d) => d.current_owner === "Automaton").length.toLocaleString("en-US")}</span>
  </div>
    <div class="card">
    <h2>Owned by Us</h2>
    <span class="big">${planets.filter((d) => d.current_owner === "Humans").length.toLocaleString("en-US")}</span>
  </div>

  <div class="card">
    <h2>Initally Owned by Terminds</h2>
    <span class="big">${planets.filter((d) => d.initial_owner === "Terminids").length.toLocaleString("en-US")}</span>
  </div>
    <div class="card">
    <h2>Initally Owned by Bots</h2>
    <span class="big">${planets.filter((d) => d.initial_owner === "Automaton").length.toLocaleString("en-US")}</span>
  </div>
    <div class="card">
    <h2>Initally Owned by Us</h2>
    <span class="big">${planets.filter((d) => d.initial_owner === "Humans").length.toLocaleString("en-US")}</span>
  </div>
</div>


### Some notes.

A planet's "Front" is based on if that planet is connected to a Terminid or Automaton controlled planet via supply line chain.  

Human front planets merely mean that the planet is not connected to an adversarial faction.



<!-- <canvas id="canvas" width="360" height="20" style="max-width: 100%; color: var(--theme-foreground-focus); border: solid 1px var(--theme-foreground);"></canvas>





 -->


