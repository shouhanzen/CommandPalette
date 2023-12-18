### Most Recently Used (MRU) Command Ordering

The Electron client maintains a list of the most recently used commands. When the user runs a command, it is added to the top of the list. When a command is rerun, it is moved to the top of the list.

The list persists for the duration of the client. If the client is closed and reopened, the list is cleared.
