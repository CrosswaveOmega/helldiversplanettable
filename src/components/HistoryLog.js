import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";
import * as topojson from "npm:topojson-client";


export function pieChart(
    bdata,
    {
        name = ([x]) => x, // given d in data, returns the (ordinal) label
        value = ([, y]) => y, // given d in data, returns the (quantitative) value
        title, // given d in data, returns the title text
        width = 640, // outer width, in pixels
        height = 640, // outer height, in pixels
        innerRadius = 0, // inner radius of pie, in pixels (non-zero for donut)
        outerRadius = Math.min(width, height) / 2, // outer radius of pie, in pixels
        labelRadius = innerRadius * 0.2 + outerRadius * 0.8, // center radius of labels
        format = ",", // a format specifier for values (in the label)
        names, // array of names (the domain of the color scale)
        colors, // array of colors for names
        stroke = innerRadius > 0 ? "none" : "white", // stroke separating widths
        strokeWidth = 1, // width of stroke separating wedges
        strokeLinejoin = "round", // line join of stroke separating wedges
        padAngle = stroke === "none" ? 1 / outerRadius : 0, // angular separation between wedges, in radians
    } = {},
) {
    // Compute values.

    let data = [];

    for (const entry of bdata) {
        data.push([entry.biome, entry.missions]);
    }
    const N = d3.map(data, name);
    const V = d3.map(data, value);
    const I = d3.range(N.length).filter((i) => !isNaN(V[i]));

    // Unique the names.
    if (names === undefined) names = N;
    names = new d3.InternSet(names);

    // Chose a default color scheme based on cardinality.
    if (colors === undefined) colors = d3.schemeSpectral[names.size];
    if (colors === undefined)
        colors = d3.quantize(
            (t) => d3.interpolateSpectral(t * 0.8 + 0.1),
            names.size,
        );

    // Construct scales.
    const color = d3.scaleOrdinal(names, colors);

    // Compute titles.
    if (title === undefined) {
        const formatValue = d3.format(format);
        title = (i) => `${N[i]}\n${formatValue(V[i])}`;
    } else {
        const O = d3.map(data, (d) => d);
        const T = title;
        title = (i) => T(O[i], i, data);
    }

    // Construct arcs.
    const arcs = d3
        .pie()
        .padAngle(padAngle)
        .sort(null)
        .value((i) => V[i])(I);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const arcLabel = d3.arc().innerRadius(labelRadius).outerRadius(labelRadius);

    const svg = d3
        .create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg.append("g")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-linejoin", strokeLinejoin)
        .selectAll("path")
        .data(arcs)
        .join("path")
        .attr("fill", (d) => color(N[d.data]))
        .attr("d", arc)
        .append("title")
        .text((d) => title(d.data));

    svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(arcs)
        .join("text")
        .attr("transform", (d) => `translate(${arcLabel.centroid(d)})`)
        .selectAll("tspan")
        .data((d) => {
            const lines = `${title(d.data)}`.split(/\n/);
            return d.endAngle - d.startAngle > 0.25 ? lines : lines.slice(0, 1);
        })
        .join("tspan")
        .attr("x", 0)
        .attr("y", (_, i) => `${i * 1.1}em`)
        .attr("font-weight", (_, i) => (i ? null : "bold"))
        .text((d) => d);

    return Object.assign(svg.node(), { scales: { color } });
}

function getColor(owner) {
    switch (owner) {
        case 2:
            return "#EF8E20";
        case 3:
            return "#EF2020";
        case 1:
            return "#79E0FF";
    }
}
function getGloomName(level) {
    switch (level) {
        case 1:
            return "Light Gloom";
        case 2:
            return "Gloom";
        case 3:
            return "Dense Gloom";
        case 4:
            return "Gloom Wall"
    }
}
function getGloomObscurity(level) {
    switch (level) {
        case 1:
            return 0.5
        case 2:
            return 0.6
        case 3:
            return 0.8
        case 4:
            return 0.7
    }
}

