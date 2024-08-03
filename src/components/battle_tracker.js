function add_to_entry(acc, planet, value, time) {
    if (!acc[planet[1]]) {
      acc[planet[1]] = { 'name': planet[0], 'index': planet[1], 'events': [] };
    }
    acc[planet[1]]['events'].push({ 'time': time, 'event': value })
  }


  function displayUTCTime(timestamp) {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toISOString().replace('T', ' ').slice(0, 16);
  }
  
  function calculateElapsedTime(timestamp1, timestamp2) {
    const time1 = new Date(parseInt(timestamp1) * 1000);
    const time2 = new Date(parseInt(timestamp2) * 1000);
    const elapsed = Math.abs(time2 - time1);
  
    const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  
    if (days === 0) {
      return `${hours}h ${minutes}m`;
    }
  
    return `${days}d ${hours}h ${minutes}m`;
  }
  
export function count_distinct_planet_battles(history, showEvts,sector_data) {
    const planetTypes = {};
    const battles = {};
    for (let event of history.events) {
      for (let logEntry of event.log) {
        console.log(logEntry,event.time);
        if (logEntry.planet) {
          for (let planet of logEntry.planet) {
            let pid = planet[1];
            if (!battles[pid]) {
              battles[pid] = { 'start': null, 'pc': 0, 'lc': 0, 'dc': 0, 'cl':0, 'def':null };
            }
            let sector = 'unknown';
            if (history.galaxystatic[pid.toString()]) {
              sector = history.galaxystatic[pid.toString()].sector;
            }
            if (!planetTypes[sector]) {
              planetTypes[sector] = { 
                'name': sector, 
                'front': 'ALL', 
                'planets': {}, 
                'battles': 0, 
                'win': 0, 
                'loss': 0,
                'current':0,
                'cstart': 0,
                'cend': 0,
                'flips':0,
                'planetwon': 0,
                'defensestart': 0,
                'defensewon': 0,
                'defenselost': 0
              };
              let tofind = sector_data['all'].find(el => el.sector_name === sector.toUpperCase());
              if (tofind) {
                planetTypes[sector].front = tofind.sector_front;
              }
            }
            if (showEvts) {
              add_to_entry(planetTypes[sector].planets, planet, logEntry.text, event.time);
            }
            if (logEntry.type === "cend") {
              let battle = `Battle ${battles[pid].pc} for ${planet[0]}, ${displayUTCTime(battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(battles[pid].start, event.timestamp)}, failure)`;
              add_to_entry(planetTypes[sector].planets, planet, battle, null);
              planetTypes[sector].loss += 1;
              planetTypes[sector].cend += 1;
              planetTypes[sector].current -=1;
            }
            if (logEntry.type === 'cstart') {
              battles[pid].pc += 1;
              battles[pid].lc += 1;
              battles[pid].start = event.timestamp;
              planetTypes[sector].battles += 1;
              planetTypes[sector].current +=1;
              planetTypes[sector].cstart += 1;
            }
            if (logEntry.type === "defense start") {
              battles[pid].pc += 1;
              battles[pid].dc += 1;
              if (battles[pid].now!=null){
                console.log(battles[pid].now, battles[pid].start, 'NOT CLOSED');
              }
              battles[pid].now =  `${logEntry.text}, ${event.time}`;
              
              battles[pid].start = event.timestamp;
              planetTypes[sector].battles += 1;
              planetTypes[sector].defensestart += 1;
              planetTypes[sector].current +=1;
            }
            if (logEntry.type === "planet won" || logEntry.type === "planet superwon") {
              let battle = `Battle ${battles[pid].pc} for ${planet[0]}, ${displayUTCTime(battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(battles[pid].start, event.timestamp)}, victory)`;
              
              add_to_entry(planetTypes[sector].planets, planet, battle, null);
              planetTypes[sector].win += 1;
              planetTypes[sector].planetwon += 1;
              planetTypes[sector].current -=1;
            }
            if (logEntry.type === "planet flip") {
              planetTypes[sector].flips +=1;
            }
  
  
            if (logEntry.type === "defense won") {
              let battle = `Battle ${battles[pid].pc} for ${planet[0]}, ${displayUTCTime(battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(battles[pid].start, event.timestamp)}, victory)`;
              add_to_entry(planetTypes[sector].planets, planet, battle, null);
              battles[pid].cl+=1;
              if (battles[pid].now==null){
                console.log(pid, 'DEFENSE WON BUT NOT STARTED');
              }
              battles[pid].now = null;
              planetTypes[sector].win += 1;
              planetTypes[sector].defensewon += 1;
              planetTypes[sector].current -=1;
            }
            if (logEntry.type === "defense lost") {
              let battle = `Battle ${battles[pid].pc} for ${planet[0]}, ${displayUTCTime(battles[pid].start)} to ${displayUTCTime(event.timestamp)} (${calculateElapsedTime(battles[pid].start, event.timestamp)}, failure)`;
              add_to_entry(planetTypes[sector].planets, planet, battle, null);
              battles[pid].cl+=1;
              if (battles[pid].now==null){
                console.log(pid, 'DEFENSE LOST BUT NOT STARTED');
              }
              battles[pid].now = null;
              planetTypes[sector].loss += 1;
              planetTypes[sector].defenselost += 1;
              planetTypes[sector].current -=1;
            }
          }
        }
      }
    }
  for (let [key, value] of Object.entries(battles)) {
    if (value.dc!=value.cl){
      console.log("PLANET ID",key,"IS MISSING A DEFENCE WON/LOST", value.now,value.start)
    }
  }
    return planetTypes;
  }