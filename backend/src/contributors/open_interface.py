import win32gui
import win32con
import win32api
import win32process
import win32ui
from src.cmd_types import *
import win32gui, win32com.client
from PIL import Image
import os
import ctypes
from ctypes.wintypes import DWORD, LONG, WORD



import logging
import threading

from src.contributors.contributor import CommandContributor

# Define BITMAP structure
class BITMAP(ctypes.Structure):
    _fields_ = [
        ("bmType", LONG),
        ("bmWidth", LONG),
        ("bmHeight", LONG),
        ("bmWidthBytes", LONG),
        ("bmPlanes", WORD),
        ("bmBitsPixel", WORD),
        ("bmBits", ctypes.POINTER(DWORD)),
    ]


class OpenInterface(CommandContributor):
    def get_window_titles(self):
        titles = []

        def enum_windows_proc(hwnd, lParam):
            if win32gui.IsWindowVisible(hwnd) and win32gui.GetWindowText(hwnd) != "":
                titles.append((hwnd, win32gui.GetWindowText(hwnd)))

        win32gui.EnumWindows(enum_windows_proc, None)
        return titles


    def focus_window(self, hwnd):
        logging.debug(f"Focusing window with hwnd {hwnd}")

        # Only do this if the window is minimized
        if win32gui.IsIconic(hwnd):
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)

        shell = win32com.client.Dispatch("WScript.Shell")
        shell.SendKeys("%")
        win32gui.SetForegroundWindow(hwnd)


    def close_window(self, hwnd):
        logging.debug(f"Closing window with hwnd {hwnd}")
        win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)


    def get_executable_path(self, hwnd):
        # Get the process ID associated with the window handle
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process_handle = None

        # Open the process and get its executable path
        try:
            process_handle = win32api.OpenProcess(
                win32con.PROCESS_QUERY_INFORMATION | win32con.PROCESS_VM_READ, False, pid
            )
            executable_path = win32process.GetModuleFileNameEx(process_handle, 0)
        except Exception as e:
            print(f"Error getting executable path: {e}")
            executable_path = None
        finally:
            if process_handle:
                win32api.CloseHandle(process_handle)

        return executable_path


    def get_icon(self, hwnd, large_icon=False):
        # Define the icon size
        if large_icon:
            size_flag = win32con.ICON_BIG
        else:
            size_flag = win32con.ICON_SMALL

        # Try to get the window icon
        try:
            res, hicon = win32gui.SendMessageTimeout(
                hwnd, win32con.WM_GETICON, size_flag, 0, 0, 1000
            )
        except Exception as e:
            logging.error(f"Error getting icon: {e}")
            return None

        # If the window has no icon, get the icon from the application
        if hicon == 0:
            hicon = win32gui.GetClassLong(hwnd, win32con.GCL_HICON)

        # If a large icon is not found, try to get the small icon
        if hicon == 0 and large_icon:
            hicon = win32gui.SendMessage(hwnd, win32con.WM_GETICON, win32con.ICON_SMALL, 0)

        if hicon == 0:
            hicon = win32gui.GetClassLong(hwnd, win32con.GCL_HICONSM)

        # If we have an icon handle, extract the icon
        if hicon != 0:
            hdc = win32ui.CreateDCFromHandle(win32gui.GetDC(hwnd))
            hbmp = win32ui.CreateBitmap()

            try:
                icon_info = win32gui.GetIconInfo(hicon)

                bitmap = BITMAP()
                ctype_handle = ctypes.wintypes.HANDLE(int(icon_info[4]))
                ctypes.windll.gdi32.GetObjectW(
                    ctype_handle, ctypes.sizeof(bitmap), ctypes.byref(bitmap)
                )

                hbmp.CreateCompatibleBitmap(hdc, bitmap.bmWidth, bitmap.bmHeight)
                hdc = hdc.CreateCompatibleDC()
                hdc.SelectObject(hbmp)

                hdc.DrawIcon((0, 0), hicon)
                bmpinfo = hbmp.GetInfo()
                bmpstr = hbmp.GetBitmapBits(True)

                img = Image.frombuffer(
                    "RGBA",
                    (bmpinfo["bmWidth"], bmpinfo["bmHeight"]),
                    bmpstr,
                    "raw",
                    "BGRA",
                    0,
                    1,
                )

                logging.debug(img)

                return img
            finally:
                try:
                    win32gui.DeleteObject(hbmp.GetHandle())
                except Exception as e:
                    logging.error(f"Error deleting object: {e}")

                try:
                    win32gui.DeleteObject(hicon)
                except Exception as e:
                    logging.error(f"Error deleting object: {e}")

                try:
                    hdc.DeleteDC()
                except Exception as e:
                    logging.error(f"Error deleting object: {e}")
        else:
            return None


    def get_commands(self):
        commands = []

        windows = self.get_window_titles()

        # If there are duplicate titles, rename with number added
        windows_processed = []
        titles = []
        for hwnd, title in windows:
            if title in titles:
                j = 1
                while title + f" ({j})" in titles:
                    j += 1
                title = title + f" ({j})"
            titles.append(title)
            windows_processed.append((hwnd, title))

        # Clean out the icons directory
        icon_dir = os.path.join(os.getcwd(), "public", "icons", "windows")
        for f in os.listdir(icon_dir):
            if f is not '.gitignore':
                os.remove(os.path.join(icon_dir, f))

        for hwnd, title in windows_processed:

            print(f"Processing window: {title}")

            # Get executable path
            executable_path = self.get_executable_path(hwnd)
            if executable_path is None:
                executable_path = "Unknown"

            print(f"Executable path: {executable_path}")

            icon = self.get_icon(hwnd, large_icon=True)

            # Save icon to ./public/icons/windows
            # Hash the title to avoid issues with special characters
            remote_icon_path = ""
            title_hash = str(hash(title))
            print(title_hash)

            if icon:
                save_path = os.path.join(
                    os.getcwd(), "public", "icons", "windows", title_hash + ".png"
                )
                icon.save(save_path, "PNG")

                remote_icon_path = save_path.replace(
                    os.path.join(os.getcwd(), "public"), ""
                )

            print("Command title: " + title)

            commands.append(
                Command(
                    title="Open: " + title,
                    description=executable_path,
                    command=lambda x=hwnd: self.focus_window(x),
                    icon=remote_icon_path,
                    delete_on_open=True,
                )
            )

            commands.append(
                Command(
                    title="Close: " + title,
                    description=executable_path,
                    command=lambda x=hwnd: self.close_window(x),
                    icon=remote_icon_path,
                    delete_on_open=True,
                )
            )

        return commands
    
    def patch_commands(self):
        return self.get_commands()