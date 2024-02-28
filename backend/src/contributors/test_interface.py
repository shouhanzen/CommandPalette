import subprocess
import platform
import json
import os
from src.cmd_types import *

from src.contributors.contributor import CommandContributor

class TestInterface(CommandContributor):
    def get_commands(self):
        cmd_list = []

        cmd_list.append(Command(
            title="Test",
            description="Test command",
            command=lambda: print("Test command executed"),
            disabled=True
        ))

        return cmd_list
