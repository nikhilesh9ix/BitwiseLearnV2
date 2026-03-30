"use client";

import { getColors } from "@/component/general/(Color Manager)/useColors";

export default function TestCaseSection({ testCases }: { testCases: any[] }) {
  const Colors = getColors();

  if (!testCases || testCases.length === 0) return null;

  const parseInput = (input: string) => {
    try {
      return input;
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-5">
      {testCases.map((test: any, index: number) => {
        const parsedInput = parseInput(test.input);

        return (
          <div
            key={test.id}
            className={`
              rounded-2xl overflow-hidden
              ${Colors.background.primary}
              ${Colors.border.fadedThin}
            `}
          >
            {/* Header */}
            <div
              className={`
                flex items-center justify-between px-5 py-3
                ${Colors.background.secondary}
                ${Colors.border.default}
              `}
            >
              <span
                className={`text-xs font-medium tracking-wide uppercase ${Colors.text.primary}`}
              >
                {test.testType} {index + 1}
              </span>
            </div>

            <div className={`p-5 space-y-5 text-sm ${Colors.text.secondary}`}>
              {/* Input */}
              <div
                className={`
                  rounded-xl
                  ${Colors.background.secondary}
                  ${Colors.border.fadedThin}
                `}
              >
                <div
                  className={`
                    px-4 py-2 text-xs font-semibold
                    ${Colors.border.default}
                    ${Colors.text.special}
                  `}
                >
                  Input
                </div>

                <pre className="p-4 space-y-1 font-mono text-sm">
                  {parsedInput}
                </pre>
              </div>

              {/* Output */}
              <div
                className={`
                  rounded-xl
                  ${Colors.background.secondary}
                  ${Colors.border.fadedThin}
                `}
              >
                <div
                  className={`
                    px-4 py-2 text-xs font-semibold
                    ${Colors.border.default}
                    ${Colors.text.special}
                  `}
                >
                  Output
                </div>

                <div className="p-4 font-mono text-sm">{test.output}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


