"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";

const CommandPalette = () => {
  const [commands, setCommands] = useState([] as Command[]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const searchRef = useRef(null as HTMLInputElement | null);

  const [lastUsedList, setLastUsedList] = useState([] as string[]);
  const [panelStack, setPanelStack] = useState([] as ReactNode[]);

  function setErrorGuarded(err: unknown) {
    if (err instanceof Error) {
      // Now TypeScript knows that 'err' is of type Error
      setError(err.message);
    } else {
      // Handle cases where 'err' is not an Error object
      setError("An unknown error occurred");
    }
  }

  const fetchCommands = async () => {
    try {
      const commands = await window.electron.invoke("get-commands", {});
      console.log("Commands fetched: ", commands);
      setCommands(commands as Command[]);
    } catch (err) {
      setErrorGuarded(err);
    } finally {
      setIsLoading(false);
    }
  };

  const runCommand = async (command: Command) => {
    try {
      await window.electron.runCommand(command);
    } catch (err) {
      setErrorGuarded(err);
    }
  };

  // Fetch commands on mount
  useEffect(() => {
    fetchCommands();

    // Set last used list
    window.electron.retrieveMRU().then((mru) => {
      if (mru === null || mru === undefined) {
        throw new Error("MRU is null");
      }
      setLastUsedList(mru);
    });

    window.electron.onMRUChange((event: Event, mru: string[]) => {
      console.log("MRU changed: ", mru);

      setLastUsedList(mru);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.electron.minimizeApp();
        return;
      }

      // Set focus to the search bar
      let banned_keys = [
        "Control",
        "Alt",
        "Shift",
        "Meta",
        "Tab",
        "Enter",
        "Escape",
        "CapsLock",
      ];

      if (searchRef.current && !banned_keys.includes(event.key)) {
        searchRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    window.electron.resetSearch((event: Event) => {
      // Handle the new search term here
      setSearchTerm("");

      // Focus the search bar
      if (searchRef.current) {
        searchRef.current.focus();
      }
    });

    window.electron.onNewCommands((event: Event, commands: Command[]) => {
      console.log("New commands: ", commands);
      setCommands(commands);
    });

    window.electron.onCmdFollowup((event: Event, followup: CommandFollowup) => {
      console.log("Command Followup: ", followup);

      switch (followup.action) {
        case "append":
          console.log("Appending to panel stack");

          let newComponent = componentFromFollowupBody(followup);
          setPanelStack([...panelStack, newComponent]);
          break;
        default:
          throw new Error("Unknown followup action");
      }
    });
  }, []);

  if (isLoading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  const filteredCommands = commands.filter((command) => {
    let numInPool = getTermOverlap(searchTerm, command);
    let inPool = numInPool === searchTerm.split(" ").length;

    return inPool;
  });

  filteredCommands.sort(compareCommands(lastUsedList, searchTerm));

  return (
    <div className="command-palette">
      <div className="command-palette-header">
        <input
          ref={searchRef}
          type="text"
          className="command-input"
          placeholder="Type a command"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onKeyUp={(event) => {
            if (event.key === "Enter" && filteredCommands.length > 0) {
              runCommand(filteredCommands[0]);
            }

            if (event.ctrlKey && event.key === "r") {
              event.preventDefault();

              // Reload page
              window.location.reload();
            }
          }}
          onKeyDown={(event) => {
            // If shift tab and search bar is focused, focus the first element in the list
            if (event.shiftKey && event.key === "Tab") {
              event.preventDefault();
              const firstElement =
                document.getElementsByClassName("command-list-item")[0];
              if (firstElement instanceof HTMLElement) {
                firstElement.focus();
              }
            }
          }}
          onBlur={() => {
            setSearchBarFocused(false);

            // Focus second element in the list
            // if (filteredCommands.length > 1) {
            //   document.getElementsByClassName("command-list-item")[1].focus();
            // }
          }}
          onFocus={() => {
            setSearchBarFocused(true);
          }}
        />
      </div>

      <div className="command-palette-body">
        <ul className="command-list">
          {filteredCommands.map((command, index) => (
            <li
              className={`command-list-item ${
                searchBarFocused && index == 0 ? "highlighted" : ""
              }`}
              key={index}
              tabIndex={index}
              onClick={() => runCommand(command)}
              onKeyUp={(event) => {
                if (event.key === "Enter") {
                  runCommand(command);
                }
              }}
            >
              {"icon" in command ? (
                <span className="command-icon-span">
                  <img
                    src={command.icon as string}
                    alt="icon"
                    className="command-icon"
                  />
                </span>
              ) : null}
              <strong>{command.title}</strong>
              <p className="command-description">{command.description}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="additional-panels">{panelStack}</div>

      <div className="command-palette-footer">
        <p className="command-palette-footer-text">
          Press <strong>Ctrl + R</strong> to reload the app
        </p>
      </div>
    </div>
  );
};

function getTermOverlap(searchTerm: string, command: Command) {
  let split_terms = searchTerm.toLowerCase().split(" ");

  let word_pool = command.title.toLowerCase().split(" ");
  if ("tags" in command) {
    word_pool = word_pool.concat(command.tags.map((tag) => tag.toLowerCase()));
  }
  word_pool = word_pool.concat(command.description.toLowerCase().split(" "));

  let numInPool = 0;
  for (let term of split_terms) {
    if (word_pool.some((word) => word.startsWith(term))) {
      numInPool++;
    }
  }

  return numInPool;
}

function compareCommands(
  lastUsedList: string[],
  searchTerm: string
): ((a: Command, b: Command) => number) | undefined {
  return (a, b) => {
    let aIndex = lastUsedList.indexOf(a.title);
    let bIndex = lastUsedList.indexOf(b.title);

    // If equally matched rank, sort by whichever has the search term first
    if (aIndex === bIndex) {
      let aSearchScore = getTermOverlap(searchTerm, a);
      let bSearchScore = getTermOverlap(searchTerm, b);

      return bSearchScore - aSearchScore;
    }

    if (aIndex === -1) {
      return 1;
    } else if (bIndex === -1) {
      return -1;
    } else {
      return aIndex - bIndex;
    }
  };
}

function componentFromFollowupBody(followup: CommandFollowup) {
  switch (followup.type) {
    case "md_page":
      // Do stuff

      return (
        <div key={followup.key}>
          <h1> {followup.title} </h1>
          <p> {followup.contents} </p>
        </div>
      );
    default:
      throw new Error("Unknown followup type");
  }
}

export default CommandPalette;
