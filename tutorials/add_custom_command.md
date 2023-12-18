# Adding a Custom Command

This will require editing the FastAPI server's source code.

A quick overview of how the backend collects commands before sending them to the client:

1. The backend maintains a list of internal command providers in main.py. Right now, the provider list looks like this:

   ```python
   contributors = [web_interface, spotify_core, cmd_interface]
   ```

   These contributors are modules imported from elsewhere in the project. They all share the get_commands() function, which returns a list of Command objects.

2. Each contributing module is left to its own devices to collect commands. For example, the web_interface module collects commands from the commands.json file, and the spotify_core module has a series of hard coded commands.
3. Each module returns the commands in a format specified by the Command class. The Command class is defined in cmd_types.py. The Command class s defined as follows:

   ```python

   class Command(BaseModel):
    title: str
    description: str
    command: Callable = None
    tags: List[str] = []
    closes_palette: bool = True
    icon: str = ""

   ```

   Where the following is the case:

   - title (required): The title of the command
   - description: A short description of the command
   - command (required): The function to be executed when the command is run.
   - tags: A list of tags that can be used to filter commands. See tutorials/filtering_commands.md for more information.
   - closes_palette: Whether or not the command should close the Palette when it is run. Defaults to true.
   - icon: The path to the icon that will display on the command card. If not provided, a default icon will be used. The icon path should be relative to the /public folder.

## Steps to Adding the Command

1. Determine if you want to extend existing functionality or add a new internal command providing module.
   - I want to extend existing functionality
     - Go to the module you want to extend and add your command to the list of commands it returns.
   - I want to add a new internal command providing module
     - Create a new module in /backend/src. The module should have a get_commands() function that returns a list of Command objects.
     - Add the module to the list of contributors in /backend/src/main.py.
2. Test your command
   - Assuming that you have the backend running, hit `Ctrl + R` in Palette to refresh the commands.
   - See if your new command is in the command list
   - If it is, try running it. If it doesn't work, check the console for errors.

## FAQ

WIP, will add as questions come up.
