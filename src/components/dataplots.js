import * as Plot from "npm:@observablehq/plot";
function getTextSize(text, fontSize = "12px", fontFamily = "sans-serif") {
    // eslint-disable-next-line no-undef
    const context = document.createElement("canvas").getContext("2d");
    context.font = `${fontSize} ${fontFamily}`;
    const { width } = context.measureText(text);
    return { width, height: parseInt(fontSize, 10) };
}

function TimeTrack(data, { width } = {}) {
    let vals = Object.values(data);
    vals.sort((a, b) => a.timestamp - b.timestamp);

    let differences = vals.map((d, i) => {
        if (i === 0)
            return {
                ts: d.timestamp,
                date: new Date(d.timestamp * 1000).toLocaleString(),
                timestamp: d.timestamp,
                diff: 0,
            };
        return {
            timestamp: d.timestamp,
            date: new Date(d.timestamp * 1000).toLocaleString(),
            ts: d.timestamp - vals[i - 1].timestamp,
            diff: d.timestamp - vals[i - 1].timestamp,
            diffa: d.time - vals[i - 1].time,
            diff2:
                d.time -
                vals[i - 1].time -
                (d.timestamp - vals[i - 1].timestamp),
        };
    });

    differences.shift();

    let plotnew = Plot.plot({
        x: {
            axis: "bottom",
            label: null,
            tickFormat: ".0e",
        },
        title: "Time Differences",
        width,
        marks: [
            // Plot.line(differences, {
            //     x: "timestamp",
            //     y: "diff",
            //     title: (d) => `timestamp: ${d.timestamp}\ndiff: ${d.diff}`, // Add tooltip
            // }),
            // Plot.dot(differences, {
            //     x: "timestamp",
            //     y: "diff",
            //     title: (d) => `timestamp: ${d.timestamp}\ndiff: ${d.diff}`, // Add tooltip for markers
            //     tip: true,
            // }),

            Plot.line(differences, {
                x: "timestamp",
                y: "diff2",
                title: (d) =>
                    `timestamp: ${d.date}\n offset: ${d.diff2}\n game_diff: ${d.diffa}\n tsdiff: ${d.diff}`, // Add tooltip
                stroke: "blue",
                strokeOpacity: 0.7,
            }),
            Plot.dot(differences, {
                x: "timestamp",
                y: "diff2",
                title: (d) =>
                    `timestamp: ${d.date}\n offset: ${d.diff2}\n game_diff: ${d.diffa}\n tsdiff: ${d.diff}`, // Add tooltip
                tip: true,
                r: 2, // Make the dot small
                stroke: "blue",
                fill: null,
                fillOpacity: 0.7,
            }),
        ],
    });
    return plotnew;
}
function bugKills(data, { width } = {}) {
    let plotnew = Plot.plot({
        x: {
            axis: "bottom",
            label: null,
            tickFormat: ".0e",
        },
        title: "Kills",
        width,
        marks: [
            Plot.barX(data, {
                y: "planet_name",
                x: "bug_kills",
                sort: { y: "x", limit: 15, reverse: true },
                tip: true,
            }),
        ],
    });
    return plotnew;
}

function botKills(data, { width } = {}) {
    let plotnew = Plot.plot({
        x: {
            axis: "bottom",
            label: null,
            tickFormat: ".0e",
        },
        title: "Kills",
        width,
        marks: [
            Plot.barX(data, {
                y: "planet_name",
                x: "bot_kills",
                sort: { y: "x", limit: 15, reverse: true },
                tip: true,
            }),
        ],
    });
    return plotnew;
}

