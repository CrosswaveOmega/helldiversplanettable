---
theme: dashboard
title: Biome Data
toc: false
---

# Helldivers Data Table - Biome Data

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
    make_biome_data
  } from "./components/data_transformers.js";

import {
  pieChart
} from "./components/HistoryLog.js";

import {
  planetTable, headerMapBiome,
} from "./components/tables.js";

import {
  get_update_time_local, get_update_time_utc
} from "./components/time_utils.js";

const planets = FileAttachment("./data/planets.json").json();

let biome_data = await planets.then(data => make_biome_data(data));

const lasttime = FileAttachment("./data/lasttime.json").json();
```
```js
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { inputs } from "@observablehq/inputs";

const update_time = "This table was last updated on " + get_update_time_local(lasttime['update_time']);
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

const biocolors = Plot.scale({
  color: {
    type: "categorical",
    domain: d3.groupSort(planets, (D) => -D.length, (d) => d.biome).filter((d) => d !== "Other"),
    unknown: "var(--theme-foreground-muted)"
  }
});
const factcolor = Plot.scale({
  color: {
    type: "categorical",
    domain: ["TERMINIDS", "AUTOMATON", "ILLUMINATE","HUMANS","TERMINIDSL", "AUTOMATONL", "HUMANSL","ILLUMINATEL"],  // specify known categories directly
    unknown: "purple",  // specify the color for unknown categories
    range: ["orange", "red", "purple", "blue","darkorange", "darkred", "darkblue","darkpurple"],  // colors for TERMINIDS, AUTOMATON, and HUMANS
  }
});
```



<!-- Plot of launch history -->


```js
    let all_columns=[ 
          "biome",
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
          "FKR",
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
  const front_filter = Inputs.checkbox(['HUMANS','AUTOMATON','TERMINIDS','ILLUMINATE'], {value:['AUTOMATON','TERMINIDS','ILLUMINATE'], label:'Filter by front'})
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
      headerMapBiome,
      {value: ['bulletsFired','bulletsHit','accuracy','squid_kills','revives'], label: "Show/hide columns", format: ([name, value]) => `${name}`}
    )
  ;
  const hidecolg= Generators.input(hidecol);
  
  const threshold = view(Inputs.range([0, 1000], {value: 5, step: 1,width:1000, label: "Minimum missions limit"}))
```




<div class="grid grid-cols-1">
  <div class="card">
  ${show_if}
  ${hidecol}
    ${resize((width) => planetTable(biome_data['all'], {width, all_columns, front_filter:['HUMANS','AUTOMATON','TERMINIDS'], sortby:'biome',show_if:show_ifg,hidecol:hidecolg}))}
  </div>
</div>



</div>

<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],3,'biome', {width, threshold,biocolors, title:'Helldiver deaths per mission in all biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],4,'biome', {width, threshold,biocolors, title:'Helldiver kills per mission in all biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],5,'biome', {width, threshold,biocolors, title:'Helldiver kills to deaths per in biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],6,'biome', {width, threshold,biocolors, title:'Helldiver mission wins to losses per in biomes'}))}
  </div>

</div>




<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(biome_data['TERMINIDS'],3,'biome', {width, threshold,biocolors,title:'Helldiver deaths per mission in TERMINID front biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['TERMINIDS'],4,'biome', {width, threshold,biocolors, title:'Helldiver kills per mission in TERMINID front biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['TERMINIDS'],5,'biome', {width, threshold,biocolors, title:'Helldiver kills to deaths in TERMINID front biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['TERMINIDS'],6,'biome', {width, threshold,biocolors, title:'Helldiver mission wins to losses in TERMINID front biomes'}))}
  </div>

</div>




<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(biome_data['AUTOMATON'],3,'biome', {width, threshold,biocolors, title:'Helldiver deaths per mission in AUTOMATON front biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['AUTOMATON'],4,'biome', {width, threshold,biocolors, title:'Helldiver kills per mission in AUTOMATON front biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['AUTOMATON'],5,'biome', {width, threshold,biocolors, title:'Helldiver kills to deaths in AUTOMATON front biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['AUTOMATON'],6,'biome', {width, threshold,biocolors, title:'Helldiver mission wins to losses in AUTOMATON front biomes'}))}
  </div>



<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(biome_data['ILLUMINATE'],3,'biome', {width, threshold,biocolors, title:'Helldiver deaths per mission in ILLUMINATE front biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['ILLUMINATE'],4,'biome', {width, threshold,biocolors, title:'Helldiver kills per mission in ILLUMINATE front biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['ILLUMINATE'],5,'biome', {width, threshold,biocolors, title:'Helldiver kills to deaths in ILLUMINATE front biomes'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['ILLUMINATE'],6,'biome', {width, threshold,biocolors, title:'Helldiver mission wins to losses in ILLUMINATE front biomes'}))}
  </div>

</div>
