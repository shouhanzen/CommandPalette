import win32gui
import win32con
import win32api
import win32process
from src.cmd_types import *
import win32gui, win32com.client


import logging


def get_window_titles():
    titles = []

    def enum_windows_proc(hwnd, lParam):
        if win32gui.IsWindowVisible(hwnd) and win32gui.GetWindowText(hwnd) != "":
            titles.append((hwnd, win32gui.GetWindowText(hwnd)))

    win32gui.EnumWindows(enum_windows_proc, None)
    return titles


def focus_window(hwnd):
    logging.debug(f"Focusing window with hwnd {hwnd}")

    # Only do this if the window is minimized
    if win32gui.IsIconic(hwnd):
        win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)

    shell = win32com.client.Dispatch("WScript.Shell")
    shell.SendKeys("%")
    win32gui.SetForegroundWindow(hwnd)


def close_window(hwnd):
    logging.debug(f"Closing window with hwnd {hwnd}")
    win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)


def get_executable_path(hwnd):
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


def get_commands():
    commands = []

    windows = get_window_titles()

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

    for hwnd, title in windows_processed:

        # Get executable path
        executable_path = get_executable_path(hwnd)
        if executable_path is None:
            executable_path = "Unknown"

        commands.append(
            Command(
                title="Open: " + title,
                description=executable_path,
                command=lambda x=hwnd: focus_window(x),
            )
        )

        commands.append(
            Command(
                title="Close: " + title,
                description=executable_path,
                command=lambda x=hwnd: close_window(x),
            )
        )

    return commands


def main():
    windows = get_window_titles()
    for i, (hwnd, title) in enumerate(windows):
        print(f"{i + 1}: {title}")

    choice = input("Enter the number of the window you want to focus: ")
    try:
        choice = int(choice) - 1
        if 0 <= choice < len(windows):
            focus_window(windows[choice][0])
        else:
            print("Invalid selection.")
    except ValueError:
        print("Please enter a number.")


if __name__ == "__main__":
    main()
