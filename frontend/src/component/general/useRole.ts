"use client";

import { useState } from "react";

export type Role =
  | "STUDENT"
  | "TEACHER"
  | "ADMIN"
  | "SUPERADMIN"
  | "INSTITUTION"
  | "VENDOR"
  | null;

function getStoredRole(): Role {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("accessToken");
  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    const rawRole = String(payload?.type ?? payload?.role ?? "").toUpperCase();

    if (
      rawRole === "STUDENT" ||
      rawRole === "TEACHER" ||
      rawRole === "ADMIN" ||
      rawRole === "SUPERADMIN" ||
      rawRole === "INSTITUTION" ||
      rawRole === "VENDOR"
    ) {
      return rawRole as Role;
    }
  } catch {
    return null;
  }

  return null;
}

export function useRole() {
  const [role] = useState<Role>(() => getStoredRole());

  return role?.toLowerCase() || null;
}
