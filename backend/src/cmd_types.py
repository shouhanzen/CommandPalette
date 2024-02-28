from pydantic import BaseModel
from typing import List, Callable


class Command(BaseModel):
    title: str
    description: str = ""
    command: Callable = None
    tags: List[str] = []
    closes_palette: bool = True
    icon: str = ""
    disabled: bool = False # Determines whether the command is greyed and unselectable out in the UI


class SerializableCommand(BaseModel):
    title: str
    description: str
    tags: List[str] = []
    closes_palette: bool = True
    icon: str = ""
    disabled: bool = False

class SerializableCommandGroup(BaseModel):
    title: str
    commands: List[SerializableCommand] = []
    refresh_on_open: bool = False

class CommandList:
    def __init__(self, cmd_groups=None):
        if cmd_groups is None:
            self.cmd_groups = []
        else:
            self.cmd_groups = cmd_groups
