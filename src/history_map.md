---
theme: [dark, dashboard]
toc: false
title: The Great Big Galactic War History Map
---
### The Great Big Galactic War History Map



```js

  import {
    makeplot,eList, count_distinct_planets,list_text,decompressJSON
  } from "./components/HistoryLog.js";
    import {get_update_time_local, get_update_time_utc}from "./components/time_utils.js";
```

```js
async function get_gstates(){
  let parta=await FileAttachment("./data/gstates.json").arrayBuffer();
  let partb=await decompressJSON(parta);
  return partb;
}

const gstates = await get_gstates()


const lasttime = FileAttachment("./data/lasttime.json").json();
const planets = await FileAttachment("./data/planets.json").json();
const planetimages= await FileAttachment("./data/images.json").json();
const icons= await FileAttachment("./data/icons.json").json();

const historydata= await FileAttachment("./data/historydata.json").json();
const backround = FileAttachment("./data/sectors.svg").url();
const world = FileAttachment("./data/outputgeo.geojson").json();
const htarget = FileAttachment("./data/libtargets/hTarget.svg").url();
const ttarget = FileAttachment("./data/libtargets/tTarget.svg").url();
const atarget = FileAttachment("./data/libtargets/aTarget.svg").url();
const itarget = FileAttachment("./data/libtargets/iTarget.svg").url();
const dss = FileAttachment("./data/dss.png").url();

planets.forEach((planet) => {
  const key = Object.keys(planetimages).find(k => k === planet.image);
  if (key) {
    planet.image = planetimages[key].base64_image;
  }
});

```
```js
import { format } from "d3-format";

import { inputs } from "@observablehq/inputs";

const update_time = "This table was last updated on " + get_update_time_local(lasttime['update_time']);

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
    4: itarget,
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
    daysSlider.value=historydata.events[count.value].day;
  }
};
const backevent = () => {
  if (count.value > 0) {
    --count.value;
    daysSlider.value=historydata.events[count.value].day;
  }
};

const set_day = (day) => {  
  //console.log("Getting day");
  const eventIndex = historydata.days[day];
  if (eventIndex !== -1) {
    count.value=eventIndex;
  }
  };
//let mutableDayValue = Mutable(historydata.events[0].day);
// Synchronize counts

daysSlider.addEventListener("input", () => {
    const eventIndex = historydata.events.findIndex(event => event.day.toString() === daysSlider.value.toString());
    if (eventIndex !== -1) {
      //console.log(eventIndex);
      mutableEventIndex.value = eventIndex;
      //eventSlider.value=eventIndex;
    }
    set_day(daysSlider.value);  // Trigger the set_day function with daysSlider.value
  });


const theseinputs=Inputs.button([["Last Event", backevent],["Next Event", addevent]])

// Define Generators
const showImages = view(Inputs.toggle({label: "Show Images", value: true}));

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
 ${theseinputs}
  ${daysSlider}
    ${resize((width) => makeplot(historydata,gstates,planetimages,targets,count,world,{width, showImages,htarget,ttarget,atarget,dss,icons}))}
  </div>
  
  <div class='card big grid-colspan-2' style="font-size: 1.1em;">
    <div id="Superdayview"></div>
     
  </div>
  <div id="Days" class='card big grid-colspan-2'>
    <div id="DAYVIEW"></div>
     </div>



</div>



### Notes:
* The default decay rate for Super Earth planets is **500% per hour**, but only if the planet is not under attack from an enemy faction.  





###
Data aquired thanks to Herald/Cobfish's excelllent [Galactic Archive Log](https://docs.google.com/document/d/1lvlNVU5aNPcUtPpxAsFS93P2xOJTAt-4HfKQH-IxRaA) and Kejax's [War History Api](https://github.com/helldivers-2/War-History-API), this would not be possible without either of them.

```js
// Plot.geo(world).plot({projection: {type: "identity", domain: world}})
```