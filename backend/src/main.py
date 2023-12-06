from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
import uvicorn


# Define a class to structure the data
class CommandList(BaseModel):
    commands: list


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

# Sample commands data
commands_data = CommandList(commands=["command1", "command2", "command3"])


# Define a route to return the commands
@app.get("/commands")
def get_commands():
    return commands_data


# Uncomment the line below to run the server
# uvicorn.run(app, host="localhost", port=3001)
