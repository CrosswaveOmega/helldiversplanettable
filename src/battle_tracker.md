---
title: Battle Tracker History Log
toc: True
sidebar: true
---
# The Battle Tracker



```js
  import {
    ListAll, count_distinct_planets
  } from "./components/HistoryLog.js";
  import {
    make_sector_data,
  } from "./components/data_transformers.js";
  
```

```js


const lasttime = FileAttachment("./data/lasttime.json").json();
const planets = FileAttachment("./data/planets.json").json();

let sector_data = await planets.then(data => make_sector_data(data));
const planetimages= await FileAttachment("./data/images.json").json();
const backround = FileAttachment("./data/sectors.svg").url();

const historydata= await FileAttachment("./data/historydata.json").json();
```
```js
function add_to_entry(acc, planet, value, time) {
  if (!acc[planet[1]]) {
    acc[planet[1]] = { 'name': planet[0], 'index': planet[1], 'events': [] };
  }
  acc[planet[1]]['events'].push({ 'time': time, 'event': value })
}

function displayUTCTime(timestamp) {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toISOString().replace('T', ' ').slice(0, 16);
}

function calculateElapsedTime(timestamp1, timestamp2) {
  const time1 = new Date(parseInt(timestamp1) * 1000);
  const time2 = new Date(parseInt(timestamp2) * 1000);
  const elapsed = Math.abs(time2 - time1);

  const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
  const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

  if (days === 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${days}d ${hours}h ${minutes}m`;
}

function count_distinct_planet_battles(history, showEvts) {
  const planetTypes = {};
  const battles = {};
  for (let event of history.events) {
    for (let logEntry of event.log) {
      if (logEntry.planet) {
        for (let planet of logEntry.planet) {
          let pid = planet[1];
          if (!battles[pid]) {
            battles[pid] = { 'start': null, 'pc': 0, 'lc': 0, 'dc': 0 };
          }
          let sector = 'unknown';
          if (history.galaxystatic[pid.toString()]) {
            sector = history.galaxystatic[pid.toString()].sector;
          }
          if (!planetTypes[sector]) {
            planetTypes[sector] = { 
              'name': sector, 
              'front': 'ALL', 
              'planets': {}, 
              'battles': 0, 
              'win': 0, 
              'loss': 0,
              'current':0,
              'cstart': 0,
              'cend': 0,
              'flips':0,
              'planetwon': 0,
              'defensestart': 0,
              'defensewon': 0,
              'defenselost': 0
            };
            let tofind = sector_data['all'].find(el => el.sector_name === sector.toUpperCase());
            if (tofind) {
              planetTypes[sector].front = tofind.sector_front;
            }
          }
          if (showEvts) {
            add_to_entry(planetTypes[sector].planets, planet, logEntry.text, event.time);
          }
          if (logEntry.type === "cend") {
            let battle = `Battle ${battles[pid].pc} for ${planet[0]}, ${displayUTCTime(battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(battles[pid].start, event.timestamp)}, failure)`;
            add_to_entry(planetTypes[sector].planets, planet, battle, null);
            planetTypes[sector].loss += 1;
            planetTypes[sector].cend += 1;
            planetTypes[sector].current -=1;
          }
          if (logEntry.type === 'cstart') {
            battles[pid].pc += 1;
            battles[pid].lc += 1;
            battles[pid].start = event.timestamp;
            planetTypes[sector].battles += 1;
            planetTypes[sector].current +=1;
            planetTypes[sector].cstart += 1;
          }
          if (logEntry.type === "defense start") {
            battles[pid].pc += 1;
            battles[pid].dc += 1;
            battles[pid].start = event.timestamp;
            planetTypes[sector].battles += 1;
            planetTypes[sector].defensestart += 1;
            planetTypes[sector].current +=1;
          }
          if (logEntry.type === "planet won" || logEntry.type === "planet superwon") {
            let battle = `Battle ${battles[pid].pc} for ${planet[0]}, ${displayUTCTime(battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(battles[pid].start, event.timestamp)}, victory)`;
            add_to_entry(planetTypes[sector].planets, planet, battle, null);
            planetTypes[sector].win += 1;
            planetTypes[sector].planetwon += 1;
            planetTypes[sector].current -=1;
          }
          if (logEntry.type === "planet flip") {
            planetTypes[sector].flips +=1;
          }


          if (logEntry.type === "defense won") {
            let battle = `Battle ${battles[pid].pc} for ${planet[0]}, ${displayUTCTime(battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(battles[pid].start, event.timestamp)}, victory)`;
            add_to_entry(planetTypes[sector].planets, planet, battle, null);
            planetTypes[sector].win += 1;
            planetTypes[sector].defensewon += 1;
            planetTypes[sector].current -=1;
          }
          if (logEntry.type === "defense lost") {
            let battle = `Battle ${battles[pid].pc} for ${planet[0]}, ${displayUTCTime(battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(battles[pid].start, event.timestamp)}, failure)`;
            add_to_entry(planetTypes[sector].planets, planet, battle, null);
            planetTypes[sector].loss += 1;
            planetTypes[sector].defenselost += 1;
            planetTypes[sector].current -=1;
          }
        }
      }
    }
  }

  return planetTypes;
}



