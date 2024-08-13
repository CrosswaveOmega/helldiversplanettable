from datetime import datetime, timezone
import json, sys

timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S %Z")


json.dump({"update_time": timestamp}, sys.stdout)
