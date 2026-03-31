"use client";

import { runCode, submitCode } from "@/api/problems/run-code";
import { Editor } from "@monaco-editor/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Send, Timer, Pause, RotateCcw } from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";
import toast from "react-hot-toast";

const languageOptions = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
  { label: "C", value: "c" },
];

const STARTER_CODE: Record<string, string> = {
  javascript: 'console.log("Hello, World!");',
  typescript: 'console.log("Hello, World!");',
  python: 'print("Hello, World!")',
  java:
    "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, World!\");\n  }\n}",
  cpp:
    "#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << \"Hello, World!\" << endl;\n  return 0;\n}",
  c: "#include <stdio.h>\n\nint main() {\n  printf(\"Hello, World!\\n\");\n  return 0;\n}",
};

const normalizeLanguage = (lang: string) => {
  const normalized = (lang || "").toLowerCase().trim();
  if (normalized === "c++" || normalized === "cxx") {
    return "cpp";
  }
  return normalized;
};

const toReadableOutput = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => toReadableOutput(entry))
      .filter((entry) => entry.trim().length > 0)
      .join("\n");
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred =
      record.message ?? record.detail ?? record.error ?? record.msg;
    if (preferred) {
      return toReadableOutput(preferred);
    }

    try {
      return JSON.stringify(record, null, 2);
    } catch {
      return "Execution failed";
    }
  }

  if (value == null) {
    return "";
  }

  return String(value);
};

const hasLanguageOption = (value: string) =>
  languageOptions.some((option) => option.value === value);

