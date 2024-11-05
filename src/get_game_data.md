---
title: History JSON Resources
toc: True
sidebar: true
---
# Data Resources



```js
  import {
    ListAll, count_distinct_planets,
  } from "./components/HistoryLog.js";
  import {
    make_sector_data,
  } from "./components/data_transformers.js";
    import {
    count_distinct_planet_battles,
  } from "./components/battle_tracker.js";
import {
    SimplifyHistory,
  } from "./components/history_simplify.js";

      import {
    BattleList,SectorBattleList
  } from "./components/battle_list_gen.js";
  import {get_update_time_local, get_update_time_utc} from "./components/time_utils.js";

```

```js


const lasttime = FileAttachment("./data/lasttime.json").json();
const planets = FileAttachment("./data/planets.json").json();

let sector_data = await planets.then(data => make_sector_data(data));

const historydata= await FileAttachment("./data/historydata.json").json();
```
```js

var update_time_string = lasttime['update_time']

var update_time_local = get_update_time_local(lasttime['update_time'])
var update_time_utc =get_update_time_utc(lasttime['update_time'])


function formatBattleData() {
    
    const planetTypes = count_distinct_planet_battles(historydata,false,sector_data).planetTypes;
    
    let data = Object.values(planetTypes);
    let planets_list={};
    for (const sector of data){
        console.log(sector.planets);
        let planets = Object.values(sector.planets);
        if (planets.length !== 0) {
            for (const planet of planets){
                console.log(planet);
                planets_list[planet.index]=planet;
            }
        }
    }

    const jsonString = JSON.stringify(planets_list, null, 2);

    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create an anchor element and set attributes for download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'battle_tracker_data.json';

    // Append the anchor to the body
    document.body.appendChild(a);

    // Programmatically click the anchor to trigger the download
    a.click();

    // Remove the anchor from the document
    document.body.removeChild(a);

    // Revoke the object URL to free resources
    URL.revokeObjectURL(url);
}

function formatHistory() {
    
    let planets_list=SimplifyHistory(historydata)


    const jsonString = JSON.stringify(planets_list, null, 2);

    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create an anchor element and set attributes for download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simple_history.json';

    // Append the anchor to the body
    document.body.appendChild(a);

    // Programmatically click the anchor to trigger the download
    a.click();

    // Remove the anchor from the document
    document.body.removeChild(a);

    // Revoke the object URL to free resources
    URL.revokeObjectURL(url);
}

```


### ${update_time_utc} 
### Last update was ${update_time_local}

**ALL DISPLAYED TIMES ARE IN UTC**

<details>
<summary><bold>What does this all mean?</bold></summary>

This page is for retrieving a json copy of this site's processed war history information,
indended to be used by the wikis for Helldivers 2.

</details>


```js


const getfileevent = () => {
  formatBattleData();
};


const GetBattleJSONButton = Inputs.button([["Download JSON file with current battle log.", getfileevent]], { label : 'GetBattleJSONButton' });

const getfileevent2 = () => {
  formatHistory();
};


const GetHistoryJSON = Inputs.button([["Download JSON file with full history log", getfileevent2]], { label : 'GetHistoryJSON' });

```
Get the JSON for the Planet Battles list.
${GetBattleJSONButton}

Get the JSON for the entire Log.
${GetHistoryJSON}
