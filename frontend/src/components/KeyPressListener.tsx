"use client";

import React, { useState, useEffect, useRef } from "react";

const KeyPressListener = () => {
  // On escape pressed, go back to the command list
  const handleGlobalKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      // Here you would navigate back to the command list
      console.log("Hiding command palette");
      window.electron.minimizeApp();
      return;
    }
  };

  useEffect(() => {
    // Add event listener for escape key
    window.addEventListener("keydown", handleGlobalKey);

    return () => {
      window.removeEventListener("keydown", handleGlobalKey);
    };
  }, []);

  return null;
};

export default KeyPressListener;
