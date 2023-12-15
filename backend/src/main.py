from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src.cmd_types import *

import src.web_interface as web_interface
import src.cmd_interface as cmd_interface

import uvicorn
import subprocess
import socket

from src.spotify.core import router as spotify_router
import src.spotify.core as spotify_core

base_commands = CommandList(
    commands=[
        Command(
            title="WSL VPN Fix",
            description="Fix VPN in WSL",
            command=cmd_interface.wsl_vpn_fix,
        ),
    ]
)

contributors = [web_interface, spotify_core]


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
        assert command.title not in titles
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


# Define a route to return the commands
@app.get("/commands")
def get_commands():
    # Build simplified objects
    serializable_commands = []
    for command in build_commands_list().commands:
        serializable_commands.append(SerializableCommand(**command.dict()))

    return serializable_commands


@app.post("/run-command")
def run_command(command: SerializableCommand):
    print(f"Running command: {command.title}")

    for c in build_commands_list().commands:
        if c.title == command.title:
            c.command()
            return {"message": "Command executed successfully"}

    return {"message": "Command not found"}


# Link in various routers
app.include_router(spotify_router)

# Icons
app.mount("/icons", StaticFiles(directory="public/icons"), name="icons")

# Uncomment the line below to run the server
# uvicorn.run(app, host="localhost", port=3001)
