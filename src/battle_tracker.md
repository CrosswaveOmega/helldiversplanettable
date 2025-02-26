---
title: Battle Tracker History Log
toc: True
sidebar: true
---
# The Battle Tracker



```js
  import {
    ListAll, count_distinct_planets,
  } from "./components/HistoryLog.js";
  import {
    make_sector_data,
  } from "./components/data_transformers.js";
    import {
    count_distinct_planet_battles,
  } from "./components/battle_tracker.js";
import {
    SimplifyHistory,
  } from "./components/history_simplify.js";

      import {
    BattleList,SectorBattleList
  } from "./components/battle_list_gen.js";
  import {get_update_time_local, get_update_time_utc} from "./components/time_utils.js";

```

```js


const lasttime = FileAttachment("./data/lasttime.json").json();
const planets = FileAttachment("./data/planets.json").json();

let sector_data = await planets.then(data => make_sector_data(data));

const historydata= await FileAttachment("./data/historydata.json").json();
```
```js

var update_time_string = lasttime['update_time']

var update_time_local = get_update_time_local(lasttime['update_time'])
var update_time_utc =get_update_time_utc(lasttime['update_time'])




function sector_battle_table(historydata, mode, {width}) {
  /**
   * Generates a table representation of sector battles.
   * @param {DaysObject} historydata - The historical battle data.
   * @param {number} mode - Determines the table mode for display formatting.
   * @param {Object} width - The width configuration for the table.
   * @returns {Object} - The table object for rendering sector battles information.
   */
  const countDistinctPlanetsData = count_distinct_planet_battles(historydata,false,sector_data).planetTypes;
  let planets = Object.values(countDistinctPlanetsData);

  let columns = [];
  let header = {};
  //planetTypes[sector] = { 'name': sector, 'planets': {},'battles':0,'win':0,'loss':0};
  if (mode === 0) {
    columns = ['name', 'front','battles', 'win','loss','current'];
    header = {
      name: 'Sector',
      front: "Front",
      battles: "Campaigns",
      win: "Campaigns Won",
      loss: "Campaigns Lost",
      current: "Campaigns Ongoing"
    };
  }

  return Inputs.table(planets, {
    columns: columns,
    header: header,
    width: width,
    height:(planets.length)*22-1,
  sort:'campaigns',
  reverse:true,

  });
}

function sum_entries_by_front(historydata) {
  /**
   * Sums up entries related to each front from historical data.
   * @param {DaysObject} historydata - The historical battle data.
   * @returns {Object} - An object containing summed up battle data by fronts.
   */
  const frontSums = {};

  const planetTypes = count_distinct_planet_battles(historydata,false,sector_data).factionTypes;
  for (const sector in planetTypes) {
    const { front, battles, win, loss,swin,sloss, current, campaign_start, campaign_end, flips, planetwon, defensestart, defensewon, defenselost } = planetTypes[sector];

    if (!frontSums[front]) {
      frontSums[front] = {
        front: front,
        battles: 0,
        win: 0,
        loss: 0,
        current: 0,
        campaign_start: 0,
        campaign_end: 0,
        flips: 0,
        planetwon: 0,
        defensestart: 0,
        defensewon: 0,
        defenselost: 0
      };
    }

    frontSums[front].battles += battles;
    frontSums[front].win += win;
    frontSums[front].loss += loss;
    frontSums[front].current += current;
    frontSums[front].campaign_start += campaign_start;
    frontSums[front].campaign_end += campaign_end;
    frontSums[front].flips += flips;
    frontSums[front].planetwon += planetwon;
    frontSums[front].defensestart += defensestart;
    frontSums[front].defensewon += defensewon;
    frontSums[front].defenselost += defenselost;
  }

  return frontSums;
}


function count_distinct_planets_table(historydata, mode, {width}) {
  /**
   * Generates a table representation of distinct planets.
   * @param {DaysObject} historydata - The historical planet data.
   * @param {number} mode - Determines the table mode for display formatting.
   * @param {Object} width - The width configuration for the table.
   * @returns {Object} - The table object for rendering distinct planet information.
   */
  const countDistinctPlanetsData = count_distinct_planets(historydata,planets);
  let planet_data = Object.values(countDistinctPlanetsData);

  let columns = [];
  let header = {};

  if (mode === 0) {
    columns = ['name', 'front', 'campaigns', 'lib_campaigns','defenses', 'planet_flips'];
    header = {
      name: 'Planet',
      front: 'Front',
      campaigns: "Campaigns",
      lib_campaigns: "Liberations",
       defenses: "Defenses",
      planet_flips: "Planet Flips"
    };
  } else if (mode === 1) {
    columns = ['name', 'campaigns','lib_campaigns', 'libwins', 'liblost'];
    header = {
      name: 'Planet',

      campaigns: "Campaigns",
      lib_campaigns: "Liberation Campaigns",
      libwins: "Liberations Won",
      liblost: "Liberations Lost"
    };
  } else if (mode === 2) {
    columns = ['name','campaigns', 'defenses', 'defenses_won', 'defenses_lost'];
    header = {
      name: 'Planet',

      campaigns: "Campaigns",
      defenses: "Defense Campaigns",
      defenses_won: "Defenses Won",
      defenses_lost: "Defenses Lost"
    };
  }

  return Inputs.table(planet_data, {
    columns: columns,
    header: header,
    width: width,
  sort:'campaigns',
  reverse:true,

  });
}

const entry_sums=sum_entries_by_front(historydata);
```


