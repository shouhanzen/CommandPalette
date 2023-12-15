from pydantic import BaseModel
from typing import List, Callable


class Command(BaseModel):
    title: str
    description: str
    issuer: str = "uvicorn"
    command: Callable = None
    tags: List[str] = []
    closes_palette: bool = True


class SerializableCommand(BaseModel):
    title: str
    description: str
    issuer: str = "uvicorn"
    tags: List[str] = []
    closes_palette: bool = True


class CommandList:
    def __init__(self, commands=None):
        if commands is None:
            self.commands = []
        else:
            self.commands = commands
