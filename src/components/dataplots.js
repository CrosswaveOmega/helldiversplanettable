
import * as Plot from "npm:@observablehq/plot";
    function getTextSize(text, fontSize = "12px", fontFamily = "sans-serif") {
      const context = document.createElement("canvas").getContext("2d");
      context.font = `${fontSize} ${fontFamily}`;
      const { width } = context.measureText(text);
      return { width, height: parseInt(fontSize, 10) };
    }

function bugKills(data, {width, factcolor} = {}) {

    let plotnew=Plot.plot({

    x: {
      axis: "bottom",
      label: null,
      tickFormat: ".0e"
    },
    title:"Kills",
    width,
    marks: [
      Plot.barX(data, {y: "planet_name", x: "bug_kills", sort: {y: "x", limit:15, reverse: true}, tip:true}),
    ],
  });
  return plotnew;

  }

  function botKills(data, {width, factcolor} = {}) {

    let plotnew=Plot.plot({

    x: {
      axis: "bottom",
      label: null,
      tickFormat: ".0e"
    },
    title:"Kills",
    width,
    marks: [
      Plot.barX(data, {y: "planet_name", x: "bot_kills", sort: {y: "x", limit:15, reverse: true}, tip:true}),
    ],
  });
  return plotnew;
  }


  function allKills(data, {width, factcolor} = {}) {
  // Measure the largest text size
  let labels = data.map(planet => planet.planet_name);
  let textSizes = labels.map(label => getTextSize(label));
  console.log(textSizes);
  let maxTextWidth = Math.max(...textSizes.map(size => size.width));
  let maxTextHeight = Math.max(...textSizes.map(size => size.height));

    let plotnew=Plot.plot({
      grid:true,
  marginLeft:maxTextWidth, // Adjust left margin to ensure y-axis labels fit within bounds
    x: {
      axis: "bottom",
      label: null,
      tickFormat: ".0e"
    },
    y:{
        label:null,
    },
    title:"Enemy kills per planet",

    color: {...factcolor, legend: true},
    width,
    marks: [
      Plot.barX(data, {y: "planet_name", x: "kills", fill: "front",sort: {y: "x", limit:50, reverse: true}, tip:true}),
    ],
  });
  return plotnew;
  }
  function allDeaths(data, {width, factcolor} = {}) {
  // Measure the largest text size
  let labels = data.map(planet => planet.planet_name);
  let textSizes = labels.map(label => getTextSize(label));
  console.log(textSizes);
  let maxTextWidth = Math.max(...textSizes.map(size => size.width));
  let maxTextHeight = Math.max(...textSizes.map(size => size.height));

    let plotnew=Plot.plot({
      grid:true,
  marginLeft:maxTextWidth, // Adjust left margin to ensure y-axis labels fit within bounds
    x: {
      axis: "bottom",
      label: null,
      tickFormat: ".0e"
    },
    y:{
        label:null,
    },
    title:"Helldiver deaths per planet",

    color: {...factcolor, legend: true},
    width,
    marks: [
      Plot.barX(data, {y: "planet_name", x: "deaths", fill: "front",sort: {y: "x", limit:50, reverse: true}, tip:true}),
    ],
  });
  return plotnew;
  }

  function kdRatio(data, {width, factcolor} = {}) {
  // Measure the largest text size
  let labels = data.map(planet => planet.planet_name);
  let textSizes = labels.map(label => getTextSize(label));
  console.log(textSizes);
  let maxTextWidth = Math.max(...textSizes.map(size => size.width));
  let maxTextHeight = Math.max(...textSizes.map(size => size.height));

    let plotnew=Plot.plot({
      grid:true,
  marginLeft:maxTextWidth, // Adjust left margin to ensure y-axis labels fit within bounds
    x: {
      axis: "bottom",
      label: null,
      tickFormat: ".0e"
    },
    y:{
        label:null,
    },
    title:"K:D ratio per planet",

    color: {...factcolor, legend: true},
    width,
    marks: [
      Plot.barX(data, {y: "planet_name", x: "KTD", fill: "front",sort: {y: "x", limit:50, reverse: true}, tip:true}),
    ],
  });
  return plotnew;
  }


  function missionsWon(data, {width, factcolor} = {}) {

  let labels = data.map(planet => planet.planet_name);
  let textSizes = labels.map(label => getTextSize(label));
  console.log(textSizes);
  let maxTextWidth = Math.max(...textSizes.map(size => size.width));
  let maxTextHeight = Math.max(...textSizes.map(size => size.height));
    let plotnew=Plot.plot({
      marginLeft:maxTextWidth, // Adjust left margin to ensure y-axis labels fit within bounds
  x: {
        axis: "bottom",
      },
      y: {
        label: null,
      },
    title:"Missions Won",
    width,

    color: {...factcolor, legend: true},
    marks: [
      Plot.barX(data, {y: "planet_name", x: "missionsWon", fill: "front",sort: {y: "x", limit:50, reverse: true}, tip:true}),
    ],
    }
    );
  return plotnew;

  }

  function missionsLost(data, {width, factcolor} = {}) {

  let labels = data.map(planet => planet.planet_name);
  let textSizes = labels.map(label => getTextSize(label));
  console.log(textSizes);
  let maxTextWidth = Math.max(...textSizes.map(size => size.width));
  let maxTextHeight = Math.max(...textSizes.map(size => size.height));
    let plotnew=Plot.plot({
      marginRight:maxTextWidth-100, // Adjust left margin to ensure y-axis labels fit within bounds
  x: {
        axis: "bottom",
      },
      y: {
        label: null,
        axis: "right",
      },
    title:"Missions Lost",
    width,

    color: {...factcolor, legend: true},
    marks: [

      Plot.barX(data, {y: "planet_name", x: "missionsLost", fill: "front",sort: {y: "x", limit:50, reverse: true}, tip:true}),
    ],
    }
    );
  return plotnew;

  }

  function missionsWonAndLost(data, {width, factcolor} = {}) {
    // Function to measure text size

    // Measure the largest text size
    let labels = data.map(planet => planet.planet_name);
    let textSizes = labels.map(label => getTextSize(label));
    let maxTextWidth = Math.max(...textSizes.map(size => size.width));

    // Adjust the left margin based on the largest text size
    let marginLeft = maxTextWidth + 10;  // Adding some extra space for better visualization

    // Transform data to include separate entries for missionsWon and missionsLost
    let transformedData = [];
    data.forEach(d => {
      transformedData.push({ ...d, type: "missionsWon", value: d.missionsWon,color: d.front });
      transformedData.push({ ...d, type: "missionsLost", value: d.missionsLost, color: d.front + 'L' });
    });

    // Create the plot with adjusted margins
    let plotnew = Plot.plot({
      marginLeft,  // Adjust left margin to ensure y-axis labels fit within bounds
      grid:true,
      x: {
        axis: "bottom",
      },
      y: {
        label: null,
      },
      title: "Missions Won and Lost",
      width,  // Set the width of the plot
      color: { ...factcolor, legend: true },  // Use factcolor for fill colors
      marks: [
        Plot.barX(transformedData, {
          y: "planet_name",
          x: "value",
          fill: "color",
          stroke: d => d.type === "missionsWon" ? "#1f77b4" : "#ff7f0e",  // Outline color based on type
          sort: { y: "x", limit: 50, reverse: true },
          tip: true,
          title: d => `${d.type}: ${d.value}`,
        }),
      ],
    });

    return plotnew;
  }
  function make_biome_data(data){
    /**
     * Aggregates and transforms biome data.
     *
     * This function processes the input data to aggregate statistics for each biome and then
     * calculates derived metrics such as deaths per mission, kills per mission, kills to deaths ratio,
     * and win to loss ratio.
     *
     * @param {Array} data - An array of objects where each object contains data for a specific entry,
     *                       including fields like biome, missionsWon, missionsLost, bot_kills, bug_kills,
     *                       deaths, and friendlies.
     *
     * @returns {Array} An array of transformed objects containing aggregated data and derived metrics for each biome.
     */
    console.log("DATA");
    console.log(data);
    let fronts=['all'];
    let biome_data = data.reduce((acc, entry) => {
      let front=entry.front;
      if (!fronts.includes(front)) fronts.unshift(front);
      
      if (!acc['all']){acc['all']={};}

      if (!acc[front]){acc[front]={};}

      if (!acc['all'][entry.biome]) {
        acc['all'][entry.biome] = { ...entry, count:1, };
        
      } else {

        acc['all'][entry.biome].missionsWon    += entry.missionsWon;
        acc['all'][entry.biome].missionsLost   += entry.missionsLost;
        acc['all'][entry.biome].bot_kills      +=entry.bot_kills;
        acc['all'][entry.biome].bug_kills      +=entry.bug_kills;
        acc['all'][entry.biome].deaths         +=entry.deaths;
        acc['all'][entry.biome].friendlies     +=entry.friendlies
        acc['all'][entry.biome].count      +=1;          
      }

          if (!acc[front][entry.biome]) {
            acc[front][entry.biome] = { ...entry, count:1, };
            
          } else {

            acc[front][entry.biome].missionsWon    += entry.missionsWon;
            acc[front][entry.biome].missionsLost   += entry.missionsLost;
            acc[front][entry.biome].bot_kills      +=entry.bot_kills;
            acc[front][entry.biome].bug_kills      +=entry.bug_kills;
            acc[front][entry.biome].deaths         +=entry.deaths;
            acc[front][entry.biome].friendlies     +=entry.friendlies
            acc[front][entry.biome].count      +=1;          
          }
          return acc;
        }, {});
    console.log(biome_data);

    let transformedData = {};
    for (const front of fronts){
      let thislist=[];
      for  (const [key, entry] of Object.entries(biome_data[front])){
        let missions = Math.max(entry.missionsWon + entry.missionsLost, 1);
        let killsum = Math.max(entry.bot_kills+entry.bug_kills,1);
        let dpm=entry.deaths/missions;
        let kpm=killsum/missions;
        let ktd=killsum/Math.max(entry.deaths,1);
        let wtl=entry.missionsWon/Math.max(entry.missionsLost,1);
        thislist.push({...entry,missions,killsum,dpm,kpm,ktd,wtl});
      }
      transformedData[front]=thislist;
      console.log(transformedData);
    }
    return transformedData;
  }
  function BiomeStats(data, mode, {width, biocolors, title='Biome stats'} = {}) {
    // Function to measure text size

    // Measure the largest text size
    let labels = data.map(planet => planet.biome);
    let textSizes = labels.map(label => getTextSize(label));
    let maxTextWidth = Math.max(...textSizes.map(size => size.width));
    let maxTextHeight= Math.max(...textSizes.map(size => size.height));

    // Adjust the left margin based on the largest text size
    let marginLeft = maxTextWidth + 10;  // Adding some extra space for better visualization



    

    let transformedData = [];
    for (const entry of data) {
        let missions = Math.max(entry.missionsWon + entry.missionsLost, 0);
        let killsum = Math.max(entry.bot_kills+entry.bug_kills,0);
        let deaths = entry.deaths;
        if (mode==0){
        transformedData.push({ order:missions, disp:"",biome: entry.biome, key: 'missionsWon', value: entry.missionsWon});
        transformedData.push({ order:missions, disp:"",biome: entry.biome, key: 'missionsLost', value: entry.missionsLost});
        }
        if (mode==1){
        transformedData.push({ order:killsum, disp:`${entry.bot_kills}`,biome: entry.biome, key: 'Bot kills', value: entry.bot_kills });
        transformedData.push({ order:killsum, disp:`${entry.bug_kills}`,biome: entry.biome, key: 'Bug kills', value: entry.bug_kills });
        }
        if (mode==2){
        transformedData.push({ order:deaths, disp:`${entry.deaths}`,biome: entry.biome, key: 'deaths', value: entry.deaths });
        transformedData.push({ order:deaths, disp:`${entry.friendlies}`,biome: entry.biome, key: 'friendly', value: entry.friendlies });
        }
        if (mode==3){
        transformedData.push({ order:entry.count, disp:`${entry.deaths}/${entry.missions}`,biome: entry.biome, key: `deaths per mission`, value: entry.dpm });
        transformedData.push({ order:entry.count, disp:`${entry.killsum}/${entry.missions}`,biome: entry.biome, key: `kills per mission`, value: entry.kpm});
        transformedData.push({ order:entry.count, disp:`${entry.killsum}/${entry.deaths}`,biome: entry.biome, key: `kills to deaths`, value: entry.ktd});
        transformedData.push({ order:entry.count, disp:`${entry.missionsWon}/${entry.missionsLost}`,biome: entry.biome, key: `wins to losses`, value: entry.wtl});
        
        }
    }
    transformedData.sort((a, b) => b.order - a.order);
    if (mode==3){
      let plotnew = Plot.plot({
        marginTop:maxTextHeight+maxTextWidth,  // Adjust top margin to ensure x-axis labels fit within bounds
        marginBottom:maxTextHeight,
        grid:true,
        y: {
          axis: "left",
          label: null,
          
        },
        fx: {
          label: null,
          axis:'bottom',
          fill: "color",
          
        },
        x:{label:null, axis:'top',tickRotate: -90,  
        tickPadding: 10   },
        title,
        width,  // Set the width of the plot
        color: { ...biocolors, legend: true },  // Use factcolor for fill colors
        marks: [
          Plot.barY(transformedData, {
            
            y: "value",
            x: 'biome',
            fx: "key",
            fill: 'biome',
            stroke: d => d.key === "missionsWon" ? "#1f77b4" : "#ff7f0e",  // Outline color based on type
            //sort: {x: null, color: null, fx: {value: "-x", reduce: "mean"}},
            tip: true,
            text: (d) => (d.value ).toFixed(1), dy: 2, lineAnchor: "top",
            title: d => `${d.biome} ${d.key}: ${d.disp} (${d.value})`,
          }),
          Plot.text(transformedData, {x: "biome", fx:'key',y: "value", text: (d) => (d.value ).toFixed(1), dy: -6, lineAnchor: "bottom"}),
        ],
      });
      return plotnew;
    }
    let plotnew = Plot.plot({
      marginLeft,  // Adjust left margin to ensure y-axis labels fit within bounds
      marginRight:marginLeft,
      grid:true,
      y: {
        axis: "bottom",
        label: null,
        tickFormat: ".0e"
        
      },
      fy: {
        label: null,
        axis:'left',
        domain: transformedData.sort((a, b) => b.order - a.order).map(d => d.biome),
        fill: "color",
      },
      y:{label:null, axis:'right'},
      title,
      width,  // Set the width of the plot
      color: { ...biocolors, legend: true },  // Use factcolor for fill colors
      marks: [
        Plot.barX(transformedData, {
          y: "key",
          x: "value",
          fy: 'biome',
          fill: 'biome',
          stroke: d => d.key === "missionsWon" ? "#1f77b4" : "#ff7f0e",  // Outline color based on type
          sort: {y: null, color: null, fy: {value: "-y", reduce: "mean"}},
          tip: true,
          title: d => `${d.biome} ${d.key}: ${d.disp} (${d.value})`,
        }),
      ],
    });
    return plotnew;
  }



  function BiomeData(data, parentElement) {
    // Sum of all entries with the set biome value
    let summedData = data.reduce((acc, entry) => {
      if (!acc[entry.biome]) {
        acc[entry.biome] = { ...entry, count: 1 };
      } else {
        acc[entry.biome].missionsWon += entry.missionsWon;
        acc[entry.biome].missionsLost += entry.missionsLost;
        acc[entry.biome].bot_kills += entry.bot_kills;
        acc[entry.biome].bug_kills += entry.bug_kills;
        acc[entry.biome].deaths += entry.deaths;
        acc[entry.biome].friendlies += entry.friendlies;
        acc[entry.biome].count += 1;
      }
      return acc;
    }, {});
  
    // Function to create a card element
    function createCard(entry) {
      const card = document.createElement("div");
      card.className = "card";
  
      const title = document.createElement("h2");
      title.appendChild(document.createTextNode(`${entry.biome} Stats`));
      card.appendChild(title);
  
      const missionsWon = document.createElement("span");
      missionsWon.appendChild(document.createTextNode(`Missions Won: ${entry.missionsWon.toLocaleString("en-US")}`));
      card.appendChild(missionsWon);
      card.appendChild(document.createElement("br"));
  
      const missionsLost = document.createElement("span");
      missionsLost.appendChild(document.createTextNode(`Missions Lost: ${entry.missionsLost.toLocaleString("en-US")}`));
      card.appendChild(missionsLost);
      card.appendChild(document.createElement("br"));
  
      const botKills = document.createElement("span");
      botKills.appendChild(document.createTextNode(`Bot Kills: ${entry.bot_kills.toLocaleString("en-US")}`));
      card.appendChild(botKills);
      card.appendChild(document.createElement("br"));
  
      const bugKills = document.createElement("span");
      bugKills.appendChild(document.createTextNode(`Bug Kills: ${entry.bug_kills.toLocaleString("en-US")}`));
      card.appendChild(bugKills);
      card.appendChild(document.createElement("br"));
  
      const deaths = document.createElement("span");
      deaths.appendChild(document.createTextNode(`Deaths: ${entry.deaths.toLocaleString("en-US")}`));
      card.appendChild(deaths);
      card.appendChild(document.createElement("br"));
  
      const friendlies = document.createElement("span");
      friendlies.appendChild(document.createTextNode(`Friendlies: ${entry.friendlies.toLocaleString("en-US")}`));
      card.appendChild(friendlies);
      card.appendChild(document.createElement("br"));
  
      const count = document.createElement("span");
      count.appendChild(document.createTextNode(`Count: ${entry.count.toLocaleString("en-US")}`));
      card.appendChild(count);
  
      return card;
    }
  
    // Function to create the grid element
    function createGrid(data, parentElement) {

      Object.values(summedData).forEach(entry => {
        const card = createCard(entry);
        parentElement.appendChild(card);
      });
      
    }
  
    // Generate the grid with cards
    createGrid(data,parentElement);
  }
  
  
  export {
    bugKills,
    botKills,
    allKills,
    allDeaths,
    kdRatio,
    missionsWon,
    missionsLost,
    missionsWonAndLost,
    BiomeStats,
    BiomeData,
    make_biome_data,
  };
