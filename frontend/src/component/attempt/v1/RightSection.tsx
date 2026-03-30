"use client";

import "./assignment.css";
import { RefreshCcw, LogOut } from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type Props = {
  assignmentName: string;
  choices: string[];
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  onResetCurrentAnswer: () => void;
  onJumpToQuestion: (index: number) => void;
  onExit: () => void;
  onSubmit: () => void;
  questionIds: string[];
  userAnswers: Record<string, string | null>;
};

const Colors = getColors();

export default function RightSection({
  assignmentName,
  choices,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  onResetCurrentAnswer,
  onJumpToQuestion,
  onExit,
  onSubmit,
  questionIds,
  userAnswers,
}: Props) {
  return (
    <div
      className={`h-full w-full flex flex-col ${Colors.text.primary} ${Colors.background.secondary} rounded-xl p-4 font-mono`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onExit}
          className={`p-2 rounded-md hover:opacity-80 ${Colors.background.primary} group`}
        >
          <LogOut className="button-wrap-right" />
        </button>

        <h1 className="text-lg font-semibold">
          <span className="text-[#64ACFF]">
            {assignmentName.split(" ")[0]}{" "}
          </span>
          <span>{assignmentName.slice(assignmentName.indexOf(" "))}</span>
        </h1>

        <div className="flex gap-3">
          <button
            onClick={onResetCurrentAnswer}
            className={`p-2 rounded-md hover:opacity-80 ${Colors.background.primary} group`}
          >
            <RefreshCcw className="transition-transform duration-700 group-active:rotate-[-360deg]" />
          </button>

          <button
            onClick={onSubmit}
            className={`${Colors.background.primary} px-4 py-1 rounded-md hover:opacity-80 group`}
          >
            <p className="button-wrap-up">Submit</p>
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-4 flex-1">
        {choices.map((choice) => {
          const isSelected = selectedAnswer === choice;

          return (
            <button
              key={choice}
              onClick={() => onSelectAnswer(choice)}
              className={`
                flex items-center justify-between
                ${Colors.background.primary}
                px-4 py-4 rounded-lg
                transition-all
                ${isSelected ? Colors.border.specialThick : Colors.border.fadedThick}
              `}
            >
              <span>{choice}</span>
              {isSelected && (
                <span className="text-green-600 font-bold">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Question Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto mt-auto no-scrollbar">
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const answered = userAnswers[questionIds[i]] != null;

            return (
              <button
                key={i}
                onClick={() => onJumpToQuestion(i)}
                className={`
                    px-3 py-1 rounded-md ${Colors.background.primary}
                    ${
                      i === currentIndex
                        ? Colors.border.specialThick
                        : answered
                          ? Colors.border.greenThick
                          : Colors.border.fadedThick
                    }
                  `}
              >
                Q{i + 1}
              </button>
            );
          })}
        </div>

        {/* <button className={`${Colors.background.primary} px-4 py-2 rounded-md hover:opacity-80 group`}>
          Mark As Correct
        </button> */}
      </div>
    </div>
  );
}


