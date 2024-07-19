---
theme: [dark, dashboard]
toc: false
title: The Great Big Galactic War History Map
---
### The Great Big Galactic War History Map


<style>



#map-container {
  position:relative;
}

#map {
  position: absolute;
  pointer-events: none;
  object-fit:cover;
  width: calc(100% - 2rem)
}

#map img {
}



</style>

```js


  import {
    makeplot,eList
  } from "./components/HistoryLog.js";
  
```

```js


const lasttime = FileAttachment("./data/lasttime.json").json();
const planets = await FileAttachment("./data/planets.json").json();
const planetimages= await FileAttachment("./data/images.json").json();
const backround = FileAttachment("./data/sectors.svg").url();
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


```
```js
function list_planets(planets){
  return planets.map(planet => planet[0]).join(', ');
}
  let daylog = Object.fromEntries(historydata.events.map((v, i) => [v['day'], i]));
  let daysreversed = Object.fromEntries(Object.entries(daylog).map(([key, value]) => [value, key]));

// Event Slider
const eventSlider = Inputs.range([0, historydata.events.length - 1], { step: 1, label: "Event Slider", value: 0 });

// Days Slider
const daysSlider = Inputs.range([1, historydata.lastday], { step: 1, label: "Days Slider", value: 1 });


let mutableEventIndex = Mutable(1);

let count = Mutable(1);
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
  const eventIndex = historydata.days[day];
  if (eventIndex !== -1) {
    count.value=eventIndex;
  }
  };
//let mutableDayValue = Mutable(historydata.events[0].day);
// Synchronize counts
eventSlider.addEventListener("input", () => {
  mutableEventIndex.value = eventSlider.value;
  daysSlider.value=historydata.events[eventSlider.value].day;
  //mutableDayValue.value = historydata.events[eventSlider.value].day;
});

  daysSlider.addEventListener("input", () => {
    const eventIndex = historydata.events.findIndex(event => event.day.toString() === daysSlider.value.toString());
    if (eventIndex !== -1) {
      console.log(eventIndex)
      mutableEventIndex.value = eventIndex;
      eventSlider.value=eventIndex;
    }
    set_day(daysSlider.value);  // Trigger the set_day function with daysSlider.value
  });


const theseinputs=Inputs.button([["Last Event", backevent],["Next Event", addevent]])

// Define Generators
const showImages = view(Inputs.toggle({label: "Show Images", value: true}));

```


```js
//const showWaypoints = view(Inputs.toggle({label:"Show routes", value:false}))
const waypoints = planets.flatMap(x => x.waypoints.map(y => ({from:x.position, to:planets[y].position})));
console.log(waypoints);
```

<div class="grid grid-cols-4" style="grid-auto-rows: auto;">
  <div  class="card grid-colspan-2 grid-rowspan-2">
  ${theseinputs}
  ${daysSlider}
    ${resize((width) => makeplot(historydata,planetimages,backround,count,{width, showImages}))}
  </div>

  <div class='card big grid-colspan-2' style="font-size: 1.1em;">
    <h1>Day ${historydata.events[count].day}, Event Index ${count}</h1>
    <strong>${historydata.events[count].text}</strong><br>
    <p> <strong>Time:</strong> ${historydata.events[count].time} UTC </p>
    <p><strong>Current Major Order:</strong> ${historydata.events[count].mo} </p>
      <p><strong>Type:</strong> ${historydata.events[count].type}, </p>
      <p><strong>Planets:</strong> ${list_planets(historydata.events[count].planet)} </p>
    <strong>Timestamp:</strong> ${historydata.events[count].timestamp};
    
  </div>
  <div id="Days" class='card big grid-colspan-2' style="font-size: 1.1em;">
  <div id="DAYVIEW"></div>
  ${eList(historydata,count,document.getElementById("DAYVIEW"))}
   </div>
</div>

Data aquired thanks to Herald/Cobfish's excelllent [Galactic Archive Log](https://docs.google.com/document/d/1lvlNVU5aNPcUtPpxAsFS93P2xOJTAt-4HfKQH-IxRaA) and Kejax's [War History Api](https://github.com/helldivers-2/War-History-API), this would not be possible without either of them.