export function countDistinctTypes(history) {
    const typeCounts = history.events.reduce((acc, event) => {
        if (!acc[event.type]) {
            acc[event.type] = 0;
        }
        acc[event.type]++;
        return acc;
    }, {});

    return JSON.stringify(typeCounts);
}

function add_to_entry(acc, planet, value, time, planets) {
    if (!acc[planet[1]]) {
        //console.log(planet[1]);
        let tofind = planets.find((el) => el["index"] == planet[1]);
        let front = "UNKNOWN";
        if (tofind) {
            front = tofind.sector_front;
        }
        acc[planet[1]] = { name: planet[0], index: planet[1], front: front };
    }
    if (!acc[planet[1]][value]) {
        acc[planet[1]][value] = 0;
    }
    acc[planet[1]][value] += 1;
}

export function count_distinct_planets(history, planets) {
    const planetTypes = history.events.reduce((acc, event) => {
        event.log.forEach((logEntry) => {
            if (logEntry.planet) {
                logEntry.planet.forEach((planet) => {
                    if (
                        logEntry.type === "campaign_start" ||
                        logEntry.type === "defense start"
                    ) {
                        add_to_entry(
                            acc,
                            planet,
                            "campaigns",
                            event.time,
                            planets,
                        );
                    }
                    if (logEntry.type === "campaign_end") {
                        add_to_entry(
                            acc,
                            planet,
                            "liblost",
                            event.time,
                            planets,
                        );
                    }
                    if (logEntry.type === "campaign_start") {
                        add_to_entry(
                            acc,
                            planet,
                            "lib_campaigns",
                            event.time,
                            planets,
                        );
                    }
                    if (logEntry.type === "defense start") {
                        add_to_entry(
                            acc,
                            planet,
                            "defenses",
                            event.time,
                            planets,
                        );
                    }
                    if (
                        logEntry.type === "planet won" ||
                        logEntry.type === "planet superwon"
                    ) {
                        add_to_entry(
                            acc,
                            planet,
                            "libwins",
                            event.time,
                            planets,
                        );
                    }
                    if (logEntry.type === "defense won") {
                        add_to_entry(
                            acc,
                            planet,
                            "defenses_won",
                            event.time,
                            planets,
                        );
                    }
                    if (logEntry.type === "defense lost") {
                        add_to_entry(
                            acc,
                            planet,
                            "defenses_lost",
                            event.time,
                            planets,
                        );
                        //add_to_entry(acc, planet,'campaigns')
                        //add_to_entry(acc, planet,'lib_campaigns')
                    }
                    if (logEntry.type === "planet flip") {
                        add_to_entry(
                            acc,
                            planet,
                            "planet_flips",
                            event.time,
                            planets,
                        );
                    }
                    /*if (!acc[planet[1]][logEntry.type]){
            acc[planet[1]][logEntry.type] =0;
          }
          acc[planet[1]][logEntry.type] +=1;*/
                });
            }
        });
        return acc;
    }, {});

    return planetTypes;
}
function DECODE(number) {
    let CO = (number >> 4) & 0b111;
    let AT = (number >> 1) & 0b111;
    let L = number & 0b1;
    return [CO, AT, L];
}
function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
  }

function x_c(x){
    return x;//*2000+2000;
}
function y_c(y){
    return -y;//*-2000+2000;
}
  
