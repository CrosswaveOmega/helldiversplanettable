---
theme: dashboard
title: Biome Data
toc: false
---

# Helldivers Data Table - Biome Data

<!-- Load and transform the data -->

```js

import {
    TimeTrack
  } from "./components/dataplots.js";

  
import {
    make_biome_data
  } from "./components/data_transformers.js";

import {
  pieChart
} from "./components/HistoryLog.js";

import {
  planetTable, headerMapBiome,
} from "./components/tables.js";
  
const planets = FileAttachment("./data/trackout.json").json();

```

<!--

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
-->


<!-- Plot of launch history -->





<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => TimeTrack(planets, {width}))}
  </div>
</div>


