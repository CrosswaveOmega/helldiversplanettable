from typing import Any, Dict, List, Optional, Tuple, Union
from pydantic import BaseModel, Field
import re
import hashlib


ListOfDicts = List[Dict[str, Any]]


def filter_alphanumeric(input_string: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "", input_string)


def hash_string_to_32bit(inp: str) -> int:
    text = filter_alphanumeric(inp)
    print(f"hash to '{text}'", text)
    return int(hashlib.md5(text.encode("utf-8")).hexdigest(), 16) & 0xFFFFFFFF


class GameEvent(BaseModel):
    timestamp: float
    time: str
    day: int
    text: str = Field(alias="text", default="")
    type: str = Field(alias="type", default="NO TYPE")
    faction: Optional[int] = Field(alias="faction", default=0)
    planet: Optional[List[Tuple[str, str]]] = Field(alias="planet", default=[])
    region: Optional[List[Tuple[str, str]]] = Field(alias="region", default=[])

    mo: Optional[str] = Field(alias="mo", default=None)
    mo_id: Optional[str] = Field(alias="mo_id", default=None)
    mo_name: Optional[str] = Field(alias="mo_name", default=None)
    mo_case: Optional[str] = Field(alias="mo_case", default=None)
    mo_objective: Optional[str] = Field(alias="type", default=None)
    last_dss_planet: Optional[List[Tuple[str, str]]] = Field(
        alias="last_dss_planet", default=[]
    )
    all_players: Optional[int] = Field(alias="all_players", default=None)
    eind: Optional[int] = Field(alias="eind", default=None)

    # Comparator to sort GameEvent objects by timestamp
    def __lt__(self, other: "GameEvent") -> bool:
        return self.timestamp < other.timestamp


class GameSubEvent(BaseModel):
    text: Optional[str] = Field(alias="text", default=None)
    type: Optional[str] = Field(alias="type", default=None)
    faction: Optional[int] = Field(alias="faction", default=None)
    planet: Optional[List[Tuple[str, int]]] = Field(alias="planet", default=[])
    region: Optional[List[Tuple[str, int]]] = Field(alias="region", default=[])


class GameEventGroup(BaseModel):
    timestamp: float
    time: str
    day: int
    text: Optional[str] = Field(alias="text", default=None)
    type: Optional[str] = Field(alias="type", default=None)

    mo: Optional[str] = Field(alias="mo", default=None)
    mo_name: Optional[str] = Field(alias="mo_name", default=None)
    mo_case: Optional[str] = Field(alias="mo_case", default=None)
    mo_objective: Optional[str] = Field(alias="type", default=None)
    # galaxystate: Dict[str, Any] = Field(default_factory=dict)
    log: Optional[List[GameSubEvent]] = Field(default_factory=list)
    all_players: Optional[int] = Field(alias="all_players", default=None)
    eind: Optional[int] = Field(alias="eind", default=None)

    # Comparator to sort GameEventGroup objects by timestamp
    def __lt__(self, other: "GameEventGroup") -> bool:
        return self.timestamp < other.timestamp

    def get_hash(self):
        allt = hash_string_to_32bit(
            "".join(e.text for e in self.log if e.text is not None)
        )
        return allt


class SubEventList(BaseModel):
    log: Optional[List[GameSubEvent]] = Field(default_factory=list)


class Position(BaseModel):
    x: float
    y: float


class PlanetStatic(BaseModel):
    name: str
    sector: str
    index: int


class Descriptions(BaseModel):
    name: Optional[str] = Field(alias="name", default=None)
    desc: Optional[str] = Field(alias="desc", default="Nothing of note.")


class PlanetRegion(BaseModel):
    index: Optional[int] = Field(alias="index", default=None)
    name: Optional[str] = Field(alias="name", default=None)
    desc: Optional[str] = Field(alias="desc", default="Nothing of note.")
    t: Optional[int] = Field(alias="t", default=0)
    r: Optional[float] = Field(alias="r", default=0.0)

    hp: int = Field(alias="hp", default=500)


class PlanetState(BaseModel):
    hp: Optional[int] = Field(alias="hp", default=None)
    pl: Optional[Union[str, int]] = Field(alias="pl", default=None)
    r: Optional[float] = Field(alias="float", default=None)
    t: int
    link: List[int] = Field(alias="link", default_factory=list)
    link2: Optional[int] = Field(alias="link2", default=None)
    gls: Optional[int] = Field(alias="gloom", default=None)
    biome: Optional[str] = Field(alias="biome", default=None)
    dss: Optional[str] = Field(alias="dss", default=None)
    poi: Optional[str] = Field(alias="poi", default=None)
    adiv: Optional[str] = Field(alias="assaultdiv", default=None)
    desc: List[Descriptions] = Field(alias="desc", default_factory=list)
    position: Position = Field(alias="position", default=Position(x=0, y=0))
    regions: Dict[str, PlanetRegion] = Field(alias="regions", default_factory=dict)

    def remove_desc(self, name):
        for i in list(self.desc):
            if i.name == name:
                self.desc.remove(i)
                return

    def add_desc(self, name, desc):
        for i in list(self.desc):
            if i.name == name:
                return
        self.desc.append(Descriptions(name=name, desc=desc))


class GalaxyStates(BaseModel):
    gstatic: Optional[Dict[str, PlanetStatic]] = Field(default=None, alias="gstatic")
    states: Optional[Dict[str, PlanetState]] = Field(default=None, alias="states")
    gstate: Optional[Dict[str, ListOfDicts]] = Field(
        default_factory=dict, alias="gstate"
    )
    gstate_cluster: Optional[Dict[int, Dict[str, ListOfDicts]]] = Field(
        default_factory=dict, alias="gstate_cluster"
    )
    links: Optional[Dict[int, List[int]]] = Field(default_factory=dict)


class DaysObject(BaseModel):
    events_all: Optional[List[GameEvent]] = Field(
        default_factory=list, alias="events_all"
    )
    events: Optional[List[GameEventGroup]] = Field(default_factory=list, alias="events")
    days: Dict[int, int] = Field(default_factory=dict)
    dayind: Dict[int, List[int]] = Field(default_factory=dict)
    timestamps: List[int] = Field(default_factory=list)
    lastday: int = Field(default=1)
    galaxystatic: Dict[str, PlanetStatic] = Field(default_factory=dict)


class GalacticEffect(BaseModel):
    galacticEffectId: int = Field(alias="galacticEffectId", default=0000)
    name: str = Field(alias="name", default="NoName")
    icon: str = Field(alias="icon", default="Governmental")
    description: str = Field(alias="description", default="NA")


class MyEffects(BaseModel):
    planetEffects: Optional[Dict[str, GalacticEffect]] = Field(
        default=None, alias="planetEffects"
    )
