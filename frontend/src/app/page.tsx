"use client";

import React, { useState, useEffect } from "react";

const CommandPalette = () => {
  const [commands, setCommands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="command-palette">
      <input type="text" placeholder="Type a command" />
      <ul>
        {commands.map((command, index) => (
          <li key={index}>{command.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default CommandPalette;