export function makeplot(
    history,
    gstates,
    planetimages,
    backround,
    target,
    slider,
    world,
    { width, htarget, ttarget, atarget, showImages = true },
) {
    let current_event = history.events[slider];
    const targets = {
        1: htarget,
        2: ttarget,
        3: atarget,
    };
    //let planets=current_event.galaxystate;
    let galaxy_time = current_event.eind;
    let elist=[current_event];
    console.log(planetimages);
    console.log(slider,galaxy_time);
    
    const sectorValuesMap = new Map();
    let galaxystate = {}; //gstates.states[String(galaxy_time)];
    for (const [planet, values] of Object.entries(gstates.gstatic)) {
        galaxystate[planet] = {};
        for (const [key, value] of Object.entries(values)) {
            galaxystate[planet][key] = value;
        }
        for (const element of gstates.gstate[planet]) {
            if (element.eind <= galaxy_time) {
                for (const [k, v] of Object.entries(element)) {
                    galaxystate[planet][k] = v;
                }
            }
        }

        galaxystate[planet]["ta"] = DECODE(galaxystate[planet]["t"]);

        if (!("link2" in galaxystate[planet])) {
            galaxystate[planet]["link"] = [];
        } else {
            let lastlink = galaxystate[planet]["link2"];
            galaxystate[planet]["link"] = gstates.links[String(lastlink)];
        }
        let sector=galaxystate[planet].sector.replace(/[^a-zA-Z]/g, "").toLowerCase();

        if (sectorValuesMap.has(sector)) {
            const existingColor = d3.color(sectorValuesMap.get(sector));
            const newColor = d3.color(getColor(galaxystate[planet].ta[0]));

            const averagedColor = d3.rgb(
                (existingColor.r + newColor.r) / 2,
                (existingColor.g + newColor.g) / 2,
                (existingColor.b + newColor.b) / 2
            ).formatRgb();

            sectorValuesMap.set(sector, averagedColor);
        }
        else{
            sectorValuesMap.set(sector, getColor(galaxystate[planet].ta[0]));
        }
    }
    //Link is in gstates[]
    const waypoints = Object.values(galaxystate).flatMap((x) =>
        Array.isArray(x.link)
            ? x.link.map((y) => ({
                  from: x.position,
                  to: galaxystate[y].position,
              }))
            : [],
    );
    

    let planets = Object.values(galaxystate);

    //console.log(planets);
    let truePlanets = planets.filter((planet) => planet.ta[1] > 0);
    let activePlanets = planets.filter((planet) => planet.ta[2] > 0);

    let gloomPlanets = planets.filter((planet) => planet.gls != null);

    let gloompoints=[];
    function generateRandomCoordinates(p,gls) {
        const coordinates = [];
        for (let i = 0; i < gls*4; i++) {
            const offsetX = getRandomInt(-50,50);
            const offsetY = getRandomInt(-50,50);
            
            coordinates.push({
                x: p.x + offsetX,
                y: p.y + offsetY,
                gls:gls
            });
            
        }
        return coordinates;
    }
    console.log(planets);
    gloomPlanets.forEach((p) => {

 

        let pos = { x: x_c(p.position.x), y: y_c(p.position.y) }; // example point
        const randomCoords = generateRandomCoordinates(pos,p.gls);
        gloompoints.push(...randomCoords);
    });
    
    eList(history, slider, document.getElementById("DAYVIEW"));

    list_text(history, slider, document.getElementById("Superdayview"));

    let textv=`${slider}:`;
    textv+=current_event.log.map(entry => entry.text).join(',');

    let plot = Plot.plot({
        width: width,
        title: " ",
        subtitle: `Current Time:${current_event.time}`,
        caption:textv,
        aspectRatio: 1,
        height: width,
        projection: {type: "identity", domain: world},
        /*{
            type: "identity",
            domain: {
                type: "MultiPoint",
                coordinates: [
                    [100, -100],
                    [100, 100], 
                    [-100, 100],
                    [-100, -100],
                ],
            },
        }*/
        marks: [
            // Plot.image([{}], {
            //     x: () => 0,
            //     y: () => 0,
            //     width: width,
            //     height: width,
            //     src: backround,
            // }),
            
            Plot.geo(world,{
                stroke:'#c0c0c0',
                strokeWidth: width / 2000,
                
            }),
            Plot.geo(world, {opacity:0.25,
                fill: d => {return sectorValuesMap.get(d.properties.id)}}),
            Plot.dot(truePlanets, {
                x: (p) =>x_c(p.position.x),
                y: (p) =>y_c(p.position.y),
                r: width / 100,
                stroke: (p) => getColor(p.ta[1]),
                //fill: p => getColor(p.ta[1]),
                strokeWidth: width / 200,
            }),
            
            Plot.dot(planets, {
                x: (p) =>x_c(p.position.x),
                y: (p) =>y_c(p.position.y),
                r: width / 100,
                stroke: (p) => getColor(p.ta[0]),
                fill: (p) => getColor(p.ta[0]),
                strokeWidth: width / 500,
                opacity: 1.0,
            }),

            Plot.link(waypoints, {
                x1: (p) => x_c(p.from.x),
                y1: (p) => y_c(p.from.y) ,
                x2: (p) => x_c(p.to.x) ,
                y2: (p) => y_c(p.to.y),
                inset: width / 110,
                strokeWidth: width / 880,
            }),
            showImages
                ? Plot.image(planets, {
                      x: (p) =>x_c(p.position.x),
                      y: (p) =>y_c(p.position.y),
                      r: width / 100,
                      src: (p) =>{
                        console.log(p.biome);
                          return planetimages["planet_" + p.biome + "_rotate.gif"]
                              .base64_image;
                      },
                  })
                : null,
            Plot.image(activePlanets, {
                x: (p) =>x_c(p.position.x),
                y: (p) =>y_c(p.position.y),
                stroke: "#ff0000", // fixed stroke color change
                fill: (p) => getColor(p.ta[0]),
                width: width / 25,
                height: width / 25,
                src: (p) => {
                    return target[p.ta[0]];
                },
                // strokeWidth: width / 200,
                //symbol: "plus",
            }),
            Plot.dot(gloompoints, {
                x: (p) => p.x,
                y: (p) => p.y,
                r: (p) => width / Math.max(100,500-100*p.gls),
                fill: "#EF8E20",
                strokeWidth: width / 500,
                opacity:  (p) => getGloomObscurity(p.gls),
            }),

            Plot.text(
                planets,
                {
                    x: (p) =>x_c(p.position.x),
                    y: (p) =>y_c(p.position.y)-0.02,
                    text: (p) =>
                        isNaN(
                            Math.round((p.hp / 1000000) * 100 * 10000) / 10000,
                        ) ||
                        Math.round((p.hp / 1000000) * 100 * 10000) / 10000 ===
                            100
                            ? ""
                            : ` ${Math.round((p.hp / 1000000) * 100 * 10000) / 10000}`,
                    dx: 15, //(d) => getTextSize(d[column].toFixed(1)).width / 2,
                    textAnchor: "top",
                    fill: "white",
                    stroke: "black",
                    strokeWidth: 2,
                },
                {},
            ),
            

            Plot.tip(
                planets,
                Plot.pointer({
                    x: (p) =>x_c(p.position.x),
                    y: (p) =>y_c(p.position.y),

                    title: (p) =>{
                        let main=[
                            `${p.name}\n${p.ta[1] ? "under attack" : ""}`,
                            `Planet HP: ${
                                Math.round((p.hp / 1000000) * 100 * 10000) /
                                10000
                            }`,

                            `Decay Rate: ${
                                Math.round(((p.r * 60 * 60) / 1000000) * 100 * 10000) / 10000
                            }`,
                            `Players: ${p.pl}`,
                        ]
                        if (p.gls!=null){
                            main.push(
                                `${getGloomName(p.gls)}`)
                        }
                        return main.join("\n");
                    },
                    fontSize: 10,
                }),
            ),
        ],
        tip: true,
    });

    return plot;
}


