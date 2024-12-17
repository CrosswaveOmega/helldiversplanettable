---
theme: [dark, dashboard]
toc: false
title: The Great Big Galactic War History Map
---
### The Great Big Galactic War History Map



```js


  import {
     makeplotcurrent_group
  } from "./components/sectormapper.js";
    import {get_update_time_local, get_update_time_utc}from "./components/time_utils.js";
    
import  {getNeighbors}  from "./components/sector_neighbors.js";
```

```js


const lasttime = FileAttachment("./data/lasttime.json").json();
const planets = await FileAttachment("./data/planets.json").json();
const planetimages= await FileAttachment("./data/fullimages.json").json();
const gstates = FileAttachment("./data/gstates.json").json();
const backround = FileAttachment("./data/sectors.svg").url();
const world = FileAttachment("./data/outputgeo.geojson").json();
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
function saveAsDownloadableFile() {
  const myCardDiv = document.getElementById("MYCARD");
  if (!myCardDiv) return;

  const svgElements = myCardDiv.getElementsByTagName('svg');
  if (svgElements.length === 0) return;

  const svgData = {};

  Array.from(svgElements).forEach((svgElement, index) => {
    let svg = svgElement.outerHTML;

    console.log(svg);
    let mylabel = svgElement.getAttribute('aria-label') // Get aria-label element from svg
    if (mylabel==='lestrade'){
      mylabel="l'estrade";
    }
    if (mylabel==='jinxi'){
      mylabel="jin_Xi";
    }
    if (mylabel==='xitauri'){
      mylabel="xi_Tauri";
    }

    if (!svg.includes('xml:space=')) {
      svg = svg.replace('<svg', '<svg xml:space="preserve"');
    }
    if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!svg.includes('xmlns:svg=')) {
      svg = svg.replace('<svg', '<svg xmlns:svg="http://www.w3.org/2000/svg"');
    }
    

    svgData[mylabel] = svg;
  });

  const blob = new Blob([JSON.stringify(svgData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "MYCARD_data.json";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const getfileevent = () => {
  saveAsDownloadableFile();
};

const GetMapSvgButton = Inputs.button([["Download SVG of Map", getfileevent]]);
const mywidth=4000
```

${GetMapSvgButton}
<div id="MYCARD", style="width:4000px">
  ${makeplotcurrent_group(historydata,gstates,planetimages,targets,world,getNeighbors,{mywidth, showImages,htarget,ttarget,atarget})}
</div>

<canvas id="hiddenCanvas" style="display: none;"></canvas>



### Notes:
* The default decay rate for Super Earth planets is **500% per hour**, but only if the planet is not under attack from an enemy faction.  





###
Data aquired thanks to Herald/Cobfish's excelllent [Galactic Archive Log](https://docs.google.com/document/d/1lvlNVU5aNPcUtPpxAsFS93P2xOJTAt-4HfKQH-IxRaA) and Kejax's [War History Api](https://github.com/helldivers-2/War-History-API), this would not be possible without either of them.

```js
// Plot.geo(world).plot({projection: {type: "identity", domain: world}})
```