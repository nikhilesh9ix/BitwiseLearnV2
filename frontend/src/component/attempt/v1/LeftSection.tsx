import React from "react";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import "./assignment.css";

type TestCase = {
  id: string;
  testType: string;
  input: string;
  output: string;
};

type Props = {
  question: string;
  currentIndex: number;
  totalQuestions: number;
  onNext: () => void;
  onPrevious: () => void;
  sectionName: string;
  sectionIndex: number;
  totalSections: number;
  sections: any[];
  onSectionSelect: (index: number) => void;
  testCases: TestCase[];
};

const Colors = getColors();

export default function LeftSection({
  question,
  currentIndex,
  totalQuestions,
  onNext,
  onPrevious,
  sectionIndex,
  sectionName,
  totalSections,
  sections,
  onSectionSelect,
  testCases,
}: Props) {
  return (
    <div
      className={`flex flex-col font-mono ${Colors.text.primary} ${Colors.background.secondary} h-full min-h-0 p-4 rounded-lg`}
    >
      {/* TOP CONTENT: SECTIONS (LEFT) + QUESTION (RIGHT) */}
      <div className="flex gap-3 flex-1 min-h-0 mb-4">
        {/* SECTION LIST (LEFT SIDE) */}
        <div
          className={`${Colors.background.primary} flex flex-col gap-2 w-22 shrink-0 p-3 rounded-xl`}
        >
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSectionSelect(i)}
              className={`px-3 py-2 rounded-md text-sm ${
                i === sectionIndex
                  ? Colors.border.specialThick
                  : Colors.border.fadedThick
              } flex items-center justify-center`}
            >
              {s.type === "NO_CODE" ? "MCQ" : "CODING"}
            </button>
          ))}
        </div>

        {/* QUESTION + TEST CASES (RIGHT SIDE) */}
        <div
          className={`${Colors.background.primary} flex-1 p-4 rounded-lg overflow-y-auto`}
        >
          <p className="text-lg">{question}</p>

          {testCases?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm opacity-70 mb-2">Example Test Cases</p>

              <div className="flex flex-col gap-3">
                {testCases.map((tc, index) => {
                  const parsedInput = tc.input;

                  return (
                    <div
                      key={tc.id}
                      className={`${Colors.background.secondary} p-3 rounded-md text-sm`}
                    >
                      <p className="opacity-70 mb-1">Example {index + 1}</p>

                      <p>
                        <span className="opacity-60">Input:</span>{" "}
                        <code className="opacity-90">
                          {parsedInput}
                          {/* array = [{parsedInput.array.join(", ")}], target ={" "}
                          {parsedInput.target} */}
                        </code>
                      </p>

                      <p>
                        <span className="opacity-60">Output:</span>{" "}
                        <code className={`${Colors.text.special}`}>
                          {tc.output}
                        </code>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="flex justify-between items-center mt-auto">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className={`${Colors.background.primary} group px-8 py-2 rounded-md hover:scale-105`}
        >
          <p className="button-wrap-left">Previous</p>
        </button>

        <div className="text-sm opacity-60 mb-2">
          Section {sectionIndex + 1} / {totalSections} — {sectionName}
        </div>

        <div>
          <span>Question: </span>
          <span className={`${Colors.text.special}`}>{currentIndex + 1}</span>
          <span> / </span>
          <span>{totalQuestions}</span>
        </div>

        <button
          onClick={onNext}
          disabled={
            currentIndex === totalQuestions - 1 &&
            sectionIndex === totalSections - 1
          }
          className={`${Colors.background.primary} group px-8 py-2 rounded-md hover:scale-105 hover:opacity-90`}
        >
          <p className="button-wrap-right">Next</p>
        </button>
      </div>
    </div>
  );
}


