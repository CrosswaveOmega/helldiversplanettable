---
theme: dashboard
title: Sector Data
toc: false
---

# Helldivers Data Table - Sector Data

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
    missionsWonAndLost,BiomeData, BiomeStats,
  } from "./components/dataplots.js";

import {
    make_sector_data,
  } from "./components/data_transformers.js";
  
import {
    planetTable, headerMapSector,
  } from "./components/tables.js";
  
import {
    pieChart
  } from "./components/HistoryLog.js";
const planets = FileAttachment("./data/planets.json").json();

let sector_data = await planets.then(data => make_sector_data(data));

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

const biocolors = Plot.scale({
  color: {
    type: "categorical",
    domain: d3.groupSort(planets, (D) => -D.length, (d) => d.sector_name).filter((d) => d !== "Other"),
    unknown: "var(--theme-foreground-muted)"
  }
});
const factcolor = Plot.scale({
  color: {
    type: "categorical",
    domain: ["TERMINIDS", "AUTOMATON", "HUMANS","TERMINIDSL", "AUTOMATONL", "HUMANSL"],  // specify known categories directly
    unknown: "purple",  // specify the color for unknown categories
    range: ["orange", "red", "blue","darkorange", "darkred", "darkblue"],  // colors for TERMINIDS, AUTOMATON, and HUMANS
  }
});
```




${update_time}
```js
    let all_columns=[ 
          "sector_name",
          "front",
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
          "revives",];
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
  const hidecol = 
    Inputs.checkbox(
      headerMapSector,
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
    ${resize((width) => planetTable(sector_data['all'], {width, all_columns, front_filter:front_filterg, sortby:'sector_name',show_if:show_ifg,hidecol:hidecolg}))}
  </div>
</div>



<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(sector_data['all'],3,'sector_name', {width, threshold,biocolors, title:'Helldiver deaths per mission across all sectors'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(sector_data['all'],4,'sector_name', {width, threshold,biocolors, title:'Helldiver kills per mission across all sectors'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(sector_data['all'],5,'sector_name', {width, threshold,biocolors, title:'Helldiver kills to deaths across all sectors'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(sector_data['all'],6,'sector_name', {width, threshold,biocolors, title:'Helldiver mission wins to losses across all sectors'}))}
  </div>

</div>




<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(sector_data['TERMINIDS'],3,'sector_name', {width, threshold,biocolors, title:'Helldiver deaths per mission across all TERMINID sectors'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(sector_data['TERMINIDS'],4,'sector_name', {width, threshold,biocolors, title:'Helldiver kills per mission across all TERMINID sectors'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(sector_data['TERMINIDS'],5,'sector_name', {width, threshold,biocolors, title:'Helldiver kills to deaths across all TERMINID sectors'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(sector_data['TERMINIDS'],6,'sector_name', {width, threshold,biocolors, title:'Helldiver mission wins to losses across all TERMINID sectors'}))}
  </div>

</div>




<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(sector_data['AUTOMATON'],3,'sector_name', {width, threshold,biocolors, title:'Helldiver deaths per mission across all AUTOMATON sectors'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(sector_data['AUTOMATON'],4,'sector_name', {width, threshold,biocolors, title:'Helldiver kills per mission across all AUTOMATON sectors'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(sector_data['AUTOMATON'],5,'sector_name', {width, threshold,biocolors, title:'Helldiver kills to deaths across all AUTOMATON sectors'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(sector_data['AUTOMATON'],6,'sector_name', {width, threshold,biocolors, title:'Helldiver mission wins to losses across all AUTOMATON sectors'}))}
  </div>

</div>