function allKills(data, { width, limitby = 32, factcolor } = {}) {
    // Measure the largest text size
    let labels = data.map((planet) => planet.planet_name);
    let textSizes = labels.map((label) => getTextSize(label));
    console.log(textSizes);
    let maxTextWidth = Math.max(...textSizes.map((size) => size.width));

    let plotnew = Plot.plot({
        grid: true,
        marginLeft: maxTextWidth, // Adjust left margin to ensure y-axis labels fit within bounds
        x: {
            axis: "bottom",
            label: null,
            tickFormat: ".0e",
        },
        y: {
            label: null,
        },
        title: "Enemy kills per planet",

        color: { ...factcolor, legend: true },
        width,
        marks: [
            Plot.barX(data, {
                y: "planet_name",
                x: "kills",
                fill: "front",
                sort: { y: "x", limit: limitby, reverse: true },
                tip: true,
            }),
        ],
    });
    return plotnew;
}
function allDeaths(data, { width, limitby = 32, factcolor } = {}) {
    // Measure the largest text size
    let labels = data.map((planet) => planet.planet_name);
    let textSizes = labels.map((label) => getTextSize(label));
    console.log(textSizes);
    let maxTextWidth = Math.max(...textSizes.map((size) => size.width));

    let plotnew = Plot.plot({
        grid: true,
        marginLeft: maxTextWidth, // Adjust left margin to ensure y-axis labels fit within bounds
        x: {
            axis: "bottom",
            label: null,
            tickFormat: ".0e",
        },
        y: {
            label: null,
        },
        title: "Helldiver deaths per planet",

        color: { ...factcolor, legend: true },
        width,
        marks: [
            Plot.barX(data, {
                y: "planet_name",
                x: "deaths",
                fill: "front",
                sort: { y: "x", limit: limitby, reverse: true },
                tip: true,
            }),
        ],
    });
    return plotnew;
}

function kdRatio(data, { width, limitby = 32, factcolor } = {}) {
    // Measure the largest text size
    let labels = data.map((planet) => planet.planet_name);
    let textSizes = labels.map((label) => getTextSize(label));
    console.log(textSizes);
    let maxTextWidth = Math.max(...textSizes.map((size) => size.width));

    let plotnew = Plot.plot({
        grid: true,
        marginLeft: maxTextWidth, // Adjust left margin to ensure y-axis labels fit within bounds
        x: {
            axis: "bottom",
            label: null,
            tickFormat: ".0e",
        },
        y: {
            label: null,
        },
        title: "K:D ratio per planet",

        color: { ...factcolor, legend: true },
        width,
        marks: [
            Plot.barX(data, {
                y: "planet_name",
                x: "KTD",
                fill: "front",
                sort: { y: "x", limit: limitby, reverse: true },
                tip: true,
            }),
        ],
    });
    return plotnew;
}

function missionsWon(data, { width, limitby = 32, factcolor } = {}) {
    let labels = data.map((planet) => planet.planet_name);
    let textSizes = labels.map((label) => getTextSize(label));
    console.log(textSizes);
    let maxTextWidth = Math.max(...textSizes.map((size) => size.width));
    let plotnew = Plot.plot({
        marginLeft: maxTextWidth, // Adjust left margin to ensure y-axis labels fit within bounds
        x: {
            axis: "bottom",
        },
        y: {
            label: null,
        },
        title: "Missions Won",
        width,

        color: { ...factcolor, legend: true },
        marks: [
            Plot.barX(data, {
                y: "planet_name",
                x: "missionsWon",
                fill: "front",
                sort: { y: "x", limit: limitby, reverse: true },
                tip: true,
            }),
        ],
    });
    return plotnew;
}

function missionsLost(data, { width, limitby = 32, factcolor } = {}) {
    let labels = data.map((planet) => planet.planet_name);
    let textSizes = labels.map((label) => getTextSize(label));
    console.log(textSizes);
    let maxTextWidth = Math.max(...textSizes.map((size) => size.width));
    let plotnew = Plot.plot({
        marginRight: maxTextWidth - 100, // Adjust left margin to ensure y-axis labels fit within bounds
        x: {
            axis: "bottom",
        },
        y: {
            label: null,
            axis: "right",
        },
        title: "Missions Lost",
        width,

        color: { ...factcolor, legend: true },
        marks: [
            Plot.barX(data, {
                y: "planet_name",
                x: "missionsLost",
                fill: "front",
                sort: { y: "x", limit: limitby, reverse: true },
                tip: true,
            }),
        ],
    });
    return plotnew;
}

function missionsWonAndLost(
    data2,
    { width, limitby = 32, front_filter, factcolor, title, sortv = true } = {},
) {
    // Function to measure text size

    // Measure the largest text size
    let data = data2.filter((d) => front_filter.includes(d.front));
    let labels = data.map((planet) => planet.planet_name);
    let textSizes = labels.map((label) => getTextSize(label));
    let maxTextWidth = Math.max(...textSizes.map((size) => size.width));

    // Adjust the left margin based on the largest text size
    let marginLeft = maxTextWidth + 10; // Adding some extra space for better visualization

    // Transform data to include separate entries for missionsWon and missionsLost
    let transformedData = [];
    data.forEach((d) => {
        if (d.missionsWon + d.missionsLost > 0) {
            transformedData.push({
                ...d,
                type: "missionsWon",
                value: d.missionsWon,
                color: d.front,
                offset: d.missionsWon,
            });
            transformedData.push({
                ...d,
                type: "missionsLost",
                value: d.missionsLost,
                color: d.front + "L",
                offset: d.missionsWon + d.missionsLost,
            });
        }
    });

    // Create the plot with adjusted margins
    let plotnew = Plot.plot({
        marginLeft, // Adjust left margin to ensure y-axis labels fit within bounds
        grid: true,
        x: {
            axis: "bottom",
        },
        y: {
            label: null,
        },
        title: "Missions Won and Lost",
        width, // Set the width of the plot
        color: { ...factcolor, legend: true }, // Use factcolor for fill colors
        marks: [
            Plot.barX(transformedData, {
                y: "planet_name",
                x: "value",
                fill: "color",
                stroke: (d) =>
                    d.type === "missionsWon" ? "#1f77b4" : "#ff7f0e", // Outline color based on type
                sort: { y: "x", limit: limitby, reverse: sortv },
                tip: true,
                title: (d) => `${d.type}: ${d.value}`,
            }),
        ],
    });

    return plotnew;
}

function genericGraph(
    data2,
    column,
    {
        width,
        limitby = 32,
        front_filter,
        factcolor,
        title,
        titleFormat,
        sortv = true,
        showtext = true,
    } = {},
) {
    // Measure the largest text size\
    let data = data2.filter((d) => front_filter.includes(d.front));
    data = data.filter((d) => d[column] > 0);
    let labels = data.map((planet) => planet.planet_name);
    let textSizes = labels.map((label) => getTextSize(label));

    let maxTextWidth = Math.max(...textSizes.map((size) => size.width));

    let plotnew = Plot.plot({
        grid: true,
        marginLeft: maxTextWidth, // Adjust left margin to ensure y-axis labels fit within bounds
        x: {
            axis: "bottom",
            label: null,
        },
        y: {
            label: null,
        },
        title,

        color: { ...factcolor, legend: true },
        width,
        marks: [
            Plot.barX(data, {
                y: "planet_name",
                x: column,
                fill: "front",
                sort: { y: "x", limit: limitby, reverse: sortv },
                tip: true,
                channels: {
                    year: {
                        value: {
                            transform: (data) =>
                                data.map((d) => {
                                    if (titleFormat) {
                                        const customTitle = titleFormat.replace(
                                            /\[(\w+)\]/g,
                                            (_, columnName) => d[columnName],
                                        );
                                        return `${customTitle}`;
                                    }
                                    return "";
                                }),
                            label: "",
                        },
                    },
                },
            }),
            Plot.text(
                data,
                {
                    y: "planet_name",
                    x: column,
                    text: (d) => {
                        if (showtext) {
                            return d[column].toFixed(1);
                        } else {
                            return "";
                        }
                    },
                    dx: 15, //(d) => getTextSize(d[column].toFixed(1)).width / 2,
                    lineAnchor: "bottom",
                },
                { showtext },
            ),
        ],
    });
    return plotnew;
}

