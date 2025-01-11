---
theme: [dark, dashboard]
toc: false
title: The Great Big Galactic War History Map
---
### The Great Big Galactic War History Map



```js


  import {
    makeplotcurrent, eList, count_distinct_planets,list_text
  } from "./components/HistoryLog.js";
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

  let svg = svgElements[0].outerHTML;

  if(!svg.includes('xml:space=')){
    svg = svg.replace('<svg', '<svg xml:space="preserve"');
  }
  if(!svg.includes('xmlns="http://www.w3.org/2000/svg"')){
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if(!svg.includes('xmlns:svg=')){
    svg = svg.replace('<svg', '<svg xmlns:svg="http://www.w3.org/2000/svg"');
  }

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "MYCARD.svg";
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
  ${makeplotcurrent(historydata,gstates,planetimages,targets,world,getNeighbors,{mywidth, showImages,htarget,ttarget,atarget})}
</div>




### Notes:
* The default decay rate for Super Earth planets is **500% per hour**, but only if the planet is not under attack from an enemy faction.  





###
Data aquired thanks to Herald/Cobfish's excelllent [Galactic Archive Log](https://docs.google.com/document/d/1lvlNVU5aNPcUtPpxAsFS93P2xOJTAt-4HfKQH-IxRaA) and Kejax's [War History Api](https://github.com/helldivers-2/War-History-API), this would not be possible without either of them.

```js
function createCircleFeature(center, radius, numPoints = 64) {
    const [cx, cy] = center;
    const coordinates = [];
    
    for (let i = 0; i <= numPoints; i++) {
        const angle = (2 * Math.PI * i) / numPoints;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        coordinates.push([x, y]);
    }
    
    return {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [coordinates], // GeoJSON expects a nested array for polygons
        },
        properties: {
            id: "sol",
            name: "sol-sector",
            class: "sol-system sector-path",
        },
    };
}


// Plot.geo(world).plot({projection: {type: "identity", domain: world}})
```