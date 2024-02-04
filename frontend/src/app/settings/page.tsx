"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import "@/app/styles.scss";
import "@/app/settings/settings-styles.scss";
import KeyCombinationReader from "@/components/KeyCombinationReader";

interface Shortcut {
  name: string;
  keys: string;
}

const SettingsPage: React.FC = () => {
  const [shortcuts, setShortcuts] = useState([
    {
      name: "Open Command Palette",
      keys: "Ctrl + Shift + P",
    },
  ] as Shortcut[]);
  const [recordingShortcut, setRecordingShortcut] = useState(false);
  const router = useRouter();

  const saveShortcut = () => {
    // Here you would save the shortcut to your backend or local storage
  };

  const backToCommandList = () => {
    // Here you would navigate back to the command list
    router.push("/");
  };

  const beginRecordingShortcut = () => {
    setRecordingShortcut(true);
  };

  return (
    <div className="command-palette">
      <div className="settings-panel">
        <h1>Settings</h1>

        {shortcuts.map((shortcut) => (
          <div className="shortcut-section">
            <label htmlFor="shortcut">{shortcut.name}</label>
            <button onClick={beginRecordingShortcut}>Record</button>
          </div>
        ))}

        <div className="button-section">
          <button onClick={saveShortcut}>Save</button>
          <button onClick={backToCommandList}>Back</button>
        </div>

        {recordingShortcut && (
          <KeyCombinationReader
            onKeyCombination={(keyCombination) => {
              console.log(keyCombination);
              setRecordingShortcut(false);
            }}
          ></KeyCombinationReader>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
