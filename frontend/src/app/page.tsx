"use client";

import React, { useState, useEffect } from "react";

const CommandPalette = () => {
  const [commands, setCommands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch commands from the Electron backend
  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const response = await fetch("http://localhost:8000/commands");
        console.log(response);
        const data = await response.json();
        setCommands(data.commands);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommands();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.electron.minimizeApp();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const filteredCommands = commands.filter((command) =>
    command.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="command-palette">
      <input
        type="text"
        className="command-input"
        placeholder="Type a command"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onKeyUp={(event) => {
          if (event.key === "Enter" && filteredCommands.length > 0) {
            window.electron.runCommand(filteredCommands[0]);
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
            onKeyPress={(event) => {
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
