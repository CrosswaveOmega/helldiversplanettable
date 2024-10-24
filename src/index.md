---
theme: dashboard
title: Helldivers 2 War History Central
toc: false
---


# Helldivers 2 War History Central

Nearly everything you could ever hope to learn about the Galactic War's history, along with compiled war statistics.

Updates daily.


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
  

  import {
    makeplot,eList,ListAll, count_distinct_planets,list_text
  } from "./components/HistoryLog.js";


  
import {
  get_update_time_local, get_update_time_utc
} from "./components/time_utils.js";

const planets = FileAttachment("./data/planets.json").json();
const lasttime = FileAttachment("./data/lasttime.json").json();
const historydata= await FileAttachment("./data/historydata.json").json();
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
      max-width: 4000% !important;
    }
  `;
  document.head.appendChild(style);
}
addDynamicCSS(ns);
const count=0;
```

${update_time}
## Current Game State
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

  <div class="card">
    <h2>Total Kills</h2>
    <span class="big">${planets.reduce((acc, planet) => acc + planet.kills, 0).toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>Total Deaths</h2>
    <span class="big">${planets.reduce((acc, planet) => acc + planet.deaths, 0).toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>K/D Ratio</h2>
    <span class="big">${(planets.reduce((acc, planet) => acc + planet.kills, 0) / planets.reduce((acc, planet) => acc + planet.deaths, 0)).toFixed(2)}</span>
  </div>
</div>

## Recent History

<div class="grid grid-cols-3">
<div id="Days" class='card big grid-colspan-2 grid-rowspan-3'>
  <div id="DAYVIEW" style="overflow-y: scroll; max-height: 400px;"></div>
  ${ListAll(historydata,document.getElementById("DAYVIEW"),1)}
  
</div>
<div class="card">
    <h2>Current War Day</h2>
    <span class="big">${Math.floor((new Date().getTime() - new Date('2024-02-08T09:00:00Z').getTime()) / (1000 * 60 * 60 * 24))}</span>
    <br/>
    <span>Each new war day starts at 9:00 UTC.</span>
    
</div>
<div class="card">
    <h2>Last Logged Day</h2>
    <span class="big">${historydata.events[historydata.events.length-1].day}</span>
    <br/>
    <span >Corresponds to ${historydata.events[historydata.events.length-1].time}</span>
  </div>
</div>

See the [Historical War Map](./history_map) to view a recreated map of the galactic war throught the game's runtime.

See the [Battle Tracker](./battle_tracker)  to view all battles fought across every planet in the game.

See the [Full War History Log](./history_log_full)  to read the entire history of the second galactic war, day by day.

### Changelog
* October 24th, 2024
 * Battle tracker now displays total accumulated battle time.
 * Decay Changes are fixed
* October 4th, 2024
  * Refactored the battle tracker's formatting code.
* October 2nd, 2024
  * Changed the primary website font to Chakra Petch, which looks much closer to the in game font.
  * Decay rate changes are now recorded on the history log.
  * Last update time is now (hopefully) displayed in the browser's local timezone.
  