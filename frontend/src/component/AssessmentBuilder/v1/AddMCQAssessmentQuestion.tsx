"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { createQuestion } from "@/api/assessments/create-question";

type Question = {
  id: string;
  question?: string;
  options: string[];
  correctOption: number;
  maxMarks: number;
};

interface AddAssessmentMCQProps {
  open: boolean;
  onClose: () => void;
  sectionId: string;
  maxMarks: number;
  onCreated: (question: Question) => void;
}

const AddAssessmentMCQ = ({
  open,
  onClose,
  sectionId,
  maxMarks,
  onCreated,
}: AddAssessmentMCQProps) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast.error("Question is required");
      return;
    }

    if (options.some((opt) => !opt.trim())) {
      toast.error("All options are required");
      return;
    }

    if (correctAnswer === null) {
      toast.error("Select the correct answer");
      return;
    }

    try {
      setLoading(true);

      const created = await createQuestion(sectionId, {
        question,
        options,
        correctOption: options[correctAnswer],
        maxMarks,
      }); // ✅ STORE RESULT
      console.log({
        question,
        options,
        correctOption: options[correctAnswer],
        maxMarks,
      });

      if (!created?.id) {
        throw new Error("Invalid question response");
      }

      toast.success("Question added");
      onCreated(created); // ✅ NOW VALID

      // reset state
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(null);

      onClose();
    } catch (err) {
      toast.error("Failed to add question");
      // console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#121313] p-6"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add MCQ Question</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Question */}
        <input
          type="text"
          placeholder="Enter question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#181A1A] px-4 py-3 text-sm text-white
            placeholder:text-white/40 focus:border-[#1DA1F2] focus:outline-none"
        />

        {/* Options */}
        <div className="mt-5 space-y-3">
          {options.map((option, index) => {
            const isCorrect = correctAnswer === index;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition cursor-pointer
                  ${
                    isCorrect
                      ? "border-[#1DA1F2] bg-[#1DA1F2]/10"
                      : "border-white/10 bg-[#181A1A]"
                  }`}
                onClick={() => setCorrectAnswer(index)}
              >
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                />

                <input
                  type="radio"
                  checked={isCorrect}
                  onChange={() => setCorrectAnswer(index)}
                  className="h-4 w-4 accent-[#1DA1F2]"
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md bg-slate-800 px-5 py-2 text-sm text-white hover:bg-slate-700 transition"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-md bg-[#1DA1F2] px-6 py-2 text-sm font-medium text-black
              hover:bg-[#1DA1F2]/90 transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAssessmentMCQ;
