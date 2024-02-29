import subprocess
import platform
import json
import os
from src.cmd_types import *
from .contributor import CommandContributor

class CmdInterface(CommandContributor):
    def __init__(self) -> None:

        self.shells = {"powershell": self.run_powershell_command, "bash": self.run_bash_command}
        super().__init__()
    def run_powershell_command(self, command: str, sudo: bool = False):
        if platform.system() != "Windows":
            print("This function can only be run on Windows.")
            return

        if sudo:
            escaped_command = command.replace('"', '`"')
            command = f"powershell -Command \"Start-Process PowerShell -Verb RunAs -ArgumentList '{escaped_command}'\""
        else:
            command = f'powershell.exe -Command "{command}"'

        process = subprocess.Popen(command, stdout=subprocess.PIPE, shell=True)
        output, error = process.communicate()

        if error:
            print(f"Error: {error}")
        else:
            print(f"Output: {output.decode().strip()}")


    def run_bash_command(self, command: str, sudo: bool = False):
        if platform.system() != "Windows":
            print("This function is intended for use on Windows with Git Bash.")
            return

        bash_path = (
            "C:\\Program Files\\Git\\bin\\bash.exe"  # Default installation path of Git Bash
        )
        if not os.path.exists(bash_path):
            print(
                "Git Bash is not found at the default location. Please install it or update the path."
            )
            return

        # Prepare the command for Git Bash
        escaped_command = command.replace('"', '\\"')
        full_command = f'"{bash_path}" -c "{escaped_command}"'

        if sudo:
            print("Note: 'sudo' is not applicable in Git Bash on Windows.")

        # Run the command
        process = subprocess.Popen(
            full_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True
        )
        output, error = process.communicate()

        if error:
            print(f"Error: {error.decode().strip()}")
        else:
            print(f"Output: {output.decode().strip()}")




    def get_commands(self):
        cmd_list = []

        cmd_list.extend(self.get_commands_from_dir("public/scripts"))

        # If home directory has a .palette/scripts directory, add commands from there
        home_dir = os.path.expanduser("~")
        home_scripts_dir = os.path.join(home_dir, ".palette", "scripts")

        if not os.path.exists(home_scripts_dir):
            os.makedirs(home_scripts_dir)

        if not os.path.exists(os.path.join(home_scripts_dir, "commands.json")):
            # Also create a commands.json file
            with open(os.path.join(home_scripts_dir, "commands.json"), "w") as f:
                f.write("[]")

        try:
            cmd_list.extend(self.get_commands_from_dir(home_scripts_dir))
        except Exception as e:
            print(f"Error: {e}")

        return cmd_list


    def get_commands_from_dir(self, dir: str):
        cmd_list = []

        # Read public/scripts/commands.json
        with open(os.path.join(dir, "commands.json"), "r") as f:
            commands = json.load(f)

        for command in commands:
            shell = self.run_powershell_command
            if "shell" in command:
                shell = self.shells[command["shell"]]
                if not shell:
                    print(
                        f"Error: Shell '{command['shell']}' is not supported. Please use one of the following: {', '.join(shells.keys())}"
                    )
                    continue

            script_path = os.path.join(dir, command["script"])
            with open(script_path, "r") as f:
                script = f.read()

            sudo = False
            if "sudo" in command:
                sudo = command["sudo"]

            cmd_list.append(
                Command(
                    title=command["title"],
                    description=command["description"],
                    command=lambda x=script, s=sudo, sh=shell: sh(x, s),
                )
            )

        return cmd_list
