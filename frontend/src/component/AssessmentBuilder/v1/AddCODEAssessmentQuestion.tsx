"use client";

import { useEffect, useState } from "react";
import { searchProblem } from "@/api/problems/search-problem";
import { createQuestion } from "@/api/assessments/create-question";

interface CodeQuestion {
  id: string;
  name: string;
  difficulty: string;
}

interface AddAssessmentCodeProps {
  open: boolean;
  sectionId: string;
  maxMarks: number;
  onClose: () => void;
}

const AddAssessmentCode = ({
  open,
  onClose,
  sectionId,
  maxMarks,
}: AddAssessmentCodeProps) => {
  const [query, setQuery] = useState("");
  const [questions, setQuestions] = useState<CodeQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<CodeQuestion | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!open || query.length < 3) return;

    try {
      setLoading(true);
      const res = await searchProblem(query);
      const rawQuestions = res?.data?.data ?? res?.data;
      setQuestions(Array.isArray(rawQuestions) ? rawQuestions : []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuestion) return;

    try {
      setSubmitting(true);

      await createQuestion(sectionId, {
        problemId: selectedQuestion.id,
        maxMarks,
      });

      onClose();
      setQuery("");
      setQuestions([]);
      setSelectedQuestion(null);
    } catch (err) {
      // console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [query, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">
            Add Coding Question
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search coding questions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-slate-700 bg-slate-800 p-2 rounded text-white"
        />

        {loading && <p className="text-slate-400">Loading...</p>}

        {/* Results */}
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {questions.map((q) => {
            const isSelected = selectedQuestion?.id === q.id;

            return (
              <li
                key={q.id}
                onClick={() => setSelectedQuestion(q)}
                className={`cursor-pointer border p-3 rounded flex justify-between transition
                  ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 hover:bg-slate-800"
                  }
                `}
              >
                <span className="text-white">{q.name}</span>
                <span className="text-sm text-slate-400">{q.difficulty}</span>
              </li>
            );
          })}
        </ul>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedQuestion || submitting}
          className="w-full bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2 rounded font-medium"
        >
          {submitting ? "Adding..." : "Add Question"}
        </button>
      </div>
    </div>
  );
};

export default AddAssessmentCode;
