from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from typing import List, Callable

import src.web_interface as web_interface
import src.cmd_interface as cmd_interface

import uvicorn


class Command(BaseModel):
    title: str
    description: str
    command: str
    issuer: str = "uvicorn"


class CommandList:
    def __init__(self, commands=None):
        if commands is None:
            self.commands = []
        else:
            self.commands = commands


commands_data = CommandList(
    commands=[
        Command(title="webreg", description="Register for classes", command="webreg"),
        Command(
            title="WSL VPN Fix", description="Fix VPN in WSL", command="wsl-vpn-fix"
        ),
    ]
)

functions = {
    "webreg": web_interface.webreg,
    "wsl-vpn-fix": cmd_interface.wsl_vpn_fix,
}

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
    return commands_data.commands


@app.post("/run-command")
def run_command(command: Command):
    if command.command in functions:
        functions[command.command]()
        return {"message": "Command executed successfully"}
    else:
        return {"message": "Command not found"}


# Uncomment the line below to run the server
# uvicorn.run(app, host="localhost", port=3001)
