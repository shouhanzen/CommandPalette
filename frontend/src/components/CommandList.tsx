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
  let highlightFirst = searchBarFocused && commands.length > 0;

  return (
    <ul className="command-list">
      {commands.map((command, index) =>
        commandToEntry(highlightFirst && index == 0, index, runCommand, command)
      )}
    </ul>
  );
};

function commandToEntry(
  tintHighlight: boolean,
  index: number,
  runCommand: (command: Command) => void,
  command: Command
): React.JSX.Element {
  function tryRunCommand(): void {
    if (command.disabled) {
      console.log("Command is disabled");
      return;
    }

    return runCommand(command);
  }

  return (
    <li
      className={`command-list-item ${tintHighlight ? "highlighted" : ""} ${
        command.disabled ? "disabled" : ""
      }`}
      key={index}
      tabIndex={index}
      onClick={() => tryRunCommand()}
      onKeyUp={(event) => {
        if (event.key === "Enter") {
          tryRunCommand();
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
  );
}

export default CommandList;
