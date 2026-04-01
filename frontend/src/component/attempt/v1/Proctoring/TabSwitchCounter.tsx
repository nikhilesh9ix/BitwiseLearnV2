import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export function useTabSwitchCounter(started: boolean) {
  const [count, setCount] = useState(0);
  const lastHiddenTime = useRef<number | null>(null);
  const startedRef = useRef(started);

  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!startedRef.current) return;

      if (document.hidden) {
        lastHiddenTime.current = Date.now();
      } else {
        if (lastHiddenTime.current !== null) {
          setCount((prev) => prev + 1);

          lastHiddenTime.current = null;
        }
      }
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (count === 0) return;

    toast.error(`Tab switch detected (${count}/3)`, {
      duration: 1500,
      position: "top-right",
      style: { background: "#000", color: "#fff" },
    });
  }, [count]);

  return count;
}
