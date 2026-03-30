"use client";

import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useState } from "react";

const Colors = getColors();

const AddMCQ = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    if (isSubmitted) return;

    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const toggleSubmit = () => {
    setIsSubmitted((prev) => !prev);
  };

  return (
    <div className="space-y-4">
      {/* Question */}
      <input
        type="text"
        placeholder="Enter question"
        value={question}
        disabled={isSubmitted}
        onChange={(e) => setQuestion(e.target.value)}
        className={`w-full p-2 rounded-lg ${
          Colors.border.defaultThin
        } ${isSubmitted ? "opacity-60 cursor-not-allowed" : ""}`}
      />

      {options.map((option, index) => {
        const isCorrect = correctAnswer === index;

        return (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-lg px-3 transition ${
              Colors.border.defaultThin
            }
      ${isCorrect ? "border-green-500 bg-green-500/10" : ""}
      ${isSubmitted ? "opacity-70" : ""}`}
          >
            <input
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              disabled={isSubmitted}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="flex-1 p-2 focus:outline-none bg-transparent"
            />

            <input
              type="checkbox"
              disabled={isSubmitted}
              checked={isCorrect}
              className="accent-green-500"
              onChange={() => setCorrectAnswer(isCorrect ? null : index)}
            />
          </div>
        );
      })}

      {/* Submit / Edit Button */}
      <div className="pt-2">
        <button
          onClick={toggleSubmit}
          className={`px-5 py-2 rounded-lg font-medium transition ${
            isSubmitted
              ? `${Colors.background.heroSecondary} ${Colors.text.primary} hover:opacity-80`
              : `${Colors.background.primary} ${Colors.text.primary} hover:opacity-80`
          }`}
        >
          {isSubmitted ? "Edit" : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default AddMCQ;


