import webbrowser
from src.cmd_types import *
import json

from src.contributors.contributor import CommandContributor

class WebInterface(CommandContributor):
    def open_url(self, url: str):
        print(f"Opening {url}")

        webbrowser.open(url)


    def get_commands(self):
        # Load the websites from the JSON file
        with open("public/websites.json", "r") as f:
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
                    command=lambda url=website["url"]: self.open_url(url),
                    icon=icon,
                )
            )

        return commands
