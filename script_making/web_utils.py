from typing import Any, Dict
from datetime import datetime
import aiohttp
import urllib.request
from datetime import datetime


import os

import logging
import logging.handlers


logger = logging.getLogger("StatusLogger")


def get_web_file():
    """Parse the google doc into a text format."""

    url = "https://docs.google.com/document/d/1lvlNVU5aNPcUtPpxAsFS93P2xOJTAt-4HfKQH-IxRaA/export?format=txt"
    with urllib.request.urlopen(url) as response:
        print("reading...")
        data = response.read()

    with open("./src/data/gen_data/text.md", "wb") as file:
        file.write(data)


async def get_game_stat_at_time(timev: datetime) -> Dict[int, Dict[str, Any]]:
    """Request the game's status at the given datetime using the war history api."""
    try:
        current_time = timev.isoformat()
        url = "https://api-helldivers.kejax.net/api/planets/at"
        params = {"time": current_time}
        timeout = aiohttp.ClientTimeout(total=10)  # Set the timeout to 10 seconds

        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, params=params) as response:
                response_json = await response.json()
                outv = {p["index"]: p for p in response_json}
                return outv
    except Exception as e:
        logger.warning(str(e))
        return {}
