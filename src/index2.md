---
theme: dashboard
title: Helldivers 2 Planet Charts
toc: false
sidebar: true
---


# Helldivers Data Table
### Planet Charts
<style>
  
@import url('https://fonts.googleapis.com/css2?family=Goldman&display=swap');

@import url('https://fonts.googleapis.com/css2?family=Rationale&display=swap');
body{ 
  font-family: 'Goldman' !important;
}
.card, .big {
  font-family: 'Goldman' !important;
}
[class*="inputs"] {
  font-family: 'Rationale' !important;
}
[class*="plot"] {
  font-family: 'Goldman' !important;
}
</style>

```js

import {
    bugKills,
    botKills,
    allKills,
    allDeaths,
    genericGraph,
    kdRatio,
    missionsWon,
    missionsLost,
    missionsWonAndLost
  } from "./components/dataplots.js";
const planets = FileAttachment("./data/planets.json").json();
const lasttime = FileAttachment("./data/lasttime.json").json();
```
```js
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { inputs } from "@observablehq/inputs";

const timestamp = new Date();
const formattedTimestamp = timeFormat("%Y-%m-%d %H:%M:%S %Z")(timestamp);
const update_time = "This data was last updated on " + lasttime['update_time'];


```

${update_time}

```js

const factcolor = Plot.scale({
  color: {
    type: "categorical",
    domain: ["TERMINIDS", "AUTOMATON", "HUMANS","TERMINIDSL", "AUTOMATONL", "HUMANSL"],  // specify known categories directly
    unknown: "purple",  // specify the color for unknown categories
    range: ["orange", "red", "blue","darkorange", "darkred", "darkblue"],  // colors for TERMINIDS, AUTOMATON, and HUMANS
  }
});




```




```js
const factions=[]
function initializeControl(label) {
  return Inputs.checkbox(planets.map((d)=>d.front), {value:['TERMINIDS','AUTOMATON'],unique:true,label: `Filter by  front`});
}
//const card1FrontFilter = Inputs.checkbox(planets.map((d)=>d.front), {label: `Filter by  front`});
//
function createSortButton(label) {
  return Inputs.button([
    ["Increment", value => {console.log(value); return !value;}]
  ], {value: true, label: `Reverse Sort ${label}`});
}

const card1FrontFilter = initializeControl('Card 1');
const card1FrontGenerator= Generators.input(card1FrontFilter);
const card1Sortv = createSortButton('Card 1');
const card1SortGenerator = Generators.input(card1Sortv);

const card2FrontFilter = initializeControl('Card 2');
const card2FrontGenerator= Generators.input(card2FrontFilter);
const card2Sortv = createSortButton('Card 2');
const card2SortGenerator = Generators.input(card2Sortv);

// Set for Card 3
const card3FrontFilter = initializeControl('Card 3');
const card3FrontGenerator= Generators.input(card3FrontFilter);
const card3Sortv = createSortButton('Card 3');
const card3SortGenerator = Generators.input(card3Sortv);

// Set for Card 4
const card4FrontFilter = initializeControl('Card 4');
const card4FrontGenerator= Generators.input(card4FrontFilter);
const card4Sortv = createSortButton('Card 4');
const card4SortGenerator = Generators.input(card4Sortv);

//const industry = Generators.input(industryInput);
```

<div class="grid grid-cols-2">

  <div class="card">
  ${card1Sortv}
  ${card1FrontFilter}
    ${resize((width) => genericGraph(planets, 'KPM', {width,  factcolor, front_filter:card1FrontGenerator,sortv:card1SortGenerator, title:'Kills per Mission','titleFormat': "kills / mission:[kills]/[missionsTotal] "}))}
  </div>
  <div class="card">
    ${card2Sortv}
  ${card2FrontFilter}
    ${resize((width) => genericGraph(planets, 'DPM', {width, factcolor,   front_filter:card2FrontGenerator,sortv:card2SortGenerator, title:'Deaths per Mission','titleFormat': "deaths / mission:[deaths]/[missionsTotal] "}))}
  </div>
  <div class="card">
    ${card3Sortv}
  ${card3FrontFilter}
    ${resize((width) => genericGraph(planets, 'WTL', {width, factcolor,  front_filter:card3FrontGenerator,sortv:card3SortGenerator,title:'Wins to Losses','titleFormat': "wins / losses:[missionsWon]/[missionsLost] "}))}
  </div>
    <div class="card">
      ${card4Sortv}
  ${card4FrontFilter}
    ${resize((width) => genericGraph(planets, 'KTD', {width, factcolor, front_filter:card4FrontGenerator,sortv:card4SortGenerator,title:'Kills to Deaths','titleFormat': "kills / deaths:[kills]/[deaths] "}))}
  </div>
</div>



<div class="grid grid-cols-2">
  <div class="card">
    ${resize((width) => missionsWon(planets, {width, factcolor}))}
  </div>
      <div class="card">
    ${resize((width) => missionsLost(planets, {width, factcolor}))}
  </div>
    
</div>


<div class="grid grid-cols-1">
<div class="card">
    ${resize((width) => missionsWonAndLost(planets, {width, factcolor}))}
  </div>
  </div>