function sector_battle_table(historydata, mode, {width}) {
  const countDistinctPlanetsData = count_distinct_planet_battles(historydata,false);
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
  const frontSums = {};
  
  const planetTypes = count_distinct_planet_battles(historydata,false);
  for (const sector in planetTypes) {
    const { front, battles, win, loss, current, cstart, cend, flips, planetwon, defensestart, defensewon, defenselost } = planetTypes[sector];

    if (!frontSums[front]) {
      frontSums[front] = {
        front: front,
        battles: 0,
        win: 0,
        loss: 0,
        current: 0,
        cstart: 0,
        cend: 0,
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
    frontSums[front].cstart += cstart;
    frontSums[front].cend += cend;
    frontSums[front].flips += flips;
    frontSums[front].planetwon += planetwon;
    frontSums[front].defensestart += defensestart;
    frontSums[front].defensewon += defensewon;
    frontSums[front].defenselost += defenselost;
  }

  return frontSums;
}


function count_distinct_planets_table(historydata, mode, {width}) {
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

function BattleList(history, showEvt,parentCard) {

  function createCard(sector, index, current, parentCard) {
    let planets = Object.values(sector.planets);
    if (planets.length <= 0) {
      return parentCard;
    }
    
    const sectorList = document.createElement("ul");
    const sectorItem = document.createElement("li");
    const sectorHeader = document.createElement("h2");
    sectorHeader.textContent = `${sector.name}`;
   parentCard.appendChild(sectorHeader);
    
    const planetList = document.createElement("ul");
    for (const entry of planets) {
      const planetItem = document.createElement("li");
      const planetHeader = document.createElement("h3");
      planetHeader.textContent = `${entry.name}`;
      planetItem.appendChild(planetHeader);
      
      const eventList = document.createElement("ul");
      for (const each of entry.events) {
        const eventItem = document.createElement("li");
        let eventText = `${each.event}`;
        if (each.time) {
          eventText += ` (${each.time} UTC)`;
        }
        eventItem.textContent = eventText;
        eventList.appendChild(eventItem);
      }
      
      planetItem.appendChild(eventList);
      planetList.appendChild(planetItem);
    }
    
    parentCard.appendChild(planetList);

    return parentCard;
  }

  // Function to create the grid element
  let distinct_elements = count_distinct_planet_battles(history,showEvt);

  function createGrid(planetdata, parentElement) {
    // Find and clear the 'cont' div
    while (parentElement.firstChild) {
      parentElement.removeChild(parentElement.firstChild);
    }
    
    let data = Object.values(planetdata);
    // Add new elements into the 'cont' div
    for (let index = 0; index < data.length; index++) {
      let sector = data[index];
      let current = index === 0;
      const card = createCard(sector, index, current, parentElement);
    }
  }

  // Generate the grid with cards
  createGrid(distinct_elements, parentCard);
  return [];
}
const showEvents = view(Inputs.toggle({label: "Show Events", value: false}));


const entry_sums=sum_entries_by_front(historydata);
```
  
<div class="grid grid-cols-1">
<div class="card big grid-colspan-2" >
${BattleList(historydata,showEvents,document.getElementById("history"))}
  <div id="history" style="max-height: 500px; overflow-y: auto;">

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
    <span >Total: ${entry_sums['TERMINIDS'].cstart}</span><br/>
      <span >Won: ${entry_sums['TERMINIDS'].planetwon}</span><br/>
      <span >Lost: ${entry_sums['TERMINIDS'].cend}</span><br/>
      <span >Win%: ${(100*entry_sums['TERMINIDS'].planetwon/(entry_sums['TERMINIDS'].cend+entry_sums['TERMINIDS'].planetwon)).toFixed(2)}</span><br/>
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
    <span >Total: ${entry_sums['AUTOMATON'].cstart}</span><br/>
      <span >Won: ${entry_sums['AUTOMATON'].planetwon}</span><br/>
      <span >Lost: ${entry_sums['AUTOMATON'].cend}</span><br/>
      <span >Win%: ${(100*entry_sums['AUTOMATON'].planetwon/(entry_sums['AUTOMATON'].cend+entry_sums['AUTOMATON'].planetwon)).toFixed(2)}</span><br/>
  </div>
      <div  class='card' style="font-size: 1.1em;">
    <h2>Automaton Front Defence Campaigns</h2>
    <span >Total: ${entry_sums['AUTOMATON'].defensestart}</span><br/>
      <span >Won: ${entry_sums['AUTOMATON'].defensewon}</span><br/>
      <span >Lost: ${entry_sums['AUTOMATON'].defenselost}</span><br/>
      <span >Win%: ${(100*entry_sums['AUTOMATON'].defensewon/(entry_sums['AUTOMATON'].defensewon+entry_sums['AUTOMATON'].defenselost)).toFixed(2)}</span><br/>
  </div>

</div>
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