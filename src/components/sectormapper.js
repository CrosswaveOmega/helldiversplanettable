import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";
import * as topojson from "npm:topojson-client";

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
  }

function parseFontSize(fontSize, defaultFontSize = 16) {
let size = 16,
    unit = "px";
("" + fontSize).replace(
    /([\d\.]+)(.*)$/,
    (_, s, u) => ((size = s), (unit = u), "")
);
size = parseFloat(size);
if (unit === "em" || unit === "rem") {
    size *= defaultFontSize;
}
return size;
}
function getFontParams(el = document.body) {
    const fontWeight = getCssStyle(el, "font-weight") || "normal";
    const fontSize = getCssStyle(el, "font-size") || "16px";
    const fontFamily = getCssStyle(el, "font-family") || "Times New Roman";
    return {
        fontSize,
        fontFamily,
        fontWeight
    };
}

function buildCanvasBasedCharSizeEstimator({
    fontSize = "16px",
    fontFamily = "Chakra Petch",
    fontWeight = "normal"
  }) {
    const canvas = document.getElementById("hiddenCanvas");
    const size = parseFontSize(fontSize);
    canvas.width = size * 10;
    canvas.height = size * 2;
    const fontSpec = [fontWeight, fontSize, fontFamily];
    const ctx = canvas.getContext("2d");
    ctx.font = fontSpec.join(" ");
  
    const fontHeight = parseFontSize(fontSize);
    const index = {};
    function measureCharWidth(ch) {
      return (index[ch] = index[ch] || ctx.measureText(ch).width);
    }
    return Object.assign(measureCharWidth, {
      size,
      // Do nothing. This method is added to be compatible with span-based chars estimators
      cleanup: () => {}
    });
  }
  function buildTextWidthEstimatorTable(measureCharWidth, count = 0x20cf) {
    const table = new Float32Array(count);
    for (let i = 0; i < table.length; i++) {
      const ch = String.fromCharCode(i);
      table[i] = measureCharWidth(ch);
    }
    return table;
  }
  function newTableBasedCharWidthEstimator(table) {
    let count = 0;
    let sum = 0;
    for( let i =0; i < table.length; i++) {
      if (table[i] > 0)  {
        sum += table[i];
        count++;
      }
    }
    const avg = count > 0 ? sum / count : 0;
    return (ch) => {
      const code = ch.charCodeAt(0);
      return (code < table.length) ? table[code] : avg;
    }
  }

  function newTextSizeEstimator(measureCharWidth, baseTextSize) {
    baseTextSize = baseTextSize || measureCharWidth.size;
    const table = buildTextWidthEstimatorTable(measureCharWidth);
    const estimate = newTableBasedCharWidthEstimator(table);
    return _newTextSizeEstimator(estimate, baseTextSize);
  
    function _newTextSizeEstimator(measureCharWidth, baseTextSize) {
      const index = {};
      return (str, size = baseTextSize) => {
        let width = str.split("").reduce((w, ch) => {
          let width = index[ch];
          if (!width) {
            width = index[ch] = measureCharWidth(ch);
          }
          return width + w;
        }, 0);
        if (size !== baseTextSize) {
          width *= size / baseTextSize;
        }
        return [width, size];
      };
    }
  }

function splitPlanetName(name, maxLength = 10) {
    /**
     * Splits a planet name at the closest space character to the middle of the name string.
     *
     * @param {string} name - The planet name to split.
     * @param {number} [maxLength=10] - The maximum length before attempting a split.
     * @returns {string} - The possibly split planet name.
     */

    if (name.length <= maxLength) return name;

    const middle = Math.floor(name.length / 2);
    let leftSpace = name.lastIndexOf(" ", middle);
    let rightSpace = name.indexOf(" ", middle);

    //Select the closest space to the center of the string.
    const splitIndex =
        leftSpace === -1 ? rightSpace :
            (rightSpace === -1 || middle - leftSpace <= rightSpace - middle) ? leftSpace : rightSpace;

    if (splitIndex !== -1) {
        return name.slice(0, splitIndex) + "\n" + name.slice(splitIndex + 1);
    }
    return name;
}


