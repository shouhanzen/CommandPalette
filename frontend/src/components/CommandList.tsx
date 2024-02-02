import React, { useState, useEffect, useRef } from "react";

interface CommandListInterface {
  commands: Command[];
  runCommand: (command: Command) => void;
  searchBarFocused: boolean;
}

const CommandList = ({
  commands,
  runCommand,
  searchBarFocused,
}: CommandListInterface) => {
  return (
    <ul className="command-list">
      {commands.map((command, index) => (
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
  );
};

export default CommandList;
