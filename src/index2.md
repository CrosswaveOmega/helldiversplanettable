---
theme: dashboard
title: Helldivers 2 Planet Charts
toc: false
sidebar: true
---


# Helldivers Data Table
### Planet Charts

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
import {get_update_time_local, get_update_time_utc} from "./components/time_utils.js";
```
```js
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { inputs } from "@observablehq/inputs";


const update_time = "This table was last updated on " + get_update_time_local(lasttime['update_time']);

```

${update_time}

```js

const factcolor = Plot.scale({
  color: {
    type: "categorical",
    domain: ["TERMINIDS", "AUTOMATON", "ILLUMINATE","HUMANS","TERMINIDSL", "AUTOMATONL", "HUMANSL","ILLUMINATEL"],  // specify known categories directly
    unknown: "purple",  // specify the color for unknown categories
    range: ["orange", "red", "purple", "blue","darkorange", "darkred", "darkblue","darkpurple"],  // colors for TERMINIDS, AUTOMATON, and HUMANS
  }
});




```




```js
const factions=[]
function initializeControl(label) {
  return Inputs.checkbox(planets.map((d)=>d.front), {value:['TERMINIDS','ILLUMINATE','AUTOMATON'],unique:true,label: `Filter by front`});
}
//const card1FrontFilter = Inputs.checkbox(planets.map((d)=>d.front), {label: `Filter by  front`});
//
function createSortButton(label) {
  return Inputs.button([
    ["High To Low", value => {console.log(value); return true;}], ["Low To High", value => {console.log(value); return false;}]
  ], {value: true, label: `Reverse Sort direction`});
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

```js

const cardwFrontFilter = initializeControl('Card W');
const cardwFrontGenerator= Generators.input(cardwFrontFilter);
const cardwSortv = createSortButton('Card W');
const cardwSortGenerator = Generators.input(cardwSortv);

const cardlFrontFilter = initializeControl('Card L');
const cardlFrontGenerator= Generators.input(cardlFrontFilter);
const cardlSortv = createSortButton('Card L');
const cardlSortGenerator = Generators.input(cardlSortv);

const cardwlFrontFilter = initializeControl('Card WL');
const cardwlFrontGenerator= Generators.input(cardwlFrontFilter);
const cardwlSortv = createSortButton('Card WL');
const cardwlSortGenerator = Generators.input(cardwlSortv);

const cardKDFrontFilter = initializeControl('Card KD');
const cardKDFrontGenerator= Generators.input(cardKDFrontFilter);
const cardKDSortv = createSortButton('Card WL');
const cardKDSortGenerator = Generators.input(cardKDSortv);


const cardDFrontFilter = initializeControl('Card D');
const cardDFrontGenerator= Generators.input(cardDFrontFilter);
const cardDSortv = createSortButton('Card D');
const cardDSortGenerator = Generators.input(cardDSortv);
```

<div class="grid grid-cols-2">
  <div class="card">
      ${cardwSortv}
      ${cardwFrontFilter}
    ${resize((width) => genericGraph(planets, 'missionsWon', {width, factcolor, title:"Missions Won",front_filter:cardwFrontGenerator,sortv:cardwSortGenerator,showtext:false}))}
  </div>
  <div class="card">
      ${cardlSortv}
      ${cardlFrontFilter}
    ${resize((width) => genericGraph(planets,'missionsLost', {width, factcolor,title:"Missions Lost",front_filter:cardlFrontGenerator,sortv:cardlSortGenerator,showtext:false}))}
  </div>
  <div class="card">
    ${cardKDFrontFilter}
    ${cardKDSortv}
    ${resize((width) => genericGraph(planets, 'kills',{width, factcolor,title:"Kills Per Planet",front_filter:cardKDFrontGenerator,sortv:cardKDSortGenerator,showtext:false}))}
  </div>
    <div class="card">
     ${cardDFrontFilter}
     ${cardDSortv}
    ${resize((width) => genericGraph(planets, 'deaths',{width, factcolor,title:"Deaths Per Planet",front_filter:cardDFrontGenerator,sortv:cardDSortGenerator,showtext:false}))}
  </div>
</div>


<div class="grid grid-cols-1">
<div class="card">
      ${cardwlSortv}
      ${cardwlFrontFilter}
    ${resize((width) => missionsWonAndLost(planets, {width, factcolor,front_filter:cardwlFrontGenerator,sortv:cardwlSortGenerator}))}
  </div>
  </div>

