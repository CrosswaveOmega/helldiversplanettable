import { format_minutes } from "./battle_tracker.js";
function make_planet_battle_list(planets) {
    /**
     * Create an unordered list of planets with their respective events.
     * @param {Array} planets - An array of planet objects.
     * @returns {HTMLElement} - A UL element containing planet and event details.
     */
    const planetList = document.createElement("ul");
    for (const planet of planets) {
        const planetItem = document.createElement("li");
        const planetHeader = document.createElement("h3");
        const minutes=format_minutes(planet.mins);
        planetHeader.textContent = `${planet.name}, ${minutes}`;
        planetItem.appendChild(planetHeader);

        const eventList = document.createElement("ul");
        for (const event of planet.events) {
            const eventItem = document.createElement("li");
            let eventText = `${event.event}`;
            if (event.time) {
                eventText += ` (${event.time} UTC)`;
            }
            eventItem.textContent = eventText;
            eventList.appendChild(eventItem);
        }

        planetItem.appendChild(eventList);
        planetList.appendChild(planetItem);
    }
    return planetList;
}

export function BattleList(
    history,
    showEvt,
    noSectors,
    parentContainer,
    use,
    funct,
    sectorData,
) {
    /**
     * Generate and populate a battle list for a given sector.
     * @param {DaysObject} history - Historical data.
     * @param {boolean} showEvt - Flag to show events.
     * @param {HTMLElement} parentContainer - The parent container to append the battle list.
     * @param {int} use - 1 if the battlelist should only show the ongoing planet battles, 0 otherwise
     * @param {Function} funct - Function to distinct and filter data.
     * @param {Object} sectorData - Data of the sectors.
     * @returns {Array} - An empty array.
     */

    function generate_battle_sublist(sector, index, current, parentContainer) {
        let planets = Object.values(sector.planets);
        if (planets.length === 0) {
            return parentContainer;
        }

        const sectorHeader = document.createElement("h2");
        sectorHeader.textContent = `${sector.name}`;
        parentContainer.appendChild(sectorHeader);
        let planetList = make_planet_battle_list(planets);

        parentContainer.appendChild(planetList);
        return parentContainer;
    }

    //Create list of unique battles.
    let distinctElements = funct(history, showEvt, sectorData);
    if (use == 0) {
        distinctElements = distinctElements.planetTypes;
    } else {
        distinctElements = distinctElements.ongoing;
    }

    function populateGrid(planetData, parentElement) {
        // Remove all current children of the parent element
        while (parentElement.firstChild) {
            parentElement.removeChild(parentElement.firstChild);
        }

        // Generate battle sublists for each sector
        let data = Object.values(planetData);
        data.sort((a, b) => a.mins - b.mins);
        
        for (let index = 0; index < data.length; index++) {
            console.log(index,data[index])
            let sector = data[index];
            let current = index === 0;
            generate_battle_sublist(sector, index, current, parentElement);
        }
    }
    

    function populateGridPlanets(planetData, parentElement) {
        // Remove all current children of the parent element
        while (parentElement.firstChild) {
            parentElement.removeChild(parentElement.firstChild);
        }

        // Generate battle sublists for each sector
        let data = Object.values(planetData);
        let planets_list=[];
        for (const sector of data){
            console.log(sector.planets);
            let planets = Object.values(sector.planets);
            if (planets.length !== 0) {
                for (const planet of planets){
                    console.log(planet);
                    planets_list.push(planet);
                }
            }
        }
        planets_list.sort((a, b) => a.mins - b.mins);
        console.log(planets_list);
        let planetList = make_planet_battle_list(planets_list);

        parentContainer.appendChild(planetList);        
    }
    
    if (noSectors){ 
        populateGridPlanets(distinctElements, parentContainer);
    }else{    populateGrid(distinctElements, parentContainer);}
    return [];
}

export function SectorBattleList(
    history,
    showEvt,
    parentContainer,
    use,
    funct,
    sectorData,
) {
    /**
     * Generate and populate a sector battle list with events and sub-events.
     * @param {Object} history - Historical data.
     * @param {boolean} showEvt - Flag to show events.
     * @param {HTMLElement} parentContainer - The parent container to append the battle list.
     * @param {int} use - 1 if the battlelist should only show the ongoing planet battles, 0 otherwise
     * @param {Function} funct - Function to distinct and filter data.
     * @param {Object} sectorData - Data of the sectors.
     * @returns {Array} - An empty array.
     */

    function generate_battlelist_for_sector(
        sector,
        index,
        current,
        parentContainer,
    ) {
        //This is specifically for the sector battle tracker.
        if (sector.events.length === 0) {
            return parentContainer;
        }

        const sectorHeader = document.createElement("h2");
        const minutes=format_minutes(sector.mins);
        sectorHeader.textContent = `${sector.name}, accumulated ${minutes}`;
        
        parentContainer.appendChild(sectorHeader);

        const eventList = document.createElement("ol");
        for (const event of sector.events) {
            const eventItem = document.createElement("li");
            let eventText = `${event.event}`;
            if (event.time) {
                eventText += ` (${event.time} UTC)`;
            }
            eventItem.textContent = eventText;
            let planets = Object.values(event.subevents);
            const subEventList = make_planet_battle_list(planets);
            eventItem.appendChild(subEventList);
            eventList.appendChild(eventItem);
        }

        parentContainer.appendChild(eventList);
        return parentContainer;
    }

    let distinctElements = funct(history, showEvt, sectorData);
    if (use == 0) {
        distinctElements = distinctElements.planetTypes;
    } else {
        distinctElements = distinctElements.ongoing;
    }

    function populateGrid(sectorData, parentElement) {
        // Remove all current children of the parent element
        while (parentElement.firstChild) {
            parentElement.removeChild(parentElement.firstChild);
        }

        // Generate battle lists for each sector and log sector data
        let data = Object.values(sectorData);
        for (let index = 0; index < data.length; index++) {
            let sector = data[index];
            let current = index === 0;
            console.log(sector);
            generate_battlelist_for_sector(
                sector,
                index,
                current,
                parentElement,
            );
        }
    }

    populateGrid(distinctElements, parentContainer);
    return [];
}
