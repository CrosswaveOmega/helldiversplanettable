---
theme: dashboard
title: Helldivers 2 Planet Table
toc: false
---


# Helldivers Data Table

<style>
  
@import url('https://fonts.googleapis.com/css2?family=Goldman&display=swap');

@import url('https://fonts.googleapis.com/css2?family=Rationale&display=swap');
body{ 
  font-family: 'Goldman' !important;
}
.card, .big {
  font-family: 'Goldman' !important;
}
[class*="inputs"] {
  font-family: 'Rationale' !important;
}
[class*="plot"] {
  font-family: 'Goldman' !important;
}
</style>

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
const planets = FileAttachment("./data/planets.json").json();
```


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
function planetTable(data, {width, factcolor, front_filter,show_if}) {
  let filteredData = data.filter(d => front_filter.includes(d.front));
  filteredData= filteredData.filter(d => (show_if.includes(1) && d.missionsWon > 0) || !show_if.includes(1));
return Inputs.table(filteredData,{
  columns:[ 'index',"planet_name",
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
        "biome",
        "hazards",
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
        "revives",],
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
    revives: "Revives"
}, 
sort:'sector_name', reverse:false,

width:width,



});

}

const front_filter = view(Inputs.checkbox(['HUMANS','AUTOMATON','TERMINIDS'], {value:['HUMANS','AUTOMATON','TERMINIDS'], label:'Filter by front'}))
const show_if = view(
  Inputs.checkbox(
    new Map([
      ["Has at least one missions", 1],
    ]),
    {value: [1], label: "Filter on missions", format: ([name, value]) => `${name}`}
  )
);
```




<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => planetTable(planets, {width, factcolor, front_filter, show_if}))}
  </div>
</div>
<!-- Cards with big numbers -->

<div class="grid grid-cols-3">
  <div class="card">
    <h2>Terminid planets</h2>
    <span class="big">${planets.filter((d) => d.front === "TERMINIDS").length.toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>Bot planets</h2>
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


<!-- <canvas id="canvas" width="360" height="20" style="max-width: 100%; color: var(--theme-foreground-focus); border: solid 1px var(--theme-foreground);"></canvas>



```js
const canvas = document.querySelector("#canvas");
const context = canvas.getContext("2d");
context.fillStyle = getComputedStyle(canvas).color;
```

```js
const replay = view(Inputs.button("Replay"));
replay; // run this block when the button is clicked
const progress = (function* () {
  for (let i = canvas.width; i >= 0; --i) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillRect(0, 0, i, canvas.height);
    yield canvas;
  }
})();
```
 -->

<div class="grid grid-cols-3">
  <div class="card">
    ${resize((width) => allKills(planets, {width, factcolor}))}
  </div>
    <div class="card">
    ${resize((width) => allDeaths(planets, {width, factcolor}))}
  </div>
    <div class="card">
    ${resize((width) => kdRatio(planets, {width, factcolor}))}
  </div>
</div>



<div class="grid grid-cols-2">
  <div class="card">
    ${resize((width) => missionsWon(planets, {width, factcolor}))}
  </div>
      <div class="card">
    ${resize((width) => missionsLost(planets, {width, factcolor}))}
  </div>
    
</div>


<div class="grid grid-cols-1">
<div class="card">
    ${resize((width) => missionsWonAndLost(planets, {width, factcolor}))}
  </div>
  </div>

