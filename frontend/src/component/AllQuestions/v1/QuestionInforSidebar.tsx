"use client";

import { useEffect, useState } from "react";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";
import { loadProfile } from "@/api/problems/load-profile";

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const Colors = getColors();

function QuestionInfoSidebar() {
  const [question, setQuestion] = useState({
    easy: 12,
    medium: 80,
    hard: 20,
    totalQuestion: 300,
  });
  const { theme } = useTheme();

  const [solved, setSolved] = useState(0);
  const [hovered, setHovered] = useState<"easy" | "medium" | "hard" | null>(
    null,
  );

  useEffect(() => {
    async function handleLoad() {
      const res = await loadProfile();
      const toSafeNumber = (value: unknown) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
      };

      const easy = toSafeNumber(res?.easy);
      const medium = toSafeNumber(res?.medium);
      const hard = toSafeNumber(res?.hard);
      const computedTotal = easy + medium + hard;
      const totalQuestion = Math.max(
        toSafeNumber(res?.totalQuestion),
        computedTotal,
      );

      setQuestion({
        easy,
        medium,
        hard,
        totalQuestion,
      });
    }
    handleLoad();
  }, []);
  useEffect(() => {
    setSolved(question.easy + question.medium + question.hard);
  }, [question]);

  const safeTotal = question.totalQuestion > 0 ? question.totalQuestion : 1;
  const easyPercent = question.easy / safeTotal;
  const mediumPercent = question.medium / safeTotal;
  const hardPercent = question.hard / safeTotal;

  const easyLength = CIRCUMFERENCE * easyPercent;
  const mediumLength = CIRCUMFERENCE * mediumPercent;
  const hardLength = CIRCUMFERENCE * hardPercent;

  return (
    <div
      className={`w-1/3 mt-3 ${Colors.background.secondary} h-95 ${Colors.border.faded} border-2  rounded-xl p-6`}
    >
      <h2 className={`text-lg font-semibold mb-6 ${Colors.text.primary}`}>
        Problems Solved
      </h2>

      {/* Ring */}
      <div className="relative w-44 h-44 mx-auto">
        <svg className="w-full h-full -rotate-90">
          {/* Background */}
          <circle
            cx="88"
            cy="88"
            r={RADIUS}
            stroke={
              theme === "Dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
            }
            strokeWidth="10"
            fill="none"
          />

          {/* Easy */}
          <circle
            cx="88"
            cy="88"
            r={RADIUS}
            stroke="#22c55e"
            strokeWidth="10"
            fill="none"
            strokeDasharray={`${easyLength} ${CIRCUMFERENCE}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="cursor-pointer transition-opacity"
            onMouseEnter={() => setHovered("easy")}
            onMouseLeave={() => setHovered(null)}
          />

          {/* Medium */}
          <circle
            cx="88"
            cy="88"
            r={RADIUS}
            stroke="#facc15"
            strokeWidth="10"
            fill="none"
            strokeDasharray={`${mediumLength} ${CIRCUMFERENCE}`}
            strokeDashoffset={-easyLength}
            strokeLinecap="round"
            className="cursor-pointer transition-opacity"
            onMouseEnter={() => setHovered("medium")}
            onMouseLeave={() => setHovered(null)}
          />

          {/* Hard */}
          <circle
            cx="88"
            cy="88"
            r={RADIUS}
            stroke="#ef4444"
            strokeWidth="10"
            fill="none"
            strokeDasharray={`${hardLength} ${CIRCUMFERENCE}`}
            strokeDashoffset={-(easyLength + mediumLength)}
            strokeLinecap="round"
            className="cursor-pointer transition-opacity"
            onMouseEnter={() => setHovered("hard")}
            onMouseLeave={() => setHovered(null)}
          />
        </svg>

        {/* Center Info */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center ${Colors.text.primary}`}
        >
          {hovered ? (
            <>
              <span className="text-3xl font-bold">{question[hovered]}</span>
              <span className={`text-sm ${Colors.text.secondary}`}>
                {hovered}
              </span>
            </>
          ) : (
            <>
              {question && (
                <span className="text-3xl font-bold">
                  {solved}/{question.totalQuestion}
                </span>
              )}
              <span className={`text-sm ${Colors.text.secondary}`}>Solved</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      {question && (
        <div className="mt-6 space-y-3">
          <StatRow label="Easy" value={question.easy} color="bg-green-500" />
          <StatRow
            label="Medium"
            value={question.medium}
            color="bg-yellow-400"
          />
          <StatRow label="Hard" value={question.hard} color="bg-red-500" />
        </div>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className={`flex items-center justify-between text-sm ${Colors.text.primary}`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span>{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default QuestionInfoSidebar;


