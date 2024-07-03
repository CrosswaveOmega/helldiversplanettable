---
theme: dashboard
title: Biome Data.
toc: false
---

# Helldivers Data Table - Biome Data
<style>
  
@import url('https://fonts.googleapis.com/css2?family=Goldman&display=swap');

@import url('https://fonts.googleapis.com/css2?family=Rationale&display=swap');
body{ 
  font-family: 'Goldman' !important;
}
.card, .big {
  font-family: 'Goldman' !important;
}
figure > h2, figure > h3{
  font-family: 'Goldman' !important;
}
[class*="inputs"] {
  font-family: 'Rationale' !important;
}
[class*="plot"] {
  font-family: 'Goldman' !important;
}
</style>
<!-- Load and transform the data -->

```js

import {
    bugKills,
    botKills,
    allKills,
    allDeaths,
    kdRatio,
    missionsWon,
    missionsLost,
    missionsWonAndLost,BiomeData, BiomeStats,
    make_biome_data,
  } from "./components/dataplots.js";

  
import {
    pieChart
  } from "./components/piechart.js";
const planets = FileAttachment("./data/planets.json").json();

let biome_data = await planets.then(data => make_biome_data(data));


```


```js

const biocolors = Plot.scale({
  color: {
    type: "categorical",
    domain: d3.groupSort(planets, (D) => -D.length, (d) => d.biome).filter((d) => d !== "Other"),
    unknown: "var(--theme-foreground-muted)"
  }
});
const factcolor = Plot.scale({
  color: {
    type: "categorical",
    domain: ["TERMINIDS", "AUTOMATON", "HUMANS","TERMINIDSL", "AUTOMATONL", "HUMANSL"],  // specify known categories directly
    unknown: "purple",  // specify the color for unknown categories
    range: ["orange", "red", "blue","darkorange", "darkred", "darkblue"],  // colors for TERMINIDS, AUTOMATON, and HUMANS
  }
});
```



<!-- Plot of launch history -->



```js 
const parentElement = document.getElementById('HERE')
BiomeData(planets, parentElement)
```
<div class="grid grid-cols-4", id="HERE">

</div>





<div class="grid grid-cols-3">
<div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],0, {width, biocolors, title:'Biome wins and losses.'}))}
  </div>
  <div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],1, {width, biocolors, title:'Biome kills.'}))}
  </div>
  <div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],2, {width, biocolors,  title:'Biome lethality.'}))}
  </div>
  

</div>

<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],3, {width, biocolors, title:'Average Helldiver statistics per biome'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],4, {width, biocolors, title:'Average Helldiver statistics per biome'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],5, {width, biocolors, title:'Average Helldiver statistics per biome'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['all'],6, {width, biocolors, title:'Average Helldiver statistics per biome'}))}
  </div>

</div>




<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(biome_data['TERMINIDS'],3, {width, biocolors, title:'Average Helldiver statistics per TERMINID biome'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['TERMINIDS'],4, {width, biocolors, title:'Average Helldiver statistics per TERMINID biome'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['TERMINIDS'],5, {width, biocolors, title:'Average Helldiver statistics per TERMINID biome'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['TERMINIDS'],6, {width, biocolors, title:'Average Helldiver statistics per TERMINID biome'}))}
  </div>

</div>




<div class="grid grid-cols-4">
  <div class="card">
    ${resize((width) => BiomeStats(biome_data['AUTOMATON'],3, {width, biocolors, title:'Average Helldiver statistics per AUTOMATON biome'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['AUTOMATON'],4, {width, biocolors, title:'Average Helldiver statistics per AUTOMATON biome'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['AUTOMATON'],5, {width, biocolors, title:'Average Helldiver statistics per AUTOMATON biome'}))}
  </div>
    <div class="card">
    ${resize((width) => BiomeStats(biome_data['AUTOMATON'],6, {width, biocolors, title:'Average Helldiver statistics per AUTOMATON biome'}))}
  </div>

</div>
