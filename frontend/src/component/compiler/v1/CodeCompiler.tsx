"use client";
import axiosInstance from "@/lib/axios";
import { Editor } from "@monaco-editor/react";
import { useColors } from "@/component/general/(Color Manager)/useColors";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";
import {
  Play,
  Timer,
  Pause,
  RotateCcw,
  Maximize,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import logo from "../../../../public/images/Logo.png";

const LANGUAGE_CONFIG: Record<string, any> = {
  python: {
    monaco: "python",
    boilerplate: `print("Hello, World!")`,
  },
  javascript: {
    monaco: "javascript",
    boilerplate: `console.log("Hello, World!");`,
  },
  java: {
    monaco: "java",
    boilerplate: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}`,
  },
  c: {
    monaco: "c",
    boilerplate: `#include <stdio.h>

int main() {
  printf("Hello, World!\\n");
  return 0;
}`,
  },
  cpp: {
    monaco: "cpp",
    boilerplate: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello, World!" << endl;
  return 0;
}`,
  },
};

const Tooltip = ({ label }: { label: string }) => (
  <div
    className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap
    bg-black text-xs text-white px-2 py-1 rounded-md
    opacity-0 group-hover:opacity-100
    transition-opacity duration-200
    pointer-events-none z-50"
  >
    {label}
  </div>
);

