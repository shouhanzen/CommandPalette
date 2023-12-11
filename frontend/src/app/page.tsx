"use client";

import React, { useState, useEffect, useRef } from "react";

const CommandPalette = () => {
  const [commands, setCommands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef(null);

  const fetchCommands = async () => {
    try {
      const commands = await window.electron.invoke("get-commands", {});
      setCommands(commands);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch commands on mount
  useEffect(() => {
    fetchCommands();
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const filteredCommands = commands.filter((command) =>
    command.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="command-palette">
      <input
        ref={searchRef}
        type="text"
        className="command-input"
        placeholder="Type a command"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onKeyUp={(event) => {
          if (event.key === "Enter" && filteredCommands.length > 0) {
            window.electron.runCommand(filteredCommands[0]);
          }

          if (event.ctrlKey && event.key === "r") {
            event.preventDefault();
            fetchCommands();
          }
        }}
      />
      <ul className="command-list">
        {filteredCommands.map((command, index) => (
          <li
            className="command-list-item"
            key={index}
            tabIndex={index}
            onClick={() => window.electron.runCommand(command)}
            onKeyUp={(event) => {
              if (event.key === "Enter") {
                window.electron.runCommand(command);
              }
            }}
          >
            <strong>{command.title}</strong>
            <p>{command.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommandPalette;
