import win32gui
import win32con
from src.cmd_types import *


def get_window_titles():
    titles = []

    def enum_windows_proc(hwnd, lParam):
        if win32gui.IsWindowVisible(hwnd) and win32gui.GetWindowText(hwnd) != "":
            titles.append((hwnd, win32gui.GetWindowText(hwnd)))

    win32gui.EnumWindows(enum_windows_proc, None)
    return titles

def focus_window(hwnd):
    win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
    win32gui.SetForegroundWindow(hwnd)

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
        commands.append(Command(
            title="Open: " + title,
            command=lambda x=hwnd: focus_window(x)
        ))

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