function BiomeStats(
    data,
    mode,
    column,
    {
        width,
        limitby = 32,
        threshold = 20,
        biocolors,
        title = "Biome stats",
    } = {},
) {
    // Function to measure text size

    // Measure the largest text size
    let labels = data.map((planet) => planet[column]);
    let textSizes = labels.map((label) => getTextSize(label));
    let maxTextWidth = Math.max(...textSizes.map((size) => size.width));
    let maxTextHeight = Math.max(...textSizes.map((size) => size.height));

    // Adjust the left margin based on the largest text size
    let marginLeft = maxTextWidth + 10; // Adding some extra space for better visualization

    let transformedData = [];
    for (const entry of data) {
        let missions = Math.max(entry.missionsWon + entry.missionsLost, 0);
        let killsum = Math.max(entry.bot_kills + entry.bug_kills, 0);
        if (missions < threshold) {
            continue;
        }
        let deaths = entry.deaths;
        if (mode == 0) {
            transformedData.push({
                order: missions,
                disp: "",
                biome: entry[column],
                key: "missionsWon",
                value: entry.missionsWon,
            });
            transformedData.push({
                order: missions,
                disp: "",
                biome: entry[column],
                key: "missionsLost",
                value: entry.missionsLost,
            });
        }
        if (mode == 1) {
            transformedData.push({
                order: killsum,
                disp: `${entry.bot_kills}`,
                biome: entry[column],
                key: "Bot kills",
                value: entry.bot_kills,
            });
            transformedData.push({
                order: killsum,
                disp: `${entry.bug_kills}`,
                biome: entry[column],
                key: "Bug kills",
                value: entry.bug_kills,
            });
        }
        if (mode == 2) {
            transformedData.push({
                order: deaths,
                disp: `${entry.deaths}`,
                biome: entry[column],
                key: "deaths",
                value: entry.deaths,
            });
            transformedData.push({
                order: deaths,
                disp: `${entry.friendlies}`,
                biome: entry[column],
                key: "friendly",
                value: entry.friendlies,
            });
        }
        if (mode == 3) {
            transformedData.push({
                order: entry.count,
                disp: `${entry.deaths}/${entry.missions}`,
                biome: entry[column],
                key: `deaths per mission`,
                value: entry.DPM,
            });
        }
        if (mode == 4)
            transformedData.push({
                order: entry.count,
                disp: `${entry.killsum}/${entry.missions}`,
                biome: entry[column],
                key: `kills per mission`,
                value: entry.KPM,
            });
        if (mode == 5)
            transformedData.push({
                order: entry.count,
                disp: `${entry.killsum}/${entry.deaths}`,
                biome: entry[column],
                key: `kills to deaths`,
                value: entry.KTD,
            });
        if (mode == 6)
            transformedData.push({
                order: entry.count,
                disp: `${entry.missionsWon}/${entry.missionsLost}`,
                biome: entry[column],
                key: `wins to losses`,
                value: entry.WTL,
            });
    }
    transformedData.sort((a, b) => b.order - a.order);
    if ([3, 4, 5, 6].includes(mode)) {
        let plotnew = Plot.plot({
            marginTop: maxTextHeight + maxTextWidth, // Adjust top margin to ensure x-axis labels fit within bounds
            marginBottom: maxTextHeight,
            grid: true,
            y: {
                axis: "left",
                label: null,
            },
            fx: {
                label: null,
                axis: "bottom",
                fill: "color",
            },
            x: {
                label: null,
                axis: "top",
                tickRotate: -90,
                tickPadding: 10,
            },
            title,
            width, // Set the width of the plot
            color: { ...biocolors, legend: false }, // Use factcolor for fill colors
            marks: [
                Plot.barY(transformedData, {
                    y: "value",
                    x: "biome",
                    fx: "key",
                    fill: "biome",
                    //stroke: d => d.key === "missionsWon" ? "#1f77b4" : "#ff7f0e",  // Outline color based on type
                    //sort: {x: null, color: null, fx: {value: "-x", reduce: "mean"}},
                    tip: true,
                    text: (d) => d.value.toFixed(1),
                    dy: 2,
                    lineAnchor: "top",
                    title: (d) => `${d.biome} ${d.key}: ${d.disp} (${d.value})`,
                }),
                Plot.text(transformedData, {
                    x: "biome",
                    fx: "key",
                    y: "value",
                    text: (d) => d.value.toFixed(1),
                    dy: -6,
                    lineAnchor: "bottom",
                }),
            ],
        });
        return plotnew;
    }
    let plotnew = Plot.plot({
        marginLeft, // Adjust left margin to ensure y-axis labels fit within bounds
        marginRight: marginLeft,
        grid: true,
        x: {
            axis: "bottom",
            label: null,
            tickFormat: ".0e",
        },
        fy: {
            label: null,
            axis: "left",
            domain: transformedData
                .sort((a, b) => b.order - a.order)
                .map((d) => d.biome),
            fill: "color",
        },
        y: { label: null, axis: "right" },
        title,
        width, // Set the width of the plot
        color: { ...biocolors, legend: false }, // Use factcolor for fill colors
        marks: [
            Plot.barX(transformedData, {
                y: "key",
                x: "value",
                fy: "biome",
                fill: "biome",
                stroke: (d) =>
                    d.key === "missionsWon" ? "#1f77b4" : "#ff7f0e", // Outline color based on type
                sort: {
                    y: null,
                    color: null,
                    fy: { value: "-y", reduce: "mean" },
                },
                tip: true,
                title: (d) => `${d.biome} ${d.key}: ${d.disp} (${d.value})`,
            }),
        ],
    });
    return plotnew;
}

