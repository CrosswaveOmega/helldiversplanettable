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

  const planetTypes = count_distinct_planet_battles(historydata,false,sector_data).planetTypes;
  for (const sector in planetTypes) {
    const { front, battles, win, loss, current, campaign_start, campaign_end, flips, planetwon, defensestart, defensewon, defenselost } = planetTypes[sector];

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

function formatBattleData() {
    
    const planetTypes = count_distinct_planet_battles(historydata,false,sector_data).planetTypes;
    
    let data = Object.values(planetData);
    let planets_list={};
    for (const sector of data){
        console.log(sector.planets);
        let planets = Object.values(sector.planets);
        if (planets.length !== 0) {
            for (const planet of planets){
                console.log(planet);
                planets_list[planet.index]=planet;
            }
        }
    }

    const jsonString = JSON.stringify(planets_list, null, 2);

    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create an anchor element and set attributes for download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'battle_tracker_data.json';

    // Append the anchor to the body
    document.body.appendChild(a);

    // Programmatically click the anchor to trigger the download
    a.click();

    // Remove the anchor from the document
    document.body.removeChild(a);

    // Revoke the object URL to free resources
    URL.revokeObjectURL(url);
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
const getfileevent = () => {
  formatBattleData();
};
const GetBattleJSONButton = Inputs.button([["Download JSON file with current battle log.", getfileevent]]);




```

${GetBattleJSONButton}
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
<div class="grid grid-cols-3">
    <div  class='card' style="font-size: 1.1em;">
    <h2>Terminid Front Campaigns</h2>
    <span >Total: ${entry_sums['TERMINIDS'].battles}</span><br/>
      <span >Won: ${entry_sums['TERMINIDS'].win}</span><br/>
      <span >Lost: ${entry_sums['TERMINIDS'].loss}</span><br/>
      <span >Ongoing: ${entry_sums['TERMINIDS'].current}</span><br/>
      <span >PlanetFlips: ${entry_sums['TERMINIDS'].flips}</span><br/>
  </div>
    <div  class='card' style="font-size: 1.1em;">
    <h2>Terminid Front Liberation Campaigns</h2>
    <span >Total: ${entry_sums['TERMINIDS'].campaign_start}</span><br/>
      <span >Won: ${entry_sums['TERMINIDS'].planetwon}</span><br/>
      <span >Lost: ${entry_sums['TERMINIDS'].campaign_end}</span><br/>
      <span >Win%: ${(100*entry_sums['TERMINIDS'].planetwon/(entry_sums['TERMINIDS'].campaign_end+entry_sums['TERMINIDS'].planetwon)).toFixed(2)}</span><br/>
  </div>

  <div  class='card' style="font-size: 1.1em;">
    <h2>Terminid Front Defence Campaigns</h2>
    <span >Total: ${entry_sums['TERMINIDS'].defensestart}</span><br/>
      <span >Won: ${entry_sums['TERMINIDS'].defensewon}</span><br/>
      <span >Lost: ${entry_sums['TERMINIDS'].defenselost}</span><br/>
      <span >Win%: ${(100*entry_sums['TERMINIDS'].defensewon/(entry_sums['TERMINIDS'].defensewon+entry_sums['TERMINIDS'].defenselost)).toFixed(2)}</span><br/>
  </div>

  <div class='card' style="font-size: 1.1em;">
    <h2>Automaton Front Campaigns</h2>
    <span >Total:${entry_sums['AUTOMATON'].battles}</span><br/>
      <span >Won: ${entry_sums['AUTOMATON'].win}</span><br/>
      <span >Lost: ${entry_sums['AUTOMATON'].loss}</span><br/>
      <span >Ongoing: ${entry_sums['AUTOMATON'].current}</span><br/>
      <span >PlanetFlips: ${entry_sums['AUTOMATON'].flips}</span><br/>
  </div>
    <div  class='card' style="font-size: 1.1em;">
    <h2>Automaton Front Liberation Campaigns</h2>
    <span >Total: ${entry_sums['AUTOMATON'].campaign_start}</span><br/>
      <span >Won: ${entry_sums['AUTOMATON'].planetwon}</span><br/>
      <span >Lost: ${entry_sums['AUTOMATON'].campaign_end}</span><br/>
      <span >Win%: ${(100*entry_sums['AUTOMATON'].planetwon/(entry_sums['AUTOMATON'].campaign_end+entry_sums['AUTOMATON'].planetwon)).toFixed(2)}</span><br/>
  </div>
      <div  class='card' style="font-size: 1.1em;">
    <h2>Automaton Front Defence Campaigns</h2>
    <span >Total: ${entry_sums['AUTOMATON'].defensestart}</span><br/>
      <span >Won: ${entry_sums['AUTOMATON'].defensewon}</span><br/>
      <span >Lost: ${entry_sums['AUTOMATON'].defenselost}</span><br/>
      <span >Win%: ${(100*entry_sums['AUTOMATON'].defensewon/(entry_sums['AUTOMATON'].defensewon+entry_sums['AUTOMATON'].defenselost)).toFixed(2)}</span><br/>
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