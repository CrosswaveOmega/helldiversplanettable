import logging
import os, json

from typing import Any, Dict, List, Optional, Tuple, Union


logger = logging.getLogger("StatusLogger")


def load_event_types(json_file: str) -> Dict[str, Any]:
    """Load event types from a JSON file."""
    with open(json_file, "r") as file:
        return json.load(file)


def check_and_load_json(filepath: str):
    """Make sure the json at filepath exists, and load it."""
    try:
        exists = os.path.exists(filepath)
        isfile = os.path.isfile(filepath)
        print(exists, isfile)
        if os.path.exists(filepath) and os.path.isfile(filepath):
            with open(filepath, "r", encoding="utf8") as json_file:
                output = json.load(json_file)
                return output
    except Exception as e:
        print(e)
        logger.error(str(e))
    return {}


def save_json_data(file_path: str, data: Any, **kwargs) -> None:
    """Save json data to a file."""
    with open(file_path, "w", encoding="utf8") as json_file:
        json.dump(data, json_file, **kwargs)