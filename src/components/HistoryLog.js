import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";

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

  svg
    .append("g")
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

  svg
    .append("g")
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

function add_to_entry(acc, planet, value, time) {
  if (!acc[planet[1]]) {
    acc[planet[1]] = { name: planet[0], index: planet[1] };
  }
  if (!acc[planet[1]][value]) {
    acc[planet[1]][value] = 0;
  }
  acc[planet[1]][value] += 1;
}

export function count_distinct_planets(history) {
  const planetTypes = history.events.reduce((acc, event) => {
    event.log.forEach((logEntry) => {
      if (logEntry.planet) {
        logEntry.planet.forEach((planet) => {
          if (logEntry.type === "cstart" || logEntry.type === "defense start") {
            add_to_entry(acc, planet, "campaigns", event.time);
          }
          if (logEntry.type === "cend" || logEntry.type === "defense start") {
            add_to_entry(acc, planet, "liblost", event.time);
          }
          if (logEntry.type === "cstart") {
            add_to_entry(acc, planet, "lib_campaigns", event.time);
          }
          if (logEntry.type === "defense start") {
            add_to_entry(acc, planet, "defenses", event.time);
          }
          if (
            logEntry.type === "planet won" ||
            logEntry.type === "planet superwon"
          ) {
            add_to_entry(acc, planet, "libwins", event.time);
          }
          if (logEntry.type === "defense won") {
            add_to_entry(acc, planet, "defenses_won", event.time);
          }
          if (logEntry.type === "defense lost") {
            add_to_entry(acc, planet, "defenses_lost", event.time);
            //add_to_entry(acc, planet,'campaigns')
            //add_to_entry(acc, planet,'lib_campaigns')
          }
          if (logEntry.type === "planet flip") {
            add_to_entry(acc, planet, "planet_flips", event.time);
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

export function makeplot(
  history,
  planetimages,
  backround,
  target,
  slider,
  { width, htarget, ttarget, atarget, showImages = true },
) {
  let current_event = history.events[slider];
  const targets = {
    1: htarget,
    2: ttarget,
    3: atarget,
  };
  //let planets=current_event.galaxystate;

  let galaxystate = current_event.galaxystate;
  for (const [planet, values] of Object.entries(history.galaxystatic)) {
    for (const [key, value] of Object.entries(values)) {
      galaxystate[planet][key] = value;
    }
    if (!galaxystate[planet]["link"]) {
      galaxystate[planet]["link"] = [];
    }
  }

  const waypoints = Object.values(galaxystate).flatMap((x) =>
    x.link.map((y) => ({ from: x.position, to: galaxystate[y].position })),
  );

  let planets = Object.values(current_event.galaxystate);
  console.log(planets);
  let truePlanets = planets.filter((planet) => planet.t[1] > 0);
  let activePlanets = planets.filter((planet) => planet.t[2] > 0);

  let plot = Plot.plot({
    width: width,
    title: " ",
    aspectRatio: 1,
    height: width,
    projection: {
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
    },
    marks: [
      Plot.image([{}], {
        x: () => 0,
        y: () => 0,
        width: width,
        height: width,
        src: backround,
      }),
      Plot.dot(truePlanets, {
        x: (p) => p.position.x * 100,
        y: (p) => p.position.y * -100,
        r: width / 100,
        stroke: (p) => getColor(p.t[1]),
        //fill: p => getColor(p.t[1]),
        strokeWidth: width / 200,
      }),
      Plot.dot(planets, {
        x: (p) => p.position.x * 100,
        y: (p) => p.position.y * -100,
        r: width / 100,
        stroke: (p) => getColor(p.t[0]),
        fill: (p) => getColor(p.t[0]),
        strokeWidth: width / 500,
        opacity: 1.0,
      }),

      Plot.link(waypoints, {
        x1: (p) => p.from.x * 100,
        y1: (p) => p.from.y * -100,
        x2: (p) => p.to.x * 100,
        y2: (p) => p.to.y * -100,
        inset: width / 110,
        strokeWidth: width / 880,
      }),
      showImages
        ? Plot.image(planets, {
            x: (p) => p.position.x * 100,
            y: (p) => p.position.y * -100,
            r: width / 100,
            src: (p) =>
              planetimages["planet_" + p.index + "_rotate.gif"].base64_image,
          })
        : null,
      Plot.text(
        planets,
        {
          x: (p) => p.position.x * 100 - width / 300,
          y: (p) => p.position.y * -100 - width / 300,
          text: (p) =>
            isNaN(Math.round((p.hp / 1000000) * 100 * 10000) / 10000)
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
      Plot.image(activePlanets, {
        x: (p) => p.position.x * 100,
        y: (p) => p.position.y * -100,
        stroke: "#ff0000", // fixed stroke color change
        fill: (p) => getColor(p.t[0]),
        width: width / 25,
        height: width / 25,
        src: (p) => {
          console.log(target[p.t[0]]);
          return target[p.t[0]];
        },
        // strokeWidth: width / 200,
        //symbol: "plus",
      }),

      Plot.tip(
        planets,
        Plot.pointer({
          x: (p) => p.position.x * 100,
          y: (p) => p.position.y * -100,

          title: (p) =>
            [
              `${p.name}\n${p.t[1] ? "under attack" : ""}`,
              `Planet HP: ${
                Math.round((p.hp / 1000000) * 100 * 10000) / 10000
              }`,

              `Decay Rate: ${
                Math.round(((p.r * 60 * 60) / 1000000) * 100 * 10000) / 10000
              }`,
              `Players: ${p.pl}`,
            ].join("\n"),
          fontSize: 10,
        }),
      ),
    ],
    tip: true,
  });

  return plot;
}

export function eList(history, count, parentCard) {
  // Function to create a card element
  function createCard(entry, index, current, parentCard) {
    /*
              <strong>${entry.text}</strong><br>
    <p> <strong>Time:</strong> ${entry.time} UTC </p>
      <p><strong>Type:</strong> $entry.type}</p>
      <p><strong>Planets Affected:</strong> ${entry.planet}</p>
    <strong>Timestamp:</strong> ${entry.timestamp}</strong>*/

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
    /*         if (!['unknown','cstart','cend'].includes(entry.type)) {
          const typeElement = document.createElement("p");
          typeElement.innerHTML = `<strong>Type:</strong> ${entry.type}`;
          parentCard.appendChild(typeElement);
        }
        console.log(current);
        if (entry.planet && entry.planet.length > 0) {
          const planetElement = document.createElement("p");
          planetElement.innerHTML = `<strong>Planets Affected:</strong> ${entry.planet}`;
          parentCard.appendChild(planetElement);
        } */

    return parentCard;
  }

  // Function to create the grid element

  function createGrid(data, count, factorby, parentElement) {
    // Find and clear the 'cont' div

    while (parentElement.firstChild) {
      parentElement.removeChild(parentElement.firstChild);
    }

    // Add new elements into the 'cont' div
    let lower = Math.floor(count / factorby) * factorby;
    for (let index = lower; index < lower + factorby; index++) {
      if (index >= data.events.length) break;
      let event = data.events[index];
      let current = index === count;
      const card = createCard(event, index, current, parentElement);
    }
  }

  let dayv = history.events[count].day;
  // Generate the grid with cards
  createGrid(history, count, 8, parentCard);
  return "";
}

export function list_text(history, count, parentCard) {
  // Function to create a card element
  function createCard(entry_main, parentCard) {
    /*
              <strong>${entry.text}</strong><br>
    <p> <strong>Time:</strong> ${entry.time} UTC </p>
      <p><strong>Type:</strong> $entry.type}</p>
      <p><strong>Planets Affected:</strong> ${entry.planet}</p>
    <strong>Timestamp:</strong> ${entry.timestamp}</strong>*/

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

  function createGrid(data, count, parentElement) {
    // Find and clear the 'cont' div
    while (parentElement.firstChild) {
      parentElement.removeChild(parentElement.firstChild);
    }

    const card = createCard(data.events[count], parentElement);
  }
  // Generate the grid with cards
  createGrid(history, count, parentCard);
  return "";
}

export function ListAll(history, parentCard) {
  function createCard(entry, index, current, parentCard) {
    for (const each of entry.log) {
      if (each.type === "Day Start") {
        parentCard.appendChild(document.createElement("br"));
        const headingElement2 = document.createElement("h2");
        headingElement2.textContent = ` Day:#${entry.day}`;

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

  function createGrid(data, count, factorby, parentElement) {
    // Find and clear the 'cont' div

    while (parentElement.firstChild) {
      parentElement.removeChild(parentElement.firstChild);
    }

    // Add new elements into the 'cont' div
    for (let index = 0; index < data.events.length; index++) {
      let event = data.events[index];
      let current = index === count;
      const card = createCard(event, index, current, parentElement);
    }
  }

  // Generate the grid with cards
  createGrid(history, -1, 8, parentCard);
  return "";
}
