
function formatDateToYearMonth(dateString) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }
    return null; // return null for invalid date strings
}

export function SimplifyHistory(history) {
    /**
     * Create the text for the event at index count inside parentCart
     * Each event is displayed as a card on the parent HTML element.
     *
     * @param {DaysObject} history - The historical data containing game events.
     * @param {HTMLElement} parentCard - The parent container for event cards.
     * @param {int} mode - mode for listing all
     * @returns {string} - Empty string as a dummy return value.
     */

    let battlecounter={};
    function createCard(entry, parentCard) {
        /**
         * Creates and appends a card created based on the game_event
         *
         * @param {GameEvent} entry - The game event data to display.
         * @param {HTMLElement} parentCard - The parent HTML element to append the card to.
         * @returns {string} - A string of each textElement and the events.mo field.
         */

        let result = '';

        for (const each of entry.log) {
            if (each.type === "Day Start" || each.type==="decaychange" || each.type==='monitor') {
                // parentCard.appendChild(document.createElement("br"));
                // const headingElement2 = document.createElement("h1");
                // headingElement2.textContent = ` Day:#${entry.day}`;
                // headingElement2.id = `day${entry.day}`;
                // headingElement2.href = `#day${entry.day}`;
                // parentCard.appendChild(headingElement2);
            } else {
                // Split up newlines
                if (/<br\/>/.test(each.text)) {
                    const listItems = each.text.split("<br/>");
                    listItems.forEach((itemString) => {
                        // const textElement = document.createElement("span");
                        // textElement.textContent = "+ " + itemString;
                        // parentCard.appendChild(textElement);
                        // parentCard.appendChild(document.createElement("br"));
                        result += itemString;
                    });
                } else {
/*                     const textElement = document.createElement("span");
                    textElement.textContent = each.text;
                    parentCard.appendChild(textElement);
                    parentCard.appendChild(document.createElement("br")); */
                    let text = each.text;
                    const regexMatch = text.match(/(A\d+-(?:1[0-2]|[1-9])-\d+)/);
                    if (regexMatch) {
                        text = text.replace(regexMatch[0], `[[Major Orders#${regexMatch[0]}|${regexMatch[0]}]]`);
                    }
                    let planet=null;
                    for (const planetval of each.planet) {
                        planet = planetval[0];
                        text = text.replace(new RegExp(planet, 'g'), `[[${planet}]]`);
                    }

                    if (!battlecounter[planet]) {
                        battlecounter[planet] = 0;
                    }
                    
                    if (planet!= null){
                        if (each.type === "campaign_end") {
                            //this.endCampaign(logEntry, planet, pid, event, sector);
                            text=`${text}, ending ${planet} Battle ${battlecounter[planet]}`
                        }
                        if (each.type === "campaign_start") {
                            battlecounter[planet] += 1;
                            text=`${text}, starting ${planet} Battle ${battlecounter[planet]}`
                        }
                        if (each.type === "defense start") {
                            battlecounter[planet] += 1;
                            text=`${text}, starting ${planet} Battle ${battlecounter[planet]}`
                        }
                        if (
                            each.type === "planet won" ||
                            each.type === "planet superwon"
                        ) {
                            text=`${text}, ending ${planet} Battle ${battlecounter[planet]}`
                            //this.planetWon(planet, pid, event, sector);
                        }
                        if (each.type === "planet flip") {
                           // this.planetTypes[sector].flips += 1;
                            //this.planetFlip(planet, pid, event, sector,logEntry)
                        }
                        if (each.type === "defense won") {
                            //this.defenseWon(planet, pid, event, sector);
                            text=`${text}, ending ${planet} Battle ${battlecounter[planet]}`
                        }
                        if (each.type === "defense lost") {
                            //this.defenseLost(planet, pid, event, sector);
                            text=`${text}, ending ${planet} Battle ${battlecounter[planet]}`
                        }
                    }
                        
                    result += text+"\n";
                }
            }
        }

        

        return result;
    }
    // Function to create the grid element

    function createEventCards(data, parentElement) {
        /**
         * Create the text for all elements up to factorby
         *
         * @param {DaysObject} data - The historical data containing game events.
         * @param {HTMLElement} parentElement - The parent element to clear and append cards to.
         * @param {number} mode - Display mode: 0 for everything, 1 for last 20.
         */
        // Add new elements into the 'cont' div

        let lower, index, day, newlower, i;
        let simplified={};
        for (index = 0; index < data.events.length; index++) {
            
            let event = data.events[index];
            let ts=event.time;
            let text=createCard(event,null)
            if (text!==""){
                let month=formatDateToYearMonth(ts);
                if (!simplified[month]){
                simplified[month]={}
                }

                
                simplified[month][ts]={'text':text,'mo':event.mo,'ts':event.timestamp}
            }
            //const card = createCard(event, parentElement);
        }
        return simplified
            

    }

    return createEventCards(history, null);
    //return "";
}
