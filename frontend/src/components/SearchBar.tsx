import React, { useState, useEffect, useRef } from "react";

interface SearchBarInterface {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
  setSearchBarFocused: (searchBarFocused: boolean) => void;
  runCommand: (command: Command) => void;
  filteredCommands: Command[];
}

const SearchBar = ({
  searchTerm,
  setSearchTerm,
  searchRef,
  setSearchBarFocused,
  runCommand,
  filteredCommands,
}: SearchBarInterface) => {
  return (
    <input
      ref={searchRef}
      type="text"
      className="command-input"
      placeholder="Type a command..."
      value={searchTerm}
      onChange={(event) => setSearchTerm(event.target.value)}
      onKeyUp={(event) => {
        if (event.key === "Enter" && filteredCommands.length > 0) {
          runCommand(filteredCommands[0]);
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
      }}
      onFocus={() => {
        setSearchBarFocused(true);
      }}
    />
  );
};

export default SearchBar;
