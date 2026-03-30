"use client";

import MDEditor from "@uiw/react-md-editor";
import { getColors } from "../general/(Color Manager)/useColors";
import React from "react";

type Mode = "live" | "preview" | "edit";
export const THEME_MAP = {
  light: {
    backgroundColor: "#dbe4e8",
    color: "black",
  },
  dark: {
    backgroundColor: "#171717",
    color: "#ffffff",
  },
};
export default function MarkdownEditor({
  height = 350,
  value,
  setValue,
  mode,
  hideToolbar = true,
  theme = "dark",
}: {
  height: number;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  mode: Mode;
  hideToolbar: boolean;
  theme: "light" | "dark";
}) {
  const Colors = getColors();
  return (
    <div
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        //@ts-ignore
        WebkitScrollbar: { display: "none" },
      }}
    >
      <MDEditor
        // data-color-mode={theme}
        height={height}
        value={value}
        onChange={(val) => setValue(val || "")}
        preview={mode}
        hideToolbar={hideToolbar}
        spellCheck
        className={`rounded-lg ${
          mode !== "live"
            ? `${Colors.background.primary} ${Colors.text.primary}`
            : ""
        }`}
        style={{
          ...THEME_MAP[theme],
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          //@ts-ignore
          WebkitScrollbar: { display: "none" },
        }}
      />
    </div>
  );
}