function CodeCompiler() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGE_CONFIG.python.boilerplate);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editorWidth, setEditorWidth] = useState(68);
  const [inputHeight, setInputHeight] = useState(50);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEscHint, setShowEscHint] = useState(false);
  const [showStopwatch, setShowStopwatch] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  // Change boilerplate when language changes
  useEffect(() => {
    setCode(LANGUAGE_CONFIG[language].boilerplate);
  }, [language]);

  const toggleTimer = () => {
    if (running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRunning(false);
    } else {
      setRunning(true);
      timerRef.current = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTime(0);
    setRunning(false);
  };

  const runCode = async () => {
    setLoading(true);
    setOutput("Running...");

    try {
      const res = await axiosInstance.post("/api/v1/code/compile", {
        code,
        language: language === "cpp" ? "c++" : language,
        stdin: input,
      });

      const payload = res.data?.data ?? res.data ?? {};
      if (payload.signal === "SIGKILL") {
        setOutput("Execution timed out or was terminated.");
      } else if (payload.stderr) {
        setOutput(payload.stderr);
      } else {
        setOutput(payload.stdout || "No output");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Execution failed.";
      setOutput(message);
    } finally {
      setLoading(false);
      resetTimer();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowEscHint(true);

      setTimeout(() => setShowEscHint(false), 3000);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onExit = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setShowEscHint(false);
      }
    };

    document.addEventListener("fullscreenchange", onExit);
    return () => document.removeEventListener("fullscreenchange", onExit);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const Skeleton = () => {
    return (
      <div className="flex flex-col w-full h-screen bg-[#0f172a] p-4 animate-pulse">
        <div className="h-10 bg-slate-800 rounded mb-4" />

        <div className="flex flex-1 gap-3">
          <div className="w-2/3 bg-slate-800 rounded" />
          <div className="flex flex-col w-1/3 gap-3">
            <div className="h-1/2 bg-slate-800 rounded" />
            <div className="h-1/2 bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!loading) runCode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, runCode]);

  if (pageLoading) {
    return <Skeleton />;
  }

  const Colors = useColors();
  const theme = useTheme();

  return (
    <div
      className={`flex flex-col w-full h-screen ${Colors.background.primary} ${Colors.text.primary}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-6 py-3 border-b border-slate-700 ${Colors.background.primary}`}
      >
        <div className="flex gap-2 items-center">
          <div className="mt-1">
            <Image src={logo} alt="Logo" height={40} />
          </div>
          <h1 className="font-semibold text-xl tracking-wide">
            Bitwise Learn Compiler
          </h1>
        </div>

        <div className="flex gap-3 items-center">
          <div
            className={`flex items-center ${Colors.background.secondary} border ${Colors.border.defaultThin} rounded-lg
  transition-all duration-300 ease-out
  ${showStopwatch ? "px-1 gap-2 w-40 py-1" : "w-9 h-9 justify-center"}`}
          >
            {/* Stopwatch icon (always visible) */}
            <div className="relative group">
              <Timer
                size={18}
                onClick={() => setShowStopwatch((p) => !p)}
                className="text-blue-400 cursor-pointer hover:scale-110 transition"
              />
              <Tooltip label="Stopwatch" />
            </div>

            {/* Expanded content */}
            {showStopwatch && (
              <div className="flex items-center gap-3 animate-fadeIn">
                <div className="relative group">
                  <button onClick={toggleTimer}>
                    {running ? (
                      <Pause
                        size={16}
                        className="text-blue-400 hover:scale-110 transition cursor-pointer"
                      />
                    ) : (
                      <Play
                        size={16}
                        className="text-blue-400 hover:scale-110 transition cursor-pointer"
                      />
                    )}
                  </button>
                  <Tooltip label={running ? "Pause" : "Play"} />
                </div>

                <div className="relative group">
                  <RotateCcw
                    size={16}
                    onClick={resetTimer}
                    className="text-blue-400 hover:rotate-180 transition cursor-pointer"
                  />
                  <Tooltip label="Reset" />
                </div>

                <span className="text-base font-mono text-blue-400 tabular-nums tracking-wider">
                  {String(Math.floor(time / 60)).padStart(2, "0")}:
                  {String(time % 60).padStart(2, "0")}
                </span>
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={toggleFullscreen}
              className={`p-2 ${Colors.background.secondary} rounded ${Colors.border.defaultThin} cursor-pointer`}
            >
              <Maximize className="text-blue-400" size={18} />
            </button>
            <Tooltip label="Fullscreen" />
          </div>

          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((p) => !p)}
              className={`${Colors.background.secondary} px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium border ${Colors.border.defaultThin}`}
            >
              {language.toUpperCase()}
              {langOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {langOpen && (
              <div
                className={`absolute right-0 mt-2 w-40 ${Colors.background.secondary} rounded-xl border ${Colors.border.defaultThin} shadow-lg overflow-hidden z-50`}
              >
                {Object.keys(LANGUAGE_CONFIG).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setLangOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/5"
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={runCode}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-5 py-2 rounded-md text-sm font-semibold shadow hover:shadow-md transition"
            >
              <Play size={16} /> Run
            </button>

            <Tooltip label="Run (Ctrl + Enter)" />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div style={{ width: `${editorWidth}%` }} className="relative z-0">
          <Editor
            language={LANGUAGE_CONFIG[language].monaco}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme={theme.theme === "Dark" ? "vs-dark" : "vs-light"}
            options={{
              fontSize: 15,
              lineHeight: 22,
              fontFamily: "JetBrains Mono, Fira Code, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
              mouseWheelZoom: true,
              tabSize: 2,
              cursorBlinking: "smooth",
              fontLigatures: true,
            }}
            className="p-1"
          />
        </div>
        <div
          className={`w-1 cursor-col-resize ${Colors.background.primary} hover:bg-slate-500`}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = editorWidth;

            const onMouseMove = (ev: MouseEvent) => {
              const delta = ((ev.clientX - startX) / window.innerWidth) * 100;

              const nextWidth = Math.min(80, Math.max(30, startWidth + delta));
              setEditorWidth(nextWidth);
            };

            const onMouseUp = () => {
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
          }}
        />

        <div
          style={{ width: `${100 - editorWidth}%` }}
          className={`h-[90svh] min-w-75 flex flex-col border-l ${Colors.background.primary}`}
        >
          {/* Input */}
          <div style={{ height: `${inputHeight}%` }} className="min-h-30 p-3">
            <p
              className={`text-sm font-medium ${Colors.text.secondary} mb-2 uppercase tracking-wide`}
            >
              Input
            </p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`w-full h-full ${Colors.background.secondary} ${Colors.border.defaultThin} rounded p-2 text-sm resize-y overflow-auto`}
              placeholder="Enter input here..."
            />
          </div>
          <div
            className={`h-1 top-6 cursor-row-resize bg-slate-700 transition relative z-10`}
            onMouseDown={(e) => {
              const startY = e.clientY;
              const startHeight = inputHeight;

              const onMouseMove = (ev: MouseEvent) => {
                const delta =
                  ((ev.clientY - startY) / window.innerHeight) * 100;

                const nextHeight = Math.min(
                  70,
                  Math.max(30, startHeight + delta),
                );
                setInputHeight(nextHeight);
              };

              const onMouseUp = () => {
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
              };

              window.addEventListener("mousemove", onMouseMove);
              window.addEventListener("mouseup", onMouseUp);
            }}
          />

          {/* Output */}
          <div
            style={{ height: `${100 - inputHeight - 2}%` }}
            className={`min-h-30 p-3 border-t ${Colors.border.defaultThin} my-5`}
          >
            <p
              className={`text-xs font-medium ${Colors.text.secondary} mb-2 uppercase tracking-wide`}
            >
              Output
            </p>
            <textarea
              value={output}
              readOnly
              className={`w-full h-full ${Colors.background.secondary} border ${Colors.border.defaultThin} rounded p-2 text-sm resize-y overflow-auto text-emerald-400`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeCompiler;
