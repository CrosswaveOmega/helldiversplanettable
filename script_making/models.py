from typing import Any, Dict, List, Optional, Tuple, Union
from pydantic import BaseModel, Field


class GameSubEvent(BaseModel):
    text: Optional[str] = Field(alias="text", default=None)
    type: Optional[str] = Field(alias="type", default=None)
    faction: Optional[int] = Field(alias="faction", default=0)
    planet: Optional[List[Tuple[str, int]]] = Field(alias="planet", default=[])


class GameEvent(BaseModel):
    timestamp: float
    time: str
    day: int
    text: Optional[str] = Field(alias="text", default=None)
    type: Optional[str] = Field(alias="type", default=None)
    faction: Optional[int] = Field(alias="faction", default=0)
    planet: Optional[List[Tuple[str, str]]] = Field(alias="planet", default=[])

    mo: Optional[str] = Field(alias="mo", default=None)
    mo_name: Optional[str] = Field(alias="mo_name", default=None)
    mo_case: Optional[str] = Field(alias="mo_case", default=None)
    mo_objective: Optional[str] = Field(alias="type", default=None)
    # galaxystate: Dict[str, Any] = Field(default_factory=dict)
    log: Optional[List[GameSubEvent]] = Field(default_factory=list)
    all_players: Optional[int] = Field(alias="all_players", default=None)
    eind: Optional[int] = Field(alias="eind", default=None)

    # Comparator to sort GameEvent objects by timestamp
    def __lt__(self, other: "GameEvent") -> bool:
        return self.timestamp < other.timestamp


class Position(BaseModel):
    x: float
    y: float


class PlanetStatic(BaseModel):
    name: str
    position: Position
    sector: str
    index: int


class PlanetState(BaseModel):
    hp: Optional[int] = Field(alias="hp", default=None)
    pl: Optional[Union[str, int]] = Field(alias="pl", default=None)
    r: Optional[float] = Field(alias="float", default=None)
    t: int
    link: Optional[List[int]] = Field(alias="link", default=[])
    link2: Optional[int] = Field(alias="link2", default=None)
    gls: Optional[int] = Field(alias="gloom", default=None)
    biome: Optional[str] = Field(alias="biome", default=None)


class DaysObject(BaseModel):
    events: List[GameEvent] = Field(default_factory=list, alias="events")
    days: Dict[int, int] = Field(default_factory=dict)
    dayind: Dict[int, List[int]] = Field(default_factory=dict)
    timestamps: List[int] = Field(default_factory=list)
    lastday: int = Field(default=1)
    galaxystatic: Dict[str, PlanetStatic] = Field(default_factory=dict)


class GalaxyStates(BaseModel):
    gstatic: Optional[Dict[str, PlanetStatic]] = Field(default=None, alias="gstatic")
    states: Optional[Dict[str, PlanetState]] = Field(default=None, alias="states")
    gstate: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="gstate")
    links: Optional[Dict[int, List[int]]] = Field(default_factory=dict)