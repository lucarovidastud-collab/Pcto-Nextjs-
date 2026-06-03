"use client";

import { useEffect } from "react";

/** Le proposte pubbliche hanno resa fissa (documento chiaro), indipendente dal tema Chrome/OS. */
export function ProposalThemeLock() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = "light";
    root.style.colorScheme = "light";
    return () => {
      if (previous) root.dataset.theme = previous;
      else delete root.dataset.theme;
      root.style.colorScheme = "";
    };
  }, []);

  return null;
}