function BiomeData(data, column, parentElement) {
    // Sum of all entries with the set biome value
    let summedData = data.reduce((acc, entry) => {
        if (!acc[entry[column]]) {
            acc[entry[column]] = { ...entry, count: 1 };
        } else {
            acc[entry[column]].missionsWon += entry.missionsWon;
            acc[entry[column]].missionsLost += entry.missionsLost;
            acc[entry[column]].bot_kills += entry.bot_kills;
            acc[entry[column]].bug_kills += entry.bug_kills;
            acc[entry[column]].deaths += entry.deaths;
            acc[entry[column]].friendlies += entry.friendlies;
            acc[entry[column]].count += 1;
        }
        return acc;
    }, {});

    // Function to create a card element
    function createCard(entry) {
        const card = document.createElement("div");
        card.className = "card";

        const title = document.createElement("h2");
        title.appendChild(document.createTextNode(`${entry[column]} Stats`));
        card.appendChild(title);

        const missionsWon = document.createElement("span");
        missionsWon.appendChild(
            document.createTextNode(
                `Missions Won: ${entry.missionsWon.toLocaleString("en-US")}`,
            ),
        );
        card.appendChild(missionsWon);
        card.appendChild(document.createElement("br"));

        const missionsLost = document.createElement("span");
        missionsLost.appendChild(
            document.createTextNode(
                `Missions Lost: ${entry.missionsLost.toLocaleString("en-US")}`,
            ),
        );
        card.appendChild(missionsLost);
        card.appendChild(document.createElement("br"));

        const botKills = document.createElement("span");
        botKills.appendChild(
            document.createTextNode(
                `Bot Kills: ${entry.bot_kills.toLocaleString("en-US")}`,
            ),
        );
        card.appendChild(botKills);
        card.appendChild(document.createElement("br"));

        const bugKills = document.createElement("span");
        bugKills.appendChild(
            document.createTextNode(
                `Bug Kills: ${entry.bug_kills.toLocaleString("en-US")}`,
            ),
        );
        card.appendChild(bugKills);
        card.appendChild(document.createElement("br"));

        const deaths = document.createElement("span");
        deaths.appendChild(
            document.createTextNode(
                `Deaths: ${entry.deaths.toLocaleString("en-US")}`,
            ),
        );
        card.appendChild(deaths);
        card.appendChild(document.createElement("br"));

        const friendlies = document.createElement("span");
        friendlies.appendChild(
            document.createTextNode(
                `Friendlies: ${entry.friendlies.toLocaleString("en-US")}`,
            ),
        );
        card.appendChild(friendlies);
        card.appendChild(document.createElement("br"));

        const count = document.createElement("span");
        count.appendChild(
            document.createTextNode(
                `Count: ${entry.count.toLocaleString("en-US")}`,
            ),
        );
        card.appendChild(count);

        return card;
    }

    // Function to create the grid element
    function createGrid(data, parentElement) {
        Object.values(summedData).forEach((entry) => {
            const card = createCard(entry);
            parentElement.appendChild(card);
        });
    }

    // Generate the grid with cards
    createGrid(data, parentElement);
}

export {
    bugKills,
    botKills,
    allKills,
    allDeaths,
    kdRatio,
    genericGraph,
    missionsWon,
    missionsLost,
    missionsWonAndLost,
    BiomeStats,
    BiomeData,
    TimeTrack,
};
