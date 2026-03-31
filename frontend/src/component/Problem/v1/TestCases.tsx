"use client";

import React, { useState, useMemo, useEffect } from "react";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type TestCase = {
  id: string;
  input: string;
  output: string;
  testType: string;
};

type OutputCase = {
  input?: string;
  isCorrect?: boolean;
  passed?: boolean;
  output?: string;
  expectedOutput?: string;
  expected_output?: string;
  actualOutput?: string;
  actual_output?: string;
  stderr?: string;
  compileOutput?: string;
};

function TestCases({
  testCases = [],
  output = [],
  tab = "example",
}: {
  testCases?: TestCase[];
  output: OutputCase[];
  tab: "example" | "output";
}) {
  const Colors = getColors();

  const [mode, setMode] = useState<"example" | "output">("example");
  const [activeCase, setActiveCase] = useState(0);

  const exampleCases = useMemo(
    () => testCases.filter((t) => t.testType === "EXAMPLE"),
    [testCases],
  );

  useEffect(() => {
    setMode(tab);
  }, [tab]);

  const currentTest = exampleCases[activeCase];

  return (
    <div
      className={`
        h-full flex flex-col
        ${Colors.background.secondary}
        ${Colors.border.default}
        text-sm
      `}
    >
      {/* Top Tabs */}
      <div
        className={`
          flex gap-6 px-4 py-2
          ${Colors.background.primary}
          ${Colors.border.default}
        `}
      >
        {["example", "output"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setMode(tab as "example" | "output");
              setActiveCase(0);
            }}
            className={`
              relative pb-1 text-sm font-medium transition cursor-pointer
              ${
                mode === tab
                  ? `${Colors.text.primary}`
                  : `${Colors.text.secondary}`
              }
            `}
          >
            {tab === "example" ? "Example" : "Output"}

            {mode === tab && (
              <span
                className={`
                  absolute left-0 -bottom-2.25 h-0.5 w-full
                  ${Colors.background.heroPrimary}
                `}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= EXAMPLES ================= */}
        {mode === "example" && (
          <>
            {/* Testcase Selector */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {exampleCases.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveCase(index)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap
                    transition cursor-pointer
                    ${
                      activeCase === index
                        ? `${Colors.background.heroSecondaryFaded} ${Colors.text.primary}`
                        : `${Colors.background.primary} ${Colors.text.secondary} hover:${Colors.background.special}`
                    }
                    ${Colors.border.fadedThin}
                  `}
                >
                  Testcase {index + 1}
                </button>
              ))}
            </div>

            {/* Body */}
            {currentTest ? (
              <div className="space-y-4">
                {/* Input */}
                <div>
                  <p className={`mb-1 text-xs ${Colors.text.secondary}`}>
                    Input
                  </p>
                  <pre
                    className={`
                      rounded-lg p-3 space-y-1 font-mono text-sm
                      ${Colors.background.primary}
                      ${Colors.text.primary}
                      ${Colors.border.fadedThin}
                    `}
                  >
                    {currentTest.input}
                  </pre>
                </div>

                {/* Expected Output */}
                <div>
                  <p className={`mb-1 text-xs ${Colors.text.secondary}`}>
                    Expected Output
                  </p>
                  <pre
                    className={`
                      rounded-lg p-3 text-sm font-mono overflow-x-auto
                      ${Colors.background.primary}
                      ${Colors.border.fadedThin}
                      ${Colors.text.special}
                    `}
                  >
                    {currentTest.output}
                  </pre>
                </div>
              </div>
            ) : (
              <p className={Colors.text.secondary}>No test cases available.</p>
            )}
          </>
        )}

        {/* ================= OUTPUT ================= */}
        {mode === "output" && (
          <>
            {output.length === 0 ? (
              <p className={Colors.text.secondary}>No output available.</p>
            ) : (
              <>
                {/* Selector */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {output.map((o, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveCase(index)}
                      className={`
                        px-3 py-1.5 rounded-md text-xs font-medium
                        ${Colors.border.fadedThin}
                        ${
                          activeCase === index
                            ? `${Colors.background.heroSecondaryFaded} ${Colors.text.primary}`
                            : `${Colors.background.primary} ${Colors.text.secondary}`
                        }
                      `}
                    >
                      Test {index + 1}
                    </button>
                  ))}
                </div>

                {/* Active Output */}
                {output[activeCase] &&
                  (() => {
                    const o = output[activeCase];
                    const parsedInput = o.input;
                    const isPassed = o.isCorrect ?? o.passed ?? false;
                    const expectedOutput = o.expectedOutput ?? o.expected_output ?? "-";
                    const actualOutput =
                      o.actualOutput ?? o.actual_output ?? o.output ?? o.stderr ?? "-";

                    if (o.compileOutput) {
                      return (
                        <div className="rounded-xl p-4 space-y-3 border border-red-500/40 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                          <div className="flex justify-between items-center">
                            <span className={`text-xs ${Colors.text.secondary}`}>
                              Compiler Result
                            </span>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                              Error
                            </span>
                          </div>

                          <div>
                            <p className={`mb-1 text-xs ${Colors.text.secondary}`}>
                              Compiler Error
                            </p>
                            <pre
                              className={`
                            rounded-md p-3 font-mono text-sm whitespace-pre-wrap
                            ${Colors.background.secondary}
                            ${Colors.border.fadedThin}
                            text-red-400
                          `}
                            >
                              {o.compileOutput}
                            </pre>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        className={`
    rounded-xl p-4 space-y-4 border
    transition-all duration-300
    ${
      isPassed
        ? "bg-green-500/5 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
        : "bg-red-500/5 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
    }
  `}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-xs ${Colors.text.secondary}`}>
                            Testcase {activeCase + 1}
                          </span>
                          <span
                            className={`
    text-xs font-semibold px-2 py-1 rounded-full
    ${
      isPassed
        ? "bg-green-500/20 text-green-400"
        : "bg-red-500/20 text-red-400"
    }
  `}
                          >
                            {isPassed ? "Passed" : "Failed"}
                          </span>
                        </div>

                        {/* Input */}
                        <div>
                          <p
                            className={`mb-1 text-xs ${Colors.text.secondary}`}
                          >
                            Input
                          </p>
                          <pre
                            className={`
                            rounded-md p-2 font-mono text-sm
                            ${Colors.background.secondary}
                            ${Colors.text.primary}
                            ${Colors.border.fadedThin}
                          `}
                          >
                            {parsedInput}
                          </pre>
                        </div>

                        {/* Expected */}
                        <div>
                          <p
                            className={`mb-1 text-xs ${Colors.text.secondary}`}
                          >
                            Expected Output
                          </p>
                          <pre
                            className={`
                            rounded-md p-2 font-mono text-sm
                            ${Colors.background.secondary}
                            ${Colors.border.fadedThin}
                            ${Colors.text.primary}
                          `}
                          >
                            {expectedOutput}
                          </pre>
                        </div>

                        {/* Actual */}
                        <div>
                          <p
                            className={`mb-1 text-xs ${Colors.text.secondary}`}
                          >
                            Your Output
                          </p>
                          <pre
                            className={`
                            rounded-md p-2 font-mono text-sm
                            ${Colors.background.secondary}
                            ${Colors.border.fadedThin}
${isPassed ? "text-green-400" : "text-red-400"}
                          `}
                          >
                            {actualOutput}
                          </pre>
                        </div>
                      </div>
                    );
                  })()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TestCases;