### ${update_time_utc} 
### ${update_time_local}

**ALL DISPLAYED TIMES ARE IN UTC**

<details>
<summary><bold>What does this all mean?</bold></summary>

A Battle is any liberation or defence campaign on a world.

Battles end when a planet is liberated, we lose access to a planet's supply lines, or we successfully defend a world.

We win battles if we successfully liberate or defend a world.

We lose battles if we fail to defend a world, or the world in question can't be reached from supply lines.

</details>





Ongoing Battles
<div class="grid grid-cols-1">
<div class="card big grid-colspan-2" >
${BattleList(historydata,false,false,document.getElementById("history2"),1,count_distinct_planet_battles,sector_data)}
  <div id="history2" style="max-height: 500px; overflow-y: auto;">

  </div>
  </div>
  </div>

```js
const showEventsBox = Inputs.toggle({label: "Show Events", value: false});

const showEvents= Generators.input(showEventsBox);

const NoSectorBox = Inputs.toggle({label: "Don't Show Sectors", value: false});

const noSectors= Generators.input(NoSectorBox);


```

All Planet Battles
<div class="grid grid-cols-1">
<div class="card big grid-colspan-2" >
${showEventsBox}
${NoSectorBox}

${BattleList(historydata,showEvents,noSectors,document.getElementById("history"),0,count_distinct_planet_battles,sector_data)}
  <div id="history" style="max-height: 500px; overflow-y: auto;">

  </div>
  </div>
  </div>

All Sector Battles

<div class="grid grid-cols-1">
<div class="card big grid-colspan-2" >

  ${SectorBattleList(historydata,showEvents,document.getElementById("history3"),0,count_distinct_planet_battles,sector_data)}
  <div id="history3" style="max-height: 500px; overflow-y: auto;">

  </div>
</div>

</div>
</div>
PLEASE NOTE:
Because the Illuminate have not occupied any planet yet as with the Terminids and Automatons, 
a proper front for the Illuminate **cannot be determined as of yet.** 

For now, the Illuminate invasions are considered to be on the HUMANS front.

