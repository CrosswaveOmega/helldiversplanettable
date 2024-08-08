---
theme: [dark, dashboard]
toc: false
title: The Great Big Galactic War History Map
---
### The Great Big Galactic War History Map



```js


  import {
    makeplot,eList, count_distinct_planets,list_text
  } from "./components/HistoryLog.js";
  
```

```js


const lasttime = FileAttachment("./data/lasttime.json").json();
const planets = await FileAttachment("./data/planets.json").json();
const planetimages= await FileAttachment("./data/images.json").json();
const backround = FileAttachment("./data/sectors.svg").url();
const htarget = FileAttachment("./data/libtargets/hTarget.svg").url();
const ttarget = FileAttachment("./data/libtargets/tTarget.svg").url();
const atarget = FileAttachment("./data/libtargets/aTarget.svg").url();

planets.forEach((planet) => {
  const key = Object.keys(planetimages).find(k => k === planet.image);
  if (key) {
    planet.image = planetimages[key].base64_image;
  }
});
const historydata= await FileAttachment("./data/historydata.json").json();
```
```js
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { inputs } from "@observablehq/inputs";

const timestamp = new Date();
const formattedTimestamp = timeFormat("%Y-%m-%d %H:%M:%S %Z")(timestamp);
const update_time = "This map was last updated on " + lasttime['update_time'];

for (const event of historydata.events){
  // You can process each event here
  let text = "";
  for (const entry of event.log){
    let planet = "";
    if (entry.planet && entry.planet.length > 0) {
      planet = entry.planet.map(p => p[0]).join(", ");
      planet = ", on " + planet;
    }
    text += entry.text + " (type " + entry.type + planet + ")<br/>\n";
  }
  event.text = '';
}


```
```js
function getTarget(owner) {
  
  return targets[owner];
}
const targets = {
    1: htarget,
    2: ttarget,
    3: atarget,
  };
function list_planets(planets){
  return planets.map(planet => planet[0]).join(', ');
}
  let daylog = Object.fromEntries(historydata.events.map((v, i) => [v['day'], i]));
  let daysreversed = Object.fromEntries(Object.entries(daylog).map(([key, value]) => [value, key]));

// Event Slider
const eventSlider = Inputs.range([0, historydata.events.length - 1], { step: 1, label: "Event Slider", value: 0 });

// Days Slider
const daysSlider = Inputs.range([1, historydata.lastday], { step: 1, label: "Days Slider", value: 1, width:'100%' });


let mutableEventIndex = Mutable(1);

let count = Mutable(0);
const addevent = () => {
  if (count.value < historydata.events.length - 1) {
    ++count.value;
    //daysSlider.value=historydata.events[count.value].day;
  }
};
const backevent = () => {
  if (count.value > 0) {
    --count.value;
    //daysSlider.value=historydata.events[count.value].day;
  }
};

const set_day = (day) => {  
  const eventIndex = historydata.days[day];
  if (eventIndex !== -1) {
    count.value=eventIndex;
  }
  };
//let mutableDayValue = Mutable(historydata.events[0].day);
// Synchronize counts
eventSlider.addEventListener("input", () => {
  count.value = eventSlider.value;
  //daysSlider.value=historydata.events[eventSlider.value].day;
  //mutableDayValue.value = historydata.events[eventSlider.value].day;
});
/*
  daysSlider.addEventListener("input", () => {
    const eventIndex = historydata.events.findIndex(event => event.day.toString() === daysSlider.value.toString());
    if (eventIndex !== -1) {
      console.log(eventIndex)
      mutableEventIndex.value = eventIndex;
      //eventSlider.value=eventIndex;
    }
    set_day(daysSlider.value);  // Trigger the set_day function with daysSlider.value
  });
*/

const theseinputs=Inputs.button([["Last Event", backevent],["Next Event", addevent]])

// Define Generators
const showImages = view(Inputs.toggle({label: "Show Images", value: true}));
const cv=Generators.input(eventSlider);
```


```js

function count_distinct_planets_table(historydata, mode, {width}) {
  const countDistinctPlanetsData = count_distinct_planets(historydata,planets);
  let planet_data = Object.values(countDistinctPlanetsData);

  let columns = [];
  let header = {};

  if (mode === 0) {
    columns = ['name', 'front', 'campaigns', 'lib_campaigns','defenses', 'planet_flips'];
    header = {
      name: 'Name',
      front: 'Front',
      campaigns: "Campaigns",
      lib_campaigns: "Liberations",
       defenses: "Defenses",
      planet_flips: "Planet Flips"
    };
  } else if (mode === 1) {
    columns = ['name', 'campaigns','lib_campaigns', 'libwins', 'liblost'];
    header = {
      name: 'Name',
      
      campaigns: "Campaigns",
      lib_campaigns: "Liberation Campaigns",
      libwins: "Liberations Won",
      liblost: "Liberations Lost"
    };
  } else if (mode === 2) {
    columns = ['name','campaigns', 'defenses', 'defenses_won', 'defenses_lost'];
    header = {
      name: 'Name',
      
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

```

<div class="grid grid-cols-4" style="grid-auto-rows: auto;">
  <div  class="card grid-colspan-2 grid-rowspan-2">

  ${eventSlider}
  <strong>${historydata.events[count].time}</strong><br>
    ${resize((width) => makeplot(historydata,planetimages,backround,targets,cv,{width, showImages,htarget,ttarget,atarget}))}
  </div>

  <div class='card big grid-colspan-2' style="font-size: 1.1em;">
    <h1>Day ${historydata.events[cv].day}, Event Index ${cv}</h1>
    <div id="EventView"></div>
    <p>${list_text(historydata,cv,document.getElementById("EventView"))}</p>
    <p> <strong>Time:</strong> ${historydata.events[cv].time} UTC </p>
    <p><strong>Current Major Order:</strong> ${historydata.events[cv].mo} </p>
    <strong>Timestamp:${historydata.events[cv].timestamp};</strong> 

  </div>
  <div id="Days" class='card big grid-colspan-2'>
  <div id="DAYVIEW"></div>
  ${eList(historydata,cv,document.getElementById("DAYVIEW"))}
   </div>

  <div class='card grid-colspan-2' style="font-size: 1.1em;">
    ${resize((width) => count_distinct_planets_table(historydata,0,{width}))}
  </div>

  <div  class='card grid-colspan-2' style="font-size: 1.1em;">
    ${resize((width) => count_distinct_planets_table(historydata,1,{width}))}
  </div>

  <div class='card grid-colspan-2' style="font-size: 1.1em;'">
    ${resize((width) => count_distinct_planets_table(historydata,2,{width}))}
  </div>
</div>

Data aquired thanks to Herald/Cobfish's excelllent [Galactic Archive Log](https://docs.google.com/document/d/1lvlNVU5aNPcUtPpxAsFS93P2xOJTAt-4HfKQH-IxRaA) and Kejax's [War History Api](https://github.com/helldivers-2/War-History-API), this would not be possible without either of them.