export function eList(history, count, parentCard, mode = 0) {
    /**
     * Generates a list of events using the provided DaysObject history.
     * Each event is displayed as a card on the parent HTML element.
     * 
     * @param {DaysObject} history - The historical data containing game events.
     * @param {number} count - The current event index to highlight.
     * @param {HTMLElement} parentCard - The parent container for event cards.
     * @param {number} [mode=0] - Mode for displaying events (0: batch mode, 1: scroll mode).
     * @returns {string} - Empty string as a dummy return value.
     */

    function createCard(entry, index, current, parentCard) {
        /**
         * Creates and appends a card to display details of a game event entry.
         * 
         * @param {GameEvent} entry - The game event data to display.
         * @param {number} index - The index of the event.
         * @param {boolean} current - Whether this event is the current one (highlighted).
         * @param {HTMLElement} parentCard - The parent HTML element to append the card to.
         * @returns {HTMLElement} - The parent card element with the appended details.
         */

        const headingElement = document.createElement("h3");
        headingElement.textContent = current
            ? `▶  Day ${entry.day}, Event index ${index}`
            : ` Day:#${entry.day}, Event index ${index}`;

        parentCard.appendChild(headingElement);

        for (const each of entry.log) {
            const textElement = document.createElement("span");
            textElement.textContent = each.text;
            parentCard.appendChild(textElement);

            parentCard.appendChild(document.createElement("br"));
        }
        const timeElement = document.createElement("strong");
        timeElement.textContent = entry.time;
        parentCard.appendChild(timeElement);

        parentCard.appendChild(document.createElement("br"));

        parentCard.appendChild(document.createElement("br"));

        return parentCard;
    }

    function createEventCards(data, count, factorby, parentElement, mode) {
        /**
         * Create the text for all elements up to factorby
         * 
         * @param {DaysObject} data - The historical data containing game events.
         * @param {number} count - The current event index to highlight.
         * @param {number} factorby - The number of events to display in a single mode batch.
         * @param {HTMLElement} parentElement - The parent element to clear and append cards to.
         * @param {number} mode - Display mode: 0 for batch, 1 for scrolling.
         */

        while (parentElement.firstChild) {
            parentElement.innerHTML = "";
        }
        let curr_over=false;
        let lower, index;
        switch (mode) {
            case 0:
                let off = 0;
                lower = Math.floor(count / factorby) * factorby;
                let current=false;
                for (index = lower; index < lower + factorby +off; index++) {
                    if (index >= data.events.length) break;
                    let event = data.events[index];
                    current = (index === count);
                    if (event.type =='m'){
                        off+=1;
                        if (current){
                            curr_over=true;
                        }
                    }
                    else{
                        const card = createCard(
                            event,
                            index,
                            current || curr_over,
                            parentElement,
                        );
                        curr_over=false;
                    }
                }
                break;
            case 1:
                lower = Math.max(count - factorby, 0);
                for (index = lower; index < data.events.length; index++) {
                    if (index >= data.events.length) break;
                    let event = data.events[index];
                    let current = index == count;
                    const card = createCard(
                        event,
                        index,
                        current,
                        parentElement,
                    );
                }
                parentElement.scrollTop = parentElement.scrollHeight;
                break;
            default:
                break;
        }
    }

    let dayv = history.events[count].day;
    createEventCards(history, count, 8, parentCard, mode);
    return "";
}

