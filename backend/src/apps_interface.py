import subprocess
import platform
import json
import os
import winreg
from src.cmd_types import *


def start_app(app: str):
    if platform.system() == "Windows":
        subprocess.Popen(f"start {app}", shell=True)
    elif platform.system() == "Linux":
        raise NotImplementedError
        # subprocess.Popen(command.command, shell=True)
    elif platform.system() == "Darwin":
        raise NotImplementedError
        # subprocess.Popen(["open", command.command])
    else:
        raise NotImplementedError


def get_commands():
    commands = []

    progs = get_installed_programs()

    for prog in progs:
        commands.append(
            Command(
                title=prog,
                command=lambda name=prog: print(f"Debug msg for prog {name}"),
                description="",
            )
        )

    return commands


# Courtesy of https://stackoverflow.com/questions/75040757/how-do-i-list-all-the-installed-applications-using-python, Florian EDEMESSI
def get_installed_programs():
    reg = winreg.ConnectRegistry(None, winreg.HKEY_LOCAL_MACHINE)
    key = winreg.OpenKey(reg, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall")

    progs = []

    for i in range(winreg.QueryInfoKey(key)[0]):
        software_key_name = winreg.EnumKey(key, i)
        software_key = winreg.OpenKey(key, software_key_name)
        try:
            software_name = winreg.QueryValueEx(software_key, "DisplayName")[0]
            # print(software_name)
            progs.append(software_name)
        except Exception as e:
            print(e)

    return progs