function getColor(owner) {
    switch (owner) {
        case 2:
            return "#EF8E20";
        case 3:
            return "#EF2020";
        case 4:
            return "#AC47FE";
        case 1:
            return "#79E0FF";
    }
}

function getSectorColor(owner) {
    switch (owner) {
        case 2:
            return "#EF8E2044";
        case 3:
            return "#EF202044";
        case 4:
            return "#AC47FE44";
        case 1:
            return "#79E0FF22";
    }
}


function DECODE(number) {
    let CO = (number >> 4) & 0b111;
    let AT = (number >> 1) & 0b111;
    let L = number & 0b1;
    return [CO, AT, L];
}

function x_c(x) {
    return x; //*2000+2000;
}
function y_c(y) {
    return -y; //*-2000+2000;
}
function planet_size(p, s1, s2) {
    if (p.index == 0) {
        return s1;
    }
    return s2
}

export function makeplotcurrent_group(
    history,
    gstates,
    planetimages,
    target,
    world,
    getNeighbors,
    { width, htarget, ttarget, atarget, showImages = true },
) {
    let slider = history.events.length - 1;
    let current_event = history.events[slider];

    const small = 48;
    const big = 128;

    let galaxy_time = current_event.eind;

    const sectorValuesMap = new Map();
    const sectorPlanetsMap = new Map();

    let galaxystate = {};
    let inverted={};

    for (const [planet, values] of Object.entries(gstates.gstatic)) {
        galaxystate[planet] = {};
        for (const [key, value] of Object.entries(values)) {
            galaxystate[planet][key] = value;
        }
        // Go through each galaxy state.
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
            if (Object.keys(galaxystate[planet]["link"]).length !== 0) {
                for (const v of gstates.links[String(lastlink)]) {
                    if (!inverted[v]) {
                        inverted[v] = [planet];
                    } else {
                        inverted[v].push(planet);
                    }
                }
                
                
                console.log(planet,galaxystate[planet]["link"]);
            }
        }

        let sector = galaxystate[planet].sector
            .replace(/[^a-zA-Z]/g, "")
            .toLowerCase();

        if (!sectorPlanetsMap.has(sector)) {
            sectorPlanetsMap.set(sector, []);
        }
        galaxystate[planet].id=planet;
        sectorPlanetsMap.get(sector).push(galaxystate[planet]);

        if (!sectorValuesMap.has(sector)) {
            sectorValuesMap.set(sector, getSectorColor(galaxystate[planet].ta[0]));
        }
    }

    function createSubvariantWorld(worldData, sector) {
        let subworld= {
            type: 'FeatureCollection',
            features: worldData.features.filter(
                (feature) =>
                    feature.properties.id.toLowerCase() === sector.toLowerCase()
            )
        };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        subworld.features.forEach(feature => {
            feature.geometry.coordinates.forEach(polygon => {
                polygon.forEach(ring => {
                    let x = ring[0] ;
                    let y = ring[1] ;
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;

                });
            });
        });
        // Expand the bounding box by 0.1 units
        const expandedMinX = minX - 0.08;
        const expandedMinY = minY - 0.08;
        const expandedMaxX = maxX + 0.08;
        const expandedMaxY = maxY + 0.08;

        // Add a new feature representing the expanded bounding box
        const expandedFeature = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [expandedMinX, expandedMinY],
                    [expandedMaxX, expandedMinY],
                    [expandedMaxX, expandedMaxY],
                    [expandedMinX, expandedMaxY],
                    [expandedMinX, expandedMinY] // Close the polygon
                ]]
            },
            properties: {
                id: `${sector}-expanded-bbox`
            }
        };

        subworld.features.push(expandedFeature);
        return {subworld,minX,minY,maxX,maxY};
    }

    // Helper function to check if the text SVG fits within the polygon
    function adjustToSubworldBoundary(centroid, subworldFeatures, specificPolygon, textWidth, textHeight, boundingBox) {
        
        // 1. Determine the clipped polygon using the bounding box
        const visibleRegion = clipPolygonToBoundingBox(specificPolygon, boundingBox);
        // 2. Calculate the centroid of the visible region as the initial assumption
        const initialCentroid = d3.polygonCentroid(visibleRegion);
    
        let closestPoint = { x: initialCentroid[0], y: initialCentroid[1] };
        let minDistance = Infinity;
    
        // 3. Refine the closest point to ensure it fits the constraints
        subworldFeatures.forEach(feature => {
            feature.geometry.coordinates.forEach(polygon => {
                polygon.forEach(ring => {
                    const x = ring[0];
                    const y = ring[1];
    
                    // Calculate distance to the initial centroid
                    const distance = Math.sqrt((initialCentroid[0] - x) ** 2 + (initialCentroid[1] - y) ** 2);
                    
                    // Update the closest point if it's closer
                    if (distance < minDistance) {
                        // Ensure the point is inside the specific polygon
                        const pointInside = d3.polygonContains(specificPolygon, [x, y]);
    
                        // Check if the text fits inside the polygon
                        const textFits = doesTextFit([x, y], specificPolygon, textWidth, textHeight);
    
                        if (pointInside && textFits) {
                            minDistance = distance;
                            closestPoint = { x, y };
                        }
                    }
                });
            });
        });
    
        return closestPoint;
    }
    
    function clipPolygonToBoundingBox(polygon, boundingBox) {
        const [minX, minY, maxX, maxY] = boundingBox;
        // Initialize an empty array for clipped rings
        const clippedRings = [];
        // Iterate over the polygon's rings
        polygon.forEach(ring => {
            const x = ring[0];
            const y = ring[1];
            // Check if the coordinate is within the bounding box
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                clippedRings.push([x, y]);
            }
        });
        // Flatten the clipped rings and remove duplicates to form a single visible region
        const visibleRegion = [];
        clippedRings.forEach(ring => {
            const [x, y] = ring;
            visibleRegion.push([x, y]);
            
        });
        return visibleRegion;
    }
    
    
    // Helper function to check if the text SVG fits within the polygon
    function doesTextFit(point, polygon, textWidth, textHeight) {
        const [x, y] = point;
        // Define the bounding box of the text
        const textBoundingBox = [
            [x - textWidth / 2, y - textHeight / 2], // Top-left corner
            [x + textWidth / 2, y - textHeight / 2], // Top-right corner
            [x + textWidth / 2, y + textHeight / 2], // Bottom-right corner
            [x - textWidth / 2, y + textHeight / 2], // Bottom-left corner
        ];
    
        // Check if all corners of the text bounding box are within the polygon
        return textBoundingBox.every(([bx, by]) => d3.polygonContains(polygon, [bx, by]));
    }


    function createSubvariantWorldNeighbors(worldData, sector) {
        const sectors=getNeighbors();
        let mysectors= sectors[sector]?.['neighbors'];
        let main = mysectors.map(sector => sector.toLowerCase());
        return {
            type: 'FeatureCollection',
            features: worldData.features.filter(
                (feature) =>
                    main.includes(feature.properties.id.toLowerCase())
            )
        };
        
    }
    const canvasBasedEstimator = newTextSizeEstimator(
        buildCanvasBasedCharSizeEstimator({
            fontSize:"16px",
            fontFamily: "Chakra Petch",
            fontWeight: "normal"
          })
      )
    width = 4000;
    const sectordata=getNeighbors();
    const svgsBySector = Array.from(sectorPlanetsMap.entries()).map(([sector, planets]) => {
        console.log(sector, planets);
        let sname=sectordata[sector]?.['name'];
    
        let {subworld,minX,minY,maxX,maxY} = createSubvariantWorld(world, sector);

        const boundingBox = [minX-0.05, minY-0.05,maxX+0.05,maxY+0.05]; // Define the visible region

        let neighbors = createSubvariantWorldNeighbors(world, sector);
        //console.log(subworld);
        let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
        
        subworld.features.forEach(feature => {
            feature.geometry.coordinates.forEach(polygon => {
                polygon.forEach(ring => {
                    let x = ring[0] + 1.0;
                    let y = ring[1] + 1.0;
                    if (x < minx) minx = x;
                    if (y < miny) miny = y;
                    if (x > maxx) maxx = x;
                    if (y > maxy) maxy = y;
                });
            });
        });
        let sx = maxx - minx;
        let sy = maxy - miny;
        let newwidth = sx * 2000;
        let newheight = sy * 2000;
    
        

        // Calculate adjusted positions for the neighbor labels
        const neighborLabels = neighbors.features.map(feature => {
            let name=sectordata[feature.properties.id]?.['name'];
            if (name=="lestrade"){
                name="L'estrade";
            }

            const neighborCentroid = d3.polygonCentroid(feature.geometry.coordinates[0]);
            let canvasBasedSize = canvasBasedEstimator(name, 20)
            console.log(canvasBasedSize);
            const w=canvasBasedSize[0];
            const h=canvasBasedSize[1];
            
            let adjustedPoint = adjustToSubworldBoundary(neighborCentroid, subworld.features, feature.geometry.coordinates[0], w, h,boundingBox);

            console.log(sector,name,adjustedPoint.x,adjustedPoint.y);
            if ((sector==='barnard') & (name==="Korpus")){
                adjustedPoint={x: 0.2855493793295967,y:0.05285379798322923};
            }
            if ((sector==='ferris') & (name==="Farsight")){
                 
                adjustedPoint={x: 0.6247790551508352,y:0.5500687472882244};
            }
            if ((sector==='celeste') & (name==="Orion")){
                 
                adjustedPoint={x: 0.3743886719649124,y:-0.20093968082627525};
            }
            if ((sector==='morgon') & (name==="Barnard")){
                 
                adjustedPoint={x: 0.2109580614608652,y:0.17985028718104656};
            }
            if ((sector==='morgon') & (name==="Gallux")){
                 
                adjustedPoint={x: 0.3585283535006793,y:0.3193364811929804};
            }
            if ((sector==='mirin') & (name==="L'estrade")){
                 
                adjustedPoint={x: 0.6844251189735001,y:-0.45441186736502603};
            }
            if ((sector==='talus') & (name==="Arturion")){
                 
                adjustedPoint={x: 0.024402318250148,y:-0.5131302937124};
            }
            if ((sector==='rictus') & (name==="Gallux")){
                 
                adjustedPoint={x: 0.2964545125672656,y:0.4581149513523135};
            }
            if ((sector==='marspira') & (name==="Talus")){
                adjustedPoint={x:-0.10942478093125588,y: -0.409411681906625};
            }
            if ((sector==='severin') & (name==="Quintus")){
                adjustedPoint={x:-0.8371706871308419,y: 0.4085821586165647};
            }
            if ((sector==='nanos') & (name==="Andromeda")){
                adjustedPoint={x:-0.5186985250723346,y: -0.3181681282684363};
            }
            if ((sector==='nanos') & (name==="Marspira")){
                adjustedPoint={x:-0.3059303370122175,y: -0.2005397790538078};
            }
            if ((sector==='arturion') & (name==="L'estrade")){
                adjustedPoint={x: 0.42914883500000156,y: -0.6952567170833354};
            }
            if ((sector==='falstaff') & (name==="L'estrade")){
                adjustedPoint={x: 0.4831179295924314,y: -0.687141669593459};
            }
            if ((sector==='draco') & (name==="Sten")){
                adjustedPoint={x: 0.80535170204089,y: -0.2000};
            }
            if ((sector==='sagan') & (name==="Idun")){
                adjustedPoint={x:-0.30947081346862976,y: 0.010743331002292146};
            }
            if ((sector==='trigon') & (name==="Ymir")){
                
                adjustedPoint={x:-0.83505112622816 ,y:-0.38001225685132956};
            }
            if ((sector==='farsight') & (name==="Leo")){
                
                adjustedPoint={x:0.600000148519362 ,y:0.5034834964352337};
            }
            if ((sector==='omega') & (name==="Akira")){
                
                adjustedPoint={x:-0.250647453549844 ,y:0.6997365805779193};
            } 
            if ((sector==='omega') & (name==="Rigel")){
                
                adjustedPoint={x:0.2638976736561777  ,y:0.8000081722036326};
            } 
            if ((sector==='borgus') & (name==="Jin Xi")){
                
                adjustedPoint={x:0.7141926133837719  ,y:-0.01021505921226957};
            } 
            if ((sector==='ursa') & (name==="Korpus")){
                
                adjustedPoint={x:0.4095815360018975  ,y:0.0853370811515971};
            } 
            if ((sector==='hanzo') & (name==="Rigel")){
                
                adjustedPoint={x:0.145148081329758  ,y:0.7098383145419032};
            } 
            if ((sector==='guang') & (name==="Saleria")){
                
                adjustedPoint={x:-0.178881148104486  ,y:0.3410514762206611};
            } 
            if ((sector==='theseus') & (name==="Xzar")){
                
                adjustedPoint={x:-0.7078115144040531  ,y:-0.02044799070354};
            }  
            if ((sector==='xzar') & (name==="Trigon")){
                
                adjustedPoint={x: -0.754831909874650  ,y:-0.214635451037098};
            }  
            if ((sector==='hydra') & (name==="Lacaille")){
                 
                adjustedPoint={x: -0.3079742584903473  ,y:-0.5392571306823492};
            }
            if ((sector==='tanis') & (name==="Arturion")){
                 
                adjustedPoint={x: 0.20377180869076983  ,y:-0.6311779639313038};
            }  
            if ((sector==='andromeda') & (name==="Hydra")){
                 
                adjustedPoint={x: -0.3220581165147498 ,y:-0.3498669382106809};
            }  




            const labelPosition = adjustedPoint;//calculateLabelPosition(link);

            
            return {
                x: labelPosition.x,
                y: labelPosition.y,
                name: name,
            };
        });

        console.log(neighborLabels);
    
        return Plot.plot({
            ariaLabel: sname,
            width: newwidth,
            aspectRatio: 1,
            height: newheight,
            projection: { type: "identity", domain: subworld },
            marks: [
                Plot.geo(subworld, {
                    stroke: "#c0c0c0",
                    strokeWidth: width / 1000,
                }),
                Plot.geo(neighbors, {
                    stroke: "#dddddd",
                    strokeWidth: width / 10000,
                }),
                Plot.dot(planets, {
                    x: (p) => x_c(p.position.x),
                    y: (p) => y_c(p.position.y),
                    r: 5,
                    fill: sectorValuesMap.get(sector),
                    opacity: 1.0,
                }),
                Plot.link(
                    planets.flatMap((p) => [
                        // Original links from the planet
                        ...p.link.map((y) => ({
                            from: p.position,
                            to: galaxystate[y]?.position,
                        })),
                        // Inverted links pointing to the planet
                        ...(inverted[p.id] || []).map((inv) => ({
                            from: galaxystate[inv]?.position,
                            to: p.position,
                        })),
                    ]),
                    {
                        x1: (p) => x_c(p.from.x),
                        y1: (p) => y_c(p.from.y),
                        x2: (p) => x_c(p.to.x),
                        y2: (p) => y_c(p.to.y),
                        stroke: "#CCCCCC",
                        inset: width / 110,
                        strokeWidth: width / 2000,
                    },
                ),
                
                
                
                showImages
                    ? Plot.image(planets, {
                        x: (p) => x_c(p.position.x),
                        y: (p) => y_c(p.position.y),
                        width: (p) => planet_size(p, big, small),
                        height: (p) => planet_size(p, big, small),
                        src: (p) =>
                            planetimages["" + p.biome + ".webp"].base64_image,
                    })
                    : null,
                Plot.text(planets, {
                    x: (p) => x_c(p.position.x),
                    y: (p) => y_c(p.position.y),
                    text: (p) => splitPlanetName(p.name),
                    dy: 32,
                    textAnchor: "bottom",
                    fill: "white",
                    stroke: "black",
                    fontSize: 20,
                    strokeWidth: 3,
                }),
                // Add neighbor labels
                Plot.text(neighborLabels, {
                    x: (n) => (n.x),
                    y: (n) => (n.y),
                    text: (n) => n.name,
                    //dy: -16, // Adjust for better visibility
                    textAnchor: "middle",
                    fill: "#FFD700",
                    fontSize: 20,
                    stroke: "#000",
                    strokeWidth: 2,
                }),
            ],
        });
    });
    

    return svgsBySector;
}
