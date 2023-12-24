import subprocess
import platform
import json
import os
import winreg

# import win32com.client
from src.cmd_types import *

pywin_shell = None


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


def get_installed_programs():
    # opens start menu and gets all programs
    if platform.system() == "Windows":
        global_path = os.path.join(
            os.environ["PROGRAMDATA"],
            "Microsoft",
            "Windows",
            "Start Menu",
        )

        print("System Start Menu Contents:")
        list_shortcuts_windows(global_path)
    else:
        raise NotImplementedError


def list_shortcuts_windows(directory):
    """
    Recursively lists all shortcuts in the given directory and writes them to a log file.
    """
    if os.path.exists(directory):
        for item in os.listdir(directory):
            full_path = os.path.join(directory, item)
            if os.path.isdir(full_path):
                # Recursively search in directories
                list_shortcuts_windows(full_path)
            elif item.lower().endswith(".lnk"):
                # Log the shortcut name and path
                print(f"{item}: {full_path}\n")

                # if pywin_shell == None:
                #     pywin_shell = win32com.client.Dispatch("WScript.Shell")

                # shortcut = pywin_shell.CreateShortCut(full_path)
                # print(shortcut.Targetpath)


# Courtesy of https://stackoverflow.com/questions/75040757/how-do-i-list-all-the-installed-applications-using-python, Florian EDEMESSI
# def get_installed_programs():
#     reg = winreg.ConnectRegistry(None, winreg.HKEY_LOCAL_MACHINE)
#     key = winreg.OpenKey(reg, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall")

#     for i in range(winreg.QueryInfoKey(key)[0]):
#         software_key_name = winreg.EnumKey(key, i)
#         software_key = winreg.OpenKey(key, software_key_name)
#         try:
#             software_name = winreg.QueryValueEx(software_key, "DisplayName")[0]
#             try:
#                 # Try to get the executable path (DisplayIcon)
#                 software_path = winreg.QueryValueEx(software_key, "DisplayIcon")[0]
#             except FileNotFoundError:
#                 try:
#                     # If DisplayIcon not found, try InstallLocation
#                     software_path = winreg.QueryValueEx(
#                         software_key, "InstallLocation"
#                     )[0]
#                 except FileNotFoundError:
#                     # If both are not found, set as not available
#                     software_path = "Path not available"

#             print(f"{software_name} - Path: {software_path}")
#         except Exception as e:
#             print(f"Error retrieving information for software index {i}: {e}")
