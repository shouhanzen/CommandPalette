from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src.cmd_types import *


from typing import List

from src.contributors.apps_interface import AppsInterface
from src.contributors.cmd_interface import CmdInterface
from src.contributors.spotify_interface import SpotifyInterface
from src.contributors.web_interface import WebInterface
from src.contributors.test_interface import TestInterface
from src.contributors.open_interface import OpenInterface
from src.contributors.contributor import CommandContributor

from concurrent.futures import ThreadPoolExecutor, as_completed

from src.contributors.spotify_interface import router as spotify_router

import logging
import threading

logging.basicConfig(level=logging.DEBUG)

contributors: List[CommandContributor] = [
    WebInterface(),
    SpotifyInterface(),
    CmdInterface(),
    AppsInterface(),
    OpenInterface(),
    TestInterface(),
]


def build_commands_list():
    out = CommandList()
    
    # Use ThreadPoolExecutor to call get_commands() in parallel
    with ThreadPoolExecutor(max_workers=len(contributors)) as executor:
        # Submit all get_commands() functions to the executor
        future_to_contributor = {
            executor.submit(contributor.get_commands): contributor
            for contributor in contributors
        }

        for future in as_completed(future_to_contributor):
            contributor_commands = future.result()
            out.cmd_groups.extend(contributor_commands)

    # Assert that command titles are unique
    titles = set()  # Use a set for O(1) lookups
    for command in out.cmd_groups:
        if command.title in titles:
            raise ValueError(f"Duplicate command title: {command.title}")
        titles.add(command.title)

    return out


# Create an instance of FastAPI
app = FastAPI()

# Add CORS middleware to the application instance
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Commands probably shouldn't be functional and ought to be cached.
cached_commands = None

command_lock = threading.Lock()


# Define a route to return the commands
@app.get("/commands")
def get_commands():
    global cached_commands

    command_lock.acquire()

    # Build simplified objects
    serializable_commands = []
    cached_commands = build_commands_list()

    for command in cached_commands.cmd_groups:
        serializable_commands.append(SerializableCommand(**command.dict()))

    command_lock.release()

    return serializable_commands


@app.post("/run-command")
def run_command(command: SerializableCommand):
    global cached_commands

    print(f"Running command: {command.title}")

    print(cached_commands)

    if cached_commands is None:
        cached_commands = build_commands_list()

    for c in cached_commands.cmd_groups:
        if c.title == command.title:
            c.command()
            return {"message": "Command executed successfully"}

    return {"message": "Command not found"}


@app.post("/quit")
def quit():
    print("Quit signal received")


@app.get("/health")
def health():
    return "OK"

# Link in various routers
app.include_router(spotify_router)

# Icons
app.mount("/icons", StaticFiles(directory="public/icons"), name="icons")

# Uncomment the line below to run the server
# uvicorn.run(app, host="localhost", port=3001)
