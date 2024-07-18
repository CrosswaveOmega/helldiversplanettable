---
theme: [dark, dashboard]
toc: false
title: Galactic War Map
---
### Galactic War Map


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
    makeplot,
  } from "./components/piechart.js";
  
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
//const showWaypoints = view(Inputs.toggle({label:"Show routes", value:false}))
const waypoints = planets.flatMap(x => x.waypoints.map(y => ({from:x.position, to:planets[y].position})));
console.log(waypoints);
```

<div class="grid grid-cols-4" style="grid-auto-rows: auto;">
  <div id="map-container" class="card grid-colspan-2 grid-rowspan-2">
    ${resize((width) => makeplot(planets,waypoints,backround,{width}))}</div>

  <div class='card  grid-colspan-2'>
    <p>The current galactic war map. ${update_time}.</p>
    <p>Each planet is a randomly generates sphere image.</p>
  </div>
</div>

