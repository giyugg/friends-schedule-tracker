"use client";

import { useEffect, useState } from "react";
import { getManilaNow } from "./schedule-utils";

export function useManilaTime(intervalMs = 30_000) {
  const [manilaNow, setManilaNow] = useState(() => getManilaNow());

  useEffect(() => {
    const syncTimeout = setTimeout(() => setManilaNow(getManilaNow()), 0);
    const intervalId = setInterval(
      () => setManilaNow(getManilaNow()),
      intervalMs
    );
    return () => {
      clearTimeout(syncTimeout);
      clearInterval(intervalId);
    };
  }, [intervalMs]);

  return manilaNow;
}
