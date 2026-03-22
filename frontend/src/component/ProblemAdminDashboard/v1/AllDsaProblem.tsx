"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllProblemData } from "@/api/problems/get-all-problems";
import Filter from "@/component/AllQuestions/v1/Filter";
import QuestionCard from "@/component/AllQuestions/v1/QuestionCard";

type Difficulty = "easy" | "medium" | "hard" | null;
type Status = "solved" | "unsolved" | null;

function AllDsaProblem() {
  const [questions, setQuestions] = useState<any[]>([]);

  /* ---------------- FILTER STATE ---------------- */
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(null);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    getAllProblemData(setQuestions, true);
  }, []);

  /* ---------------- FILTERED QUESTIONS ---------------- */
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

      // Status (placeholder logic)
      if (status === "solved" && !q.solved) return false;
      if (status === "unsolved" && q.solved) return false;

      return true;
    });
  }, [questions, query, difficulty, status]);

  return (
    <div>
      <Filter
        query={query}
        setQuery={setQuery}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        status={status}
        setStatus={setStatus}
      />

      <div className="w-full">
        {filteredQuestions.length === 0 && (
          <p className="text-center text-gray-400 py-10">No questions found</p>
        )}

        {filteredQuestions.map((question, index) => (
          <QuestionCard
            key={question.id ?? index}
            topics={question.problemTopics ?? question.tags ?? []}
            id={question.id}
            name={question.name}
            difficulty={question.difficulty}
            solved={question.solved ?? false}
            isAdmin={true}
          />
        ))}
      </div>
    </div>
  );
}

export default AllDsaProblem;
