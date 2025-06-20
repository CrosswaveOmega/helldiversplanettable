import logging
from script_making.models import DaysObject, GameEvent


import logging
from datetime import datetime, timezone

logger = logging.getLogger("StatusLogger")
mainHeader = """---
title: Galactic War History Log Full
toc: True
sidebar: true
---
# Full Galactic War History Log

Data aquired thanks to Herald/Cobfish's excelllent [Galactic Archive Log](https://docs.google.com/document/d/1lvlNVU5aNPcUtPpxAsFS93P2xOJTAt-4HfKQH-IxRaA) and Kejax's [War History Api](https://github.com/helldivers-2/War-History-API), this would not be possible without either of them.

"""


def make_markdown_log(history: DaysObject):
    """Create the markdown log from the History Object"""
    markdown_output = ["\n"]

    def make_entry(entry: GameEvent):
        for each in entry.log:
            if each.type == "Day Start":
                if (int(entry.day) % 10) == 0 or int(entry.day) == 1:
                    markdown_output.append(f"\n# Day: #{entry.day}\n")
                else:
                    markdown_output.append(f"\n### Day: #{entry.day}\n")
            elif each.type == "monitor":
                pass
                # print("Skipping addition, monitoring")
                # logger.info("Skipping addition, monitoring.")
            else:
                timestamp = datetime.fromtimestamp(entry.timestamp, tz=timezone.utc)
                formatted_time = timestamp.strftime("%Y-%m-%d %H:%M  UTC")
                # formatted_time = custom_strftime("%#I:%M%p UTC %b {S} %Y",timestamp)

                text = f"{each.text}"
                for i, v in each.planet:
                    text = text.replace(i, f"*{i}*")
                markdown_output.append(f"{text} ({formatted_time})<br/>\n")

    for event in history.events:
        make_entry(event)
    return mainHeader + "".join(markdown_output)