<div class="grid grid-cols-3">
    <div  class='card' style="font-size: 1.1em;">
    <h2>Terminid Campaigns</h2>
    <span >Total: ${entry_sums['Terminid'].battles}</span><br/>
      <span >Won: ${entry_sums['Terminid'].win}</span><br/>
      <span >Lost: ${entry_sums['Terminid'].loss}</span><br/>
      <span >Ongoing: ${entry_sums['Terminid'].current}</span><br/>
      <span >PlanetFlips: ${entry_sums['Terminid'].flips}</span><br/>
  </div>
    <div  class='card' style="font-size: 1.1em;">
    <h2>Terminid Liberation Campaigns</h2>
    <span >Total: ${entry_sums['Terminid'].campaign_start}</span><br/>
      <span >Won: ${entry_sums['Terminid'].planetwon}</span><br/>
      <span >Lost: ${entry_sums['Terminid'].campaign_end}</span><br/>
      <span >Win%: ${(100*entry_sums['Terminid'].planetwon/(entry_sums['Terminid'].campaign_end+entry_sums['Terminid'].planetwon)).toFixed(2)}</span><br/>
  </div>

  <div  class='card' style="font-size: 1.1em;">
    <h2>Terminid Defense Campaigns</h2>
    <span >Total: ${entry_sums['Terminid'].defensestart}</span><br/>
      <span >Won: ${entry_sums['Terminid'].defensewon}</span><br/>
      <span >Lost: ${entry_sums['Terminid'].defenselost}</span><br/>
      <span >Ongoing: ${entry_sums['Terminid'].current}</span><br/>
      <span >Win%: ${(100*entry_sums['Terminid'].defensewon/(entry_sums['Terminid'].defensewon+entry_sums['Terminid'].defenselost)).toFixed(2)}</span><br/>
  </div>

  <div class='card' style="font-size: 1.1em;">
    <h2>Automaton Campaigns</h2>
    <span >Total:${entry_sums['Automaton'].battles}</span><br/>
      <span >Won: ${entry_sums['Automaton'].win}</span><br/>
      <span >Lost: ${entry_sums['Automaton'].loss}</span><br/>
      <span >Ongoing: ${entry_sums['Automaton'].current}</span><br/>
      <span >PlanetFlips: ${entry_sums['Automaton'].flips}</span><br/>
  </div>
    <div  class='card' style="font-size: 1.1em;">
    <h2>Automaton Liberation Campaigns</h2>
    <span >Total: ${entry_sums['Automaton'].campaign_start}</span><br/>
      <span >Won: ${entry_sums['Automaton'].planetwon}</span><br/>
      <span >Lost: ${entry_sums['Automaton'].campaign_end}</span><br/>
      <span >Win%: ${(100*entry_sums['Automaton'].planetwon/(entry_sums['Automaton'].campaign_end+entry_sums['Automaton'].planetwon)).toFixed(2)}</span><br/>
  </div>
      <div  class='card' style="font-size: 1.1em;">
    <h2>Automaton Defence Campaigns</h2>
    <span >Total: ${entry_sums['Automaton'].defensestart}</span><br/>
      <span >Won: ${entry_sums['Automaton'].defensewon}</span><br/>
      <span >Lost: ${entry_sums['Automaton'].defenselost}</span><br/>
      <span >Win%: ${(100*entry_sums['Automaton'].defensewon/(entry_sums['Automaton'].defensewon+entry_sums['Automaton'].defenselost)).toFixed(2)}</span><br/>
  </div>
   <div  class='card' style="font-size: 1.1em;">
    <h2>Illuminate invasion campaigns</h2>
    <span >Total: ${entry_sums['Illuminate'].defensestart}</span><br/>
      <span >Won: ${entry_sums['Illuminate'].defensewon}</span><br/>
      <span >Lost: ${entry_sums['Illuminate'].defenselost}</span><br/>
      <span >Win%: ${(100*entry_sums['Illuminate'].defensewon/(entry_sums['Illuminate'].defensewon+entry_sums['Illuminate'].defenselost)).toFixed(2)}</span><br/>
  </div>
</div>






### Data Tables.
<div class="grid grid-cols-1">
    <div  class='card' style="font-size: 1.1em;">
    ${resize((width) => sector_battle_table(historydata,0,{width}))}
  </div>
</div>

<div class="grid grid-cols-1">
  <div class='card' style="font-size: 1.1em;">
    ${resize((width) => count_distinct_planets_table(historydata,0,{width}))}
  </div>

  <div  class='card' style="font-size: 1.1em;">
    ${resize((width) => count_distinct_planets_table(historydata,1,{width}))}
  </div>

  <div class='card' style="font-size: 1.1em;'">
    ${resize((width) => count_distinct_planets_table(historydata,2,{width}))}
  </div>
  
</div>