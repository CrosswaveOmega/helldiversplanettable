---
title: Ordered History Log
toc: True
sidebar: true
---
# History log ordered.
```js
  import {
    ListAll
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


<div id="history">
${ListAll(historydata,document.getElementById("history"))}
</div>