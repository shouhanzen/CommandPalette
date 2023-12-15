import webbrowser
from src.types import *
import json


def open_url(url: str):
    print(f"Opening {url}")

    webbrowser.open(url)


def get_commands():
    # Load the websites from the JSON file
    with open("src/websites.json", "r") as f:
        websites = json.load(f)

    # Create a Command object for each website
    commands = []

    for website in websites:
        description = ""
        try:
            description = website["description"]
        except KeyError:
            pass

        icon = ""
        try:
            icon = website["icon"]
        except KeyError:
            pass

        commands.append(
            Command(
                title=website["title"],
                description=description,
                command=lambda url=website["url"]: open_url(url),
                icon=icon,
            )
        )

    return commands
