"use client";

import { useEffect, useMemo, useState } from "react";
import Filter from "./Filter";
import QuestionCard from "./QuestionCard";
import { getAllProblemData } from "@/api/problems/get-all-problems";
import { useColors } from "@/component/general/(Color Manager)/useColors";

type Difficulty = "easy" | "medium" | "hard" | null;
type Status = "solved" | "unsolved" | null;

function AllListedQuestions() {
  const [questions, setQuestions] = useState<any[]>([]);
  const Colors = useColors();
  /* ---------------- FILTER STATE ---------------- */
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(null);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    getAllProblemData(setQuestions);
  }, []);

  /* ---------------- FILTER LOGIC ---------------- */
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search
      if (query && !q.name.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }

      // Difficulty
      if (difficulty && q.difficulty?.toLowerCase() !== difficulty) {
        return false;
      }

      // Status (optional – depends on backend support)
      if (status === "solved" && !q.solved) return false;
      if (status === "unsolved" && q.solved) return false;

      return true;
    });
  }, [questions, query, difficulty, status]);

  return (
    <div className="overflow-y-auto">
      <Filter
        query={query}
        setQuery={setQuery}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        status={status}
        setStatus={setStatus}
      />

      <div className="w-full overflow-y-auto">
        {filteredQuestions.length === 0 && (
          <p className={`text-center ${Colors.text.secondary} py-10`}>No questions found</p>
        )}

        {filteredQuestions.map((question, index) => (
          <QuestionCard
            key={question.id ?? index}
            topics={question.problemTopics ?? question.tags ?? []}
            id={question.id}
            name={question.name}
            difficulty={question.difficulty}
            solved={question.solved ?? false}
            isAdmin={false}
          />
        ))}
      </div>
    </div>
  );
}

export default AllListedQuestions;
