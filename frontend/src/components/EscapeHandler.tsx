"use client";

import React, { useState, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import "@/components/escape-handler.scss";

const EscapeHandler = () => {
  const hidePalette = () => {
    console.log("Hiding command palette");
    window.electron.minimizeApp();
  };

  // React UseHotkeys test
  useHotkeys("Escape", hidePalette, {
    enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
  });

  function onHeaderClick(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();

    if (event.target == event.currentTarget) {
      console.log("Area outside of command palette clicked");
      window.electron.minimizeApp();
    }
  }

  return <div className="escape-handler" onClick={onHeaderClick}></div>;
};

export default EscapeHandler;
