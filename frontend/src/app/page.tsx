"use client";

import React, { useState, useEffect, useRef } from "react";

const CommandPalette = () => {
  const [commands, setCommands] = useState([]);
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
  }, []);

  // Fetch last used list on mount
  useEffect(() => {
    // TODO: This
    // fetchLastUsedList();
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
    window.electron.setSearchTerm((event, term) => {
      // Handle the new search term here
      setSearchTerm(term);
    });
  }, []);

  if (isLoading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">Error: {error.message}</div>;

  const filteredCommands = commands.filter((command) =>
    command.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <strong>{command.title}</strong>
              <p>{command.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;
