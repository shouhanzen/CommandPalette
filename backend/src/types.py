from pydantic import BaseModel
from typing import List, Callable


class Command(BaseModel):
    title: str
    description: str
    command: Callable = None
    tags: List[str] = []
    closes_palette: bool = True
    icon: str = ""


class SerializableCommand(BaseModel):
    title: str
    description: str
    tags: List[str] = []
    closes_palette: bool = True
    icon: str = ""


class CommandList:
    def __init__(self, commands=None):
        if commands is None:
            self.commands = []
        else:
            self.commands = commands
