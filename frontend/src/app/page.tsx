"use client";

import React, { useState, useEffect, useRef } from "react";

interface Command {
  title: string;
  description: string;
  tags: string[];
}

const CommandPalette = () => {
  const [commands, setCommands] = useState([] as Command[]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const searchRef = useRef(null);

  const [lastUsedList, setLastUsedList] = useState([]);

  const fetchCommands = async () => {
    try {
      const commands = await window.electron.invoke("get-commands", {});
      console.log("Commands fetched: ", commands);
      setCommands(commands);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const runCommand = async (command) => {
    try {
      await window.electron.runCommand(command);
    } catch (err) {
      setError(err);
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

    window.electron.onMRUChange((event, mru) => {
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
    window.electron.resetSearch((event) => {
      // Handle the new search term here
      setSearchTerm("");

      // Focus the search bar
      if (searchRef.current) {
        searchRef.current.focus();
      }
    });
  }, []);

  if (isLoading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">Error: {error.message}</div>;

  const filteredCommands = commands.filter((command) => {
    let inTitle = command.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    let inDescription = command.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    let inTags =
      "tags" in command &&
      command.tags
        .map((tag) => tag.toLowerCase())
        .some((tag) => tag.includes(searchTerm.toLowerCase()));

    return inTitle || inDescription || inTags;
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
              document.getElementsByClassName("command-list-item")[0].focus();
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
    </div>
  );
};

function compareCommands(
  lastUsedList: never[],
  searchTerm: string
): ((a: Command, b: Command) => number) | undefined {
  return (a, b) => {
    let aIndex = lastUsedList.indexOf(a.title);
    let bIndex = lastUsedList.indexOf(b.title);

    // If equally matched rank, sort by whichever has the search term first
    if (aIndex === bIndex) {
      let aSearchIndex = a.title
        .toLowerCase()
        .indexOf(searchTerm.toLowerCase());
      let bSearchIndex = b.title
        .toLowerCase()
        .indexOf(searchTerm.toLowerCase());

      if (aSearchIndex === bSearchIndex) {
        return 0;
      } else if (aSearchIndex === -1) {
        return 1;
      } else if (bSearchIndex === -1) {
        return -1;
      } else {
        return aSearchIndex - bSearchIndex;
      }
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

export default CommandPalette;