export default function CodeEditor({
  template,
  questionId,
  output: setOutput,
  customSubmit,
  setTab,
  showSubmit = true,
}: {
  template?: any[];
  questionId: string;
  output: any;
  customSubmit?: (language: string, code: string) => void;
  setTab: any;
  showSubmit?: boolean;
}) {
  const Colors = getColors();
  const theme = useTheme();

  const templatesByLanguage = useMemo(() => {
    const map: Record<string, any> = {};
    template?.forEach((t) => {
      const normalized = normalizeLanguage(t?.language);
      if (normalized && hasLanguageOption(normalized)) {
        map[normalized] = t;
      }
    });
    return map;
  }, [template]);

  const firstTemplateLanguage = normalizeLanguage(template?.[0]?.language || "");
  const defaultLang = hasLanguageOption(firstTemplateLanguage)
    ? firstTemplateLanguage
    : "python";

  const defaultCode =
    template?.[0]?.defaultCode ||
    template?.[0]?.functionBody ||
    STARTER_CODE[defaultLang];

  const [language, setLanguage] = useState(defaultLang);
  const [code, setCode] = useState(defaultCode);

  /* ---------------- TIMER STATE ---------------- */
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleTimer = () => {
    if (running) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setRunning(false);
    } else {
      setRunning(true);
      timerRef.current = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setTime(0);
    setRunning(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  /* ------------------------------------------------ */

  const handleRun = async () => {
    try {
      setOutput([]);
      toast.loading("Running TestCase", { id: "run" });
      resetTimer();

      const res = await runCode({
        language,
        code,
        problemId: questionId,
      });

      const payload = res?.data ?? res ?? {};
      const testCases = Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload?.testCases)
          ? payload.testCases
          : [];

      const compileMessage =
        payload?.compileOutput ||
        payload?.stderr ||
        payload?.error ||
        (payload?.message && payload.message !== "Code executed"
          ? payload.message
          : "");

      if (testCases.length > 0) {
        setOutput(testCases);
      } else if (compileMessage) {
        setOutput([
          {
            isCorrect: false,
            compileOutput: toReadableOutput(compileMessage),
          },
        ]);
      } else {
        setOutput([]);
      }

      setTab("output");
      toast.success("Execution Completed", { id: "run" });
    } catch {
      setOutput([]);
      setTab("output");
      toast.error("Failed to run code", { id: "run" });
    }
  };

  const handleSubmit = async () => {
    toast.loading("Submitting Code", { id: "submit" });
    if (customSubmit) {
      await customSubmit(language, code);
    } else {
      await submitCode({
        language,
        code,
        problemId: questionId,
      });
    }
    toast.success("Code Submitted", { id: "submit" });
  };

  useEffect(() => {
    const templateLanguages = Object.keys(templatesByLanguage);
    if (templateLanguages.length === 0) {
      return;
    }

    if (!templateLanguages.includes(language)) {
      setLanguage(templateLanguages[0]);
    }
  }, [templatesByLanguage, language]);

  useEffect(() => {
    const tpl = templatesByLanguage[language];
    if (!tpl) {
      setCode((prev) => (prev.trim() ? prev : STARTER_CODE[language] || ""));
      return;
    }

    if (tpl.defaultCode?.trim()) {
      setCode(tpl.defaultCode);
    } else if (tpl.functionBody) {
      setCode(tpl.functionBody);
    } else {
      setCode(STARTER_CODE[language] || "");
    }
  }, [language, templatesByLanguage]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "'") {
        e.preventDefault();
        handleRun();
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [code, language]);

  return (
    <div
      className={`
        flex h-full w-full flex-col overflow-hidden
        ${Colors.background.secondary}
        ${Colors.border.defaultThin}
      `}
    >
      {/* Top Bar */}
      <div
        className={`
          flex items-center justify-between px-4 py-2
          ${Colors.background.primary}
          ${Colors.border.default}
        `}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${Colors.text.primary}`}>
            Code Editor
          </span>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Select programming language"
            title="Select programming language"
            className={`
              rounded-md px-3 py-1.5 text-xs outline-none cursor-pointer
              ${Colors.background.secondary}
              ${Colors.text.secondary}
              ${Colors.border.fadedThin}
            `}
          >
            {languageOptions.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Stopwatch */}
          <div
            className={`
              flex items-center gap-2 rounded-md px-2 py-1
              ${Colors.background.secondary}
              ${Colors.border.fadedThin}
              ${Colors.text.primary}
            `}
          >
            <Timer
              size={16}
              className="cursor-pointer"
              onClick={() => setShowTimer((p) => !p)}
            />

            {showTimer && (
              <>
                <button onClick={toggleTimer}>
                  {running ? <Pause size={14} /> : <Play size={14} />}
                </button>

                <RotateCcw
                  size={14}
                  className={"cursor-pointer" + `${Colors.text.primary}`}
                  onClick={resetTimer}
                />

                <span className="text-xs font-mono tabular-nums">
                  {String(Math.floor(time / 60)).padStart(2, "0")}:
                  {String(time % 60).padStart(2, "0")}
                </span>
              </>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={handleRun}
              className={`
      flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium
      ${Colors.background.heroSecondaryFaded}
      ${Colors.text.primary}
      hover:opacity-90 transition cursor-pointer
    `}
            >
              <Play size={14} />
              Run
            </button>

            <div
              className={`
      pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2
      whitespace-nowrap rounded-md px-3 py-0.5 text-[13px]
      opacity-0 group-hover:opacity-100 transition
      ${Colors.background.primary}
      ${Colors.border.fadedThin}
      ${Colors.text.secondary}
      z-10
    `}
            >
              Ctrl + '
            </div>
          </div>

          <div className="relative group">
            {showSubmit && (
              <button
                onClick={handleSubmit}
                className={`
      flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium
      ${Colors.background.heroPrimary}
      ${Colors.text.black}
      hover:opacity-90 transition cursor-pointer
    `}
              >
                <Send size={14} />
                Submit
              </button>
            )}

            <div
              className={`
      pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2
      whitespace-nowrap rounded-md px-3 py-0.5 text-[13px]
      opacity-0 group-hover:opacity-100 transition
      ${Colors.background.primary}
      ${Colors.border.fadedThin}
      ${Colors.text.secondary}
      z-10
    `}
            >
              Ctrl + Enter
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
          theme={theme.theme === "Dark" ? "vs-dark" : "vs-light"}
          options={{
            fontSize: 14,
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            mouseWheelZoom: true,
            tabSize: 2,
            cursorBlinking: "smooth",
            fontLigatures: true,
            smoothScrolling: true,
            formatOnPaste: true,
            formatOnType: true,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}


