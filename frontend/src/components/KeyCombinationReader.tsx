"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "@/components/key-comb-reader.scss";

interface KeyCombinationReaderProps {
  onKeyCombination: (keyCombination: string[]) => void;
}

const KeyCombinationReader = ({
  onKeyCombination,
}: KeyCombinationReaderProps) => {
  const [keyComb, setKeyComb] = useState([] as string[]);
  const [keysDown, setKeysDown] = useState([] as string[]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent): void => {
      setKeysDown((prev) => [...prev, event.key]);
      setKeyComb((prev) => [...prev, event.key]); // Key comb is only additive
    };
    const keyUp = (event: KeyboardEvent): void => {
      setKeysDown((prev) => prev.filter((key) => key !== event.key));

      // If no other keys are pressed, the key combination is complete
      if (keysDown.length === 1) {
        onKeyCombination(keyComb);
        setKeyComb([]);
      }
    };

    // Whenever a key is pressed, collect all the keys that are pressed
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  function keyCombToString(keyComb: string[]): string {
    return keyComb.join(" + ");
  }

  return (
    <div className="key-comb-reader">
      <h1>{keyCombToString(keyComb)}</h1>
    </div>
  );
};

export default KeyCombinationReader;
