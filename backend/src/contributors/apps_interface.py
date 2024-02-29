import subprocess
import platform
import json
import os
import configparser
import shutil

from PIL import Image
from src.cmd_types import *

from urllib.parse import urlparse
import logging

from src.contributors.contributor import CommandContributor

logger = logging.getLogger(__name__)


class AppsInterface(CommandContributor):
    def start_app(self, app: str):
        if platform.system() == "Windows":

            command = f'start "" "{app}"'
            subprocess.Popen(command, shell=True)
        else:
            raise NotImplementedError

    def get_commands(self):
        commands = []
        commands += self.get_prog_commands()

        return commands

    def get_prog_commands(self):
        # opens start menu and gets all programs
        if platform.system() == "Windows":
            import pythoncom

            pythoncom.CoInitialize()

            global_path = os.path.join(
                os.environ["PROGRAMDATA"],
                "Microsoft",
                "Windows",
                "Start Menu",
            )
            local_path = os.path.join(
                os.environ["APPDATA"],
                "Microsoft",
                "Windows",
                "Start Menu",
            )

            print("System Start Menu Contents:")
            shortcuts = self.list_shortcuts_windows(global_path) + self.list_shortcuts_windows(
                local_path
            )

            # Clear out shortcuts with duplicate names
            names = []
            unique_shortcuts = []
            for shortcut in shortcuts:
                trimmed = shortcut["name"].strip()

                if trimmed in names:
                    print("WARNING: Duplicate shortcut name found: " + shortcut["name"])
                else:
                    names.append(trimmed)
                    unique_shortcuts.append(shortcut)

            cmds = []

            for shortcut in unique_shortcuts:

                # Get icon
                icon_path = ""
                if shortcut["icon"] != "":
                    icon_path = shortcut["icon"]
                elif shortcut["path"].endswith(".exe"):
                    icon_path = shortcut["path"]

                dest_path, success = self.load_icon_from_resource_windows(
                    icon_path, shortcut["name"]
                )

                remote_icon_path = os.path.join(
                    "/", "icons", "default_prog_windows.svg"
                )
                if success:
                    remote_icon_path = dest_path.replace(
                        os.path.join(os.getcwd(), "public"), ""
                    )

                disabled = False
                description = shortcut["path"]

                if "Uninstall" in shortcut["name"]:
                    disabled = True

                cmds.append(
                    Command(
                        title=f"Run: {shortcut['name']}",
                        command=lambda path=shortcut["path"]: self.start_app(path),
                        description=description,
                        icon=remote_icon_path,
                        disabled=disabled,
                    )
                )

            pythoncom.CoUninitialize()
            return cmds
        if platform.system() == "MacOS":
            return []
        else:
            print("Unsupported platform: " + platform.system())
            return []
            raise NotImplementedError

    def load_icon_from_resource_windows(self, path, fname):
        import src.extract_icon as extract_icon

        # Store icon in public/icons/programs
        dest_path = os.path.join(
            os.getcwd(), "public", "icons", "programs", fname + ".ico"
        )

        # Check timestamps of existing icon and file
        # If icon is newer, use it
        # If file is newer, extract icon and use it
        if os.path.exists(dest_path) and os.path.exists(path):
            if os.path.getmtime(dest_path) > os.path.getmtime(path):
                logger.debug(f"Using existing icon for {path}")

                return dest_path, True

        success = False
        dest_path = ""
        if path.endswith(".exe"):
            try:
                icon = extract_icon.extract_icon(path, extract_icon.IconSize.LARGE)
                icon.save(dest_path)

                success = True

            except Exception as e:
                print(f"Error extracting icon for {path}: {e}")

        elif path.endswith(".ico"):
            try:
                shutil.copy(
                    path,
                    dest_path,
                )
                success = True
            except Exception as e:
                print(f"Error copying icon for {path}: {e}")

        return dest_path, success

    def list_shortcuts_windows(self, directory):
        import win32com.client

        out = []

        """
        Recursively lists all shortcuts in the given directory and writes them to a log file.
        """
        if os.path.exists(directory):
            for item in os.listdir(directory):
                full_path = os.path.join(directory, item)
                if os.path.isdir(full_path):
                    # Recursively search in directories
                    out = out + self.list_shortcuts_windows(full_path)
                elif item.lower().endswith(".lnk") or item.lower().endswith(".url"):
                    icon = ""  # If empty, means we extract from executable

                    if item.lower().endswith(".lnk"):
                        pywin_client = win32com.client.Dispatch("WScript.Shell")
                        shortcut = pywin_client.CreateShortCut(full_path)
                        real_path = shortcut.Targetpath

                    elif item.lower().endswith(".url"):
                        config = configparser.ConfigParser()
                        config.read(full_path)

                        data = dict(config.items("InternetShortcut"))
                        # print(data)
                        real_path = data["url"]

                        if "iconfile" in data:
                            icon = data["iconfile"]

                    name = item[:-4].encode("utf-8", "replace").decode("utf-8")

                    out += [{"name": name, "path": real_path, "icon": icon}]

        return out
