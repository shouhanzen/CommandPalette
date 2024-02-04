"use client";

import React, { useState, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const KeyPressListener = () => {
  // React UseHotkeys test
  useHotkeys(
    "Escape",
    () => {
      // Here you would navigate back to the command list
      console.log("Hiding command palette");
      window.electron.minimizeApp();
      return;
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
    }
  );

  return null;
};

export default KeyPressListener;
