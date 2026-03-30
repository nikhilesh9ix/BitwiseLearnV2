"use client";

import Link from "next/link";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

function QuestionCard({
  id,
  name,
  topics,
  difficulty,
  solved,
  isAdmin,
}: {
  id: string;
  name: string;
  topics?: any[];
  difficulty: Difficulty;
  solved: boolean;
  isAdmin: boolean;
}) {
  const normalizedTopics = Array.isArray(topics) ? topics : [];
  const topicNames: string[] = normalizedTopics.flatMap((topic) => {
    if (typeof topic === "string") return [topic];
    if (Array.isArray(topic?.tagName)) return topic.tagName;
    if (typeof topic?.tagName === "string") return [topic.tagName];
    return [];
  });
  const Colors = getColors();

  return (
    <div
      className={`
        group flex items-center
        px-4 py-3
        ${Colors.background.primary} ${Colors.hover.special} rounded-lg
        transition w-[90%] mx-auto`}
    >
      {/* Status */}
      <div className="w-8 flex justify-center shrink-0">
        {solved && <span className="text-green-400 text-sm">✔</span>}
      </div>

      {/* Title */}
      <div className="flex-1 max-w-[60%]">
        <Link
          href={
            !isAdmin ? `/problems/${id}` : `/admin-dashboard/problems/${id}`
          }
          className={`text-md ${Colors.text.primary} group-hover:text-blue-400 truncate`}
        >
          {name}
        </Link>
      </div>

      {/* Difficulty */}
      <div className="w-24 text-sm shrink-0">
        <DifficultyBadge difficulty={difficulty} />
      </div>

      {/* Topics */}
      <div className="w-56 flex gap-2 justify-end shrink-0">
        {topicNames.slice(0, 3).map((topic) => (
          <span
            key={topic}
            className={`
                            text-xs px-2 py-1
              rounded-md
              ${Colors.background.secondary} ${Colors.text.secondary}
              whitespace-nowrap
              `}
          >
            {topic}
          </span>
        ))}
        {topicNames.length > 3 && (
          <span className={`text-xs ${Colors.text.secondary}`}>
            +{topicNames.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const map = {
    EASY: "text-green-400",
    MEDIUM: "text-yellow-400",
    HARD: "text-red-400",
  };

  return (
    <span className={`font-medium ${map[difficulty]}`}>
      {difficulty.toLowerCase()}
    </span>
  );
}

export default QuestionCard;


