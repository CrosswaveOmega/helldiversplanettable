---
theme: dashboard
title: Front Data
toc: false
---

# Helldivers Data Table - Front Data

<!-- Load and transform the data -->

```js

import {
    bugKills,
    botKills,
    allKills,
    allDeaths,
    kdRatio,
    missionsWon,
    missionsLost,
    missionsWonAndLost,FrontData, BiomeStats,
  } from "./components/dataplots.js";

import {
    make_front_data,
  } from "./components/data_transformers.js";
  
import {
    planetTable, headerMapFront,
  } from "./components/tables.js";
  
import {
    pieChart
  } from "./components/HistoryLog.js";
import {
  get_update_time_local, get_update_time_utc
} from "./components/time_utils.js";

const lasttime = FileAttachment("./data/lasttime.json").json();
```
```js
const planets = FileAttachment("./data/planets.json").json();

let front_data = await planets.then(data => make_front_data(data));

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { inputs } from "@observablehq/inputs";


const update_time = "This table was last updated on " + get_update_time_local(lasttime['update_time']);

const ns = Inputs.text().classList[0];
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


```js


const factcolor = Plot.scale({
  color: {
    type: "categorical",
    domain: ["TERMINIDS", "AUTOMATON", "ILLUMINATE","HUMANS","TERMINIDSL", "AUTOMATONL", "HUMANSL","ILLUMINATEL"],  // specify known categories directly
    unknown: "purple",  // specify the color for unknown categories
    range: ["orange", "red", "purple","blue","darkorange", "darkred", "darkblue","darkpurple"],  // colors for TERMINIDS, AUTOMATON, and HUMANS
  }
});

const biocolors = Plot.scale({
  color: {
    type: "categorical",
    domain: ["TERMINIDS", "AUTOMATON", "ILLUMINATE","HUMANS","TERMINIDSL", "AUTOMATONL", "HUMANSL","ILLUMINATEL"],  // specify known categories directly
    unknown: "purple",  // specify the color for unknown categories
    range: ["orange", "red", "purple", "blue","darkorange", "darkred", "darkblue","darkpurple"],  // colors for TERMINIDS, AUTOMATON, and HUMANS
  }
});
```




${update_time}
```js
    let all_columns=[ 
          "front",
          "planets",
          "sectors",
          "missionsWon",
          "missionsLost",
          "kills",
          "deaths",
          "friendlies",
          "DPM",
          "KPM",
          "KTD",
          "WTL",
          "FKR",
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
          "revives",];
  const front_filter = Inputs.checkbox(['HUMANS','AUTOMATON','TERMINIDS','ILLUMINATE','TOTAL'], {value:['HUMANS','AUTOMATON','TERMINIDS','ILLUMINATE','TOTAL'], label:'Filter by front'})
  const front_filterg= Generators.input(front_filter);
  const show_if =   Inputs.checkbox(
      new Map([
        ["Has at least one missions", 1],
        ["Has at least ten missions won and ten missions lost", 10],
      ]),
      {value: [1,10], label: "Filter on missions", format: ([name, value]) => `${name}`}
    );
  const show_ifg= Generators.input(show_if);
  const hidecol = 
    Inputs.checkbox(
      headerMapFront,
      {value: ['bulletsFired','bulletsHit','accuracy','bug_kills','bot_kills','squid_kills','revives'], label: "Show/hide columns", format: ([name, value]) => `${name}`}
    )
  ;
  const hidecolg= Generators.input(hidecol);
  const threshold = view(Inputs.range([0, 1000], {value: 5, step: 1,width:1000, label: "Minimum missions limit"}))
```




<div class="grid grid-cols-1">
  <div class="card">
  ${front_filter}
  ${show_if}
  ${hidecol}
    ${resize((width) => planetTable(front_data['all'], {width, all_columns, front_filter:front_filterg, sortby:'front',show_if:show_ifg,hidecol:hidecolg}))}
  </div>
</div>



<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(front_data['all'],3,'front', {width, threshold,biocolors, title:'Helldiver deaths per mission across all fronts'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(front_data['all'],4,'front', {width, threshold,biocolors, title:'Helldiver kills per mission across all fronts'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(front_data['all'],5,'front', {width, threshold,biocolors, title:'Helldiver kills to deaths across all fronts'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(front_data['all'],6,'front', {width, threshold,biocolors, title:'Helldiver mission wins to losses across all fronts'}))}
  </div>

</div>


</div>
