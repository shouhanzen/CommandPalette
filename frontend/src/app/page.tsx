"use client";

import React, { useState, useEffect, useRef } from "react";
import CommandList from "../components/CommandList";
import SearchBar from "../components/SearchBar";
import { getTermOverlap, compareCommands } from "../lib/commands";

const CommandPalette = () => {
  const [commands, setCommands] = useState([] as Command[]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const searchRef = useRef(null as HTMLInputElement | null);

  const [lastUsedList, setLastUsedList] = useState([] as string[]);

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
    console.log("Fetching commands");

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
    return KeyCaptureEffect(searchRef);
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
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchRef={searchRef}
          setSearchBarFocused={setSearchBarFocused}
          runCommand={runCommand}
          filteredCommands={filteredCommands}
        />
      </div>

      <div className="command-palette-body">
        <CommandList
          commands={filteredCommands}
          runCommand={runCommand}
          searchBarFocused={searchBarFocused}
        />
      </div>
    </div>
  );
};

function KeyCaptureEffect(
  searchRef: React.MutableRefObject<HTMLInputElement | null>
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      window.electron.minimizeApp();
      return;
    }

    if (event.ctrlKey && event.key === "r") {
      event.preventDefault();

      // Reload page
      window.location.reload();

      console.log("Reloading page");
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
}

export default CommandPalette;