export function list_text(history, count, parentCard) {
    /**
     * Create the text for the event at index count inside parentCart
     * Each event is displayed as a card on the parent HTML element.
     * 
     * @param {DaysObject} history - The historical data containing game events.
     * @param {number} count - The current event index to highlight.
     * @param {HTMLElement} parentCard - The parent container for event cards.
     * @returns {string} - Empty string as a dummy return value.
     */

    function createCard(entry_main, parentCard) {
        /**
         * Creates and appends a card created based on the game_event
         * 
         * @param {GameEvent} entry - The game event data to display.
         * @param {HTMLElement} parentCard - The parent HTML element to append the card to.
         * @returns {HTMLElement} - The parent card element with the appended details.
         */

        const h1 = document.createElement("h1");
        h1.textContent = `Day ${entry_main.day}, Event index ${count}`;

        parentCard.appendChild(h1);

        const timeElement = document.createElement("p");
        timeElement.innerHTML = `<strong>Time:</strong> ${entry_main.time} UTC`;
        parentCard.appendChild(timeElement);

        // Create and append Current Major Order paragraph
        const moElement = document.createElement("p");
        moElement.innerHTML = `<strong>Current Major Order:</strong> ${entry_main.mo}`;
        parentCard.appendChild(moElement);

        // Create and append Timestamp paragraph
        const timestampElement = document.createElement("p");
        timestampElement.innerHTML = `<strong>Timestamp:</strong> ${entry_main.timestamp}`;
        parentCard.appendChild(timestampElement);
        for (const entry of entry_main.log) {
            let planet = "";
            if (entry.planet && entry.planet.length > 0) {
                planet = entry.planet.map((p) => p[0]).join(", ");
                planet = ", on " + planet;
            }
            let text = entry.text + " (type " + entry.type + planet + ")";

            const textElement = document.createElement("span");
            textElement.textContent = text;
            parentCard.appendChild(textElement);

            parentCard.appendChild(document.createElement("br"));
        }

        return parentCard;
    }

    // Function to create the grid element

    function createEventCard(data, count, parentElement) {
        /**
         * Clear the text inside parentElement, and format the event at count
         * 
         * @param {DaysObject} data - The historical data containing game events.
         * @param {number} count - The current event index to highlight.
         * @param {HTMLElement} parentElement - The parent element to clear and append cards to.
         */

        while (parentElement.firstChild) {
            parentElement.innerHTML = "";
        }

        const card = createCard(data.events[count], parentElement);
    }
    // Generate the grid with cards
    createEventCard(history, count, parentCard);
    return "";
}

