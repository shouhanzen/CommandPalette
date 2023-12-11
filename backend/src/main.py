from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
import uvicorn


class Command:
    def __init__(self, title, description):
        self.title = title
        self.description = description


class CommandList:
    def __init__(self, commands=None):
        if commands is None:
            self.commands = []
        else:
            self.commands = commands


commands_data = CommandList(
    commands=[
        Command("command1", "This is command 1"),
        Command("command2", "This is command 2"),
        Command("command3", "This is command 3"),
    ]
)

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
    return commands_data


# Uncomment the line below to run the server
# uvicorn.run(app, host="localhost", port=3001)
