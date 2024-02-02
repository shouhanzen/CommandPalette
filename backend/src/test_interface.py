import subprocess
import platform
import json
import os
from src.cmd_types import *

def get_commands():
    cmd_list = []

    cmd_list.append(Command(
        title="Test",
        description="Test command",
        command=lambda: print("Test command executed"),
        disabled=True
    ))

    return cmd_list
