"use client";

import { useEffect, useState } from "react";

export default function useLogs() {
  const [role, setRole] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        // /api/logs is a Next.js route — must use relative fetch, not axiosInstance (which points to backend)
        const response = await fetch("/api/logs");
        if (!response.ok) throw new Error("Failed to fetch role");
        const json = await response.json();
        setRole(json.data);
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "Failed to fetch role");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  return { role, loading, error };
}
