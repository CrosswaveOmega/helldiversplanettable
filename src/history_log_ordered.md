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

function tocnew(config) {
  const selector = config?.selector || "h1,h2,h3,h4,h5,h6";
  const heading = config?.heading || "Table of Contents";
  const tocDiv = document.getElementById("TOC");

  function createTOC() {
    tocDiv.innerHTML = ''; // Clear existing content

    const minSelector = Math.min(...selector.split(",").map(d => +d.replace("h", "")));
    const headings = Array.from(document.querySelectorAll(selector));

    if (headings.length > 0) {
      const tocHeading = document.createElement("b");
      tocHeading.textContent = heading;
      tocDiv.appendChild(tocHeading);

      const ul = document.createElement("ul");
      tocDiv.appendChild(ul);

      headings.forEach(h => {
        const level = parseInt(h.tagName.slice(1));
        let li = document.createElement("li");
        let link = document.createElement("a");
        link.href = `#${h.id}`;
        link.textContent = h.textContent;
        li.appendChild(link);

        let currentLevel = ul;
        for (let i = minSelector; i < level; i++) {
          let nestedUl = document.createElement("ul");
          currentLevel.appendChild(nestedUl);
          currentLevel = nestedUl;
        }

        currentLevel.appendChild(li);
      });
    }
  }

  createTOC(); // Call the function to create the ToC

  // Optionally, you can call createTOC() again if you know the document structure has changed
}
```
```js
ListAll(historydata,document.getElementById("history"));
const config = {
  selector: "h1,h2,h3,h4,h5,h6",
  heading: "Table of Contents"
};

tocnew(config);
```

<div class="grid grid-cols-3">
  <div class="card big grid-colspan-2">
  

<div id="history"></div>
  </div>
    <div class="card big">
    
<div id="TOC"></div>
  </div>
</div>

<div id="TOC"></div>