export function ListAll(history, parentCard, mode = 0) {
    /**
     * Create the text for the event at index count inside parentCart
     * Each event is displayed as a card on the parent HTML element.
     * 
     * @param {DaysObject} history - The historical data containing game events.
     * @param {HTMLElement} parentCard - The parent container for event cards.
     * @param {int} mode - mode for listing all
     * @returns {string} - Empty string as a dummy return value.
     */

    function createCard(entry, parentCard) {
        /**
         * Creates and appends a card created based on the game_event
         * 
         * @param {GameEvent} entry - The game event data to display.
         * @param {HTMLElement} parentCard - The parent HTML element to append the card to.
         * @returns {HTMLElement} - The parent card element with the appended details.
         */

        for (const each of entry.log) {
            if (each.type === "Day Start") {
                parentCard.appendChild(document.createElement("br"));
                const headingElement2 = document.createElement("h1");
                headingElement2.textContent = ` Day:#${entry.day}`;
                headingElement2.id = `day${entry.day}`;
                headingElement2.href = `#day${entry.day}`;
                parentCard.appendChild(headingElement2);
            } else {
                const textElement = document.createElement("span");
                textElement.textContent = ` ${each.text} (${entry.time} UTC)`;
                parentCard.appendChild(textElement);

                parentCard.appendChild(document.createElement("br"));
            }
        }

        return parentCard;
    }

    // Function to create the grid element

    function createEventCards(data, parentElement, mode) {
        /**
         * Create the text for all elements up to factorby
         * 
         * @param {DaysObject} data - The historical data containing game events.
         * @param {HTMLElement} parentElement - The parent element to clear and append cards to.
         * @param {number} mode - Display mode: 0 for everything, 1 for last 20.
         */

        while (parentElement.firstChild) {
            parentElement.innerHTML = "";
        }

        // Add new elements into the 'cont' div

        let lower, index, day, newlower, i;
        switch (mode) {
            case 0:
                for (index = 0; index < data.events.length; index++) {
                    let event = data.events[index];
                    const card = createCard(event, parentElement);
                }
                break;
            case 1:
                lower = Math.max(data.events.length - 20, 0);
                day = data.events[lower].day;
                newlower = lower;
                for (i = lower; i > 0; i--) {
                    if (data.events[i].day == day) {
                        newlower--;
                    } else {
                        newlower = i + 1;
                        break;
                    }
                }
                for (index = newlower; index < data.events.length; index++) {
                    let event = data.events[index];
                    if (event.type!='m'){
                    const card = createCard(event, parentElement);
                    }
                }

                parentElement.scrollTop = parentElement.scrollHeight;
                break;
            default:
                break;
        }
    }

    createEventCards(history, parentCard, mode);
    return "";
}
