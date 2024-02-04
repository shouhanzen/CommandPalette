"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRecordHotkeys } from "react-hotkeys-hook";

import "@/app/styles.scss";
import "@/app/settings/settings-styles.scss";
import KeyCombinationReader from "@/components/KeyCombinationReader";

interface Shortcut {
  name: string;
  id: string;
  keys: Set<string>;
}

const SettingsPage: React.FC = () => {
  const [shortcuts, setShortcuts] = useState([
    {
      name: "Open Command Palette",
      id: "win_open",
      keys: new Set<string>(["Control", "Shift", "P"]),
    },
  ] as Shortcut[]);

  const [editingShortcut, setEditingShortcut] = useState(-1);

  const router = useRouter();
  const [keys, { start, stop, isRecording }] = useRecordHotkeys();

  const saveSettings = () => {
    // Here you would save the shortcut to your backend or local storage

    let shortcuts_block: { [id: string]: string } = {};
    for (let i = 0; i < shortcuts.length; i++) {
      shortcuts_block[shortcuts[i].id] = keyCombToString(shortcuts[i].keys);
    }

    // Convert shortcuts to settings format
    let settings = {
      shortcuts: shortcuts_block,
    };
    window.electron.saveSettings(settings);
    console.log("Shortcuts saved: ", settings);
  };

  const backToCommandList = () => {
    // Here you would navigate back to the command list
    router.push("/");
  };

  function startRecording(index: number) {
    setEditingShortcut(index);
    start();
  }

  function stopRecording() {
    // Here you would update the shortcut in the state

    console.log("Key combination discovered: " + keys);

    let newShortcuts = [...shortcuts];
    newShortcuts[editingShortcut].keys = keys;
    setShortcuts(newShortcuts);

    setEditingShortcut(-1);
    stop();
  }

  function keyCombToString(keyComb: Set<string>): string {
    let keyCombArr = Array.from(keyComb);

    for (let i = 0; i < keyCombArr.length; i++) {
      if (keyCombArr[i] === " ") {
        keyCombArr[i] = "Space";
      }

      // Capitalize the first letter
      keyCombArr[i] =
        keyCombArr[i].charAt(0).toUpperCase() + keyCombArr[i].slice(1);

      // Replace "Control" with "Ctrl"
      if (keyCombArr[i] === "Control") {
        keyCombArr[i] = "Ctrl";
      }
    }

    return keyCombArr.join("+");
  }

  return (
    <div className="command-palette">
      <div className="settings-panel">
        <h1>Settings</h1>

        {shortcuts.map((shortcut, index) => (
          <div className="shortcut-section" key={index}>
            <label htmlFor="shortcut" className="shortcut-name">
              {shortcut.name}
            </label>
            <h2
              className="shortcut-key-comb highlight-on-hover"
              onClick={() => {
                startRecording(index);
              }}
            >
              {keyCombToString(shortcut.keys)}
            </h2>
          </div>
        ))}

        <div className="button-section">
          <button onClick={saveSettings} className="highlight-on-hover">
            Save
          </button>
          <button onClick={backToCommandList} className="highlight-on-hover">
            Back
          </button>
        </div>

        {isRecording && (
          <div className="recording-overlay">
            <div className="recording-box">
              <h1>Recording...</h1>
              <h2>{keyCombToString(keys)}</h2>
              <button onClick={stopRecording}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
