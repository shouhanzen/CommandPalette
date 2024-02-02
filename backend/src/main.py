from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src.cmd_types import *

import src.web_interface as web_interface
import src.cmd_interface as cmd_interface
import src.apps_interface as apps_interface
import src.open_interface as open_interface
import src.test_interface as test_interface

import uvicorn
import subprocess
import socket
import signal

from src.spotify.core import router as spotify_router
import src.spotify.core as spotify_core

import logging

logging.basicConfig(level=logging.DEBUG)

base_commands = CommandList(commands=[])

contributors = [web_interface, spotify_core, cmd_interface, apps_interface, open_interface, test_interface]


def build_commands_list():
    out = CommandList()
    for command in base_commands.commands:
        out.commands.append(command)

    for contributor in contributors:
        for command in contributor.get_commands():
            out.commands.append(command)

    # Assert that command titles are unique
    titles = []
    for command in out.commands:
        if command.title in titles:
            raise ValueError(f"Duplicate command title: {command.title}")

        titles.append(command.title)

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

# Define a route to return the commands
@app.get("/commands")
def get_commands():
    global cached_commands
    
    # Build simplified objects
    serializable_commands = []
    cached_commands = build_commands_list()
    
    for command in cached_commands.commands:
        serializable_commands.append(SerializableCommand(**command.dict()))

    return serializable_commands


@app.post("/run-command")
def run_command(command: SerializableCommand):
    global cached_commands
    
    print(f"Running command: {command.title}")
    
    print(cached_commands)
    
    if cached_commands is None:
        cached_commands = build_commands_list()

    for c in cached_commands.commands:
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


# def signal_handler(signum, frame):
#     # Perform necessary cleanup tasks
#     print(f"Received signal {signum}, shutting down.")
#     # Here you would add your cleanup logic

#     # Exit the application
#     exit(0)


# signal.signal(signal.SIGINT, signal_handler)
# signal.signal(signal.SIGTERM, signal_handler)


# Link in various routers
app.include_router(spotify_router)

# Icons
app.mount("/icons", StaticFiles(directory="public/icons"), name="icons")

# Uncomment the line below to run the server
# uvicorn.run(app, host="localhost", port=3001)
