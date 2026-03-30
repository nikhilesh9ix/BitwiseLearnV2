"use client";

import { useState } from "react";
import AddMCQ from "./AddMCQ";
import AddCodeQuestion from "./AddCodeQuestion";
import { getColors } from "@/component/general/(Color Manager)/useColors";

const Colors = getColors();

type QuestionType = "MCQ" | "CODE" | null;

const AddQuestionV1 = () => {
  const [questionType, setQuestionType] = useState<QuestionType>(null);

  const handleSelect = (type: QuestionType) => {
    setQuestionType(type);
  };

  return (
    <div
      className={`p-6 max-w-1/3 mx-auto ${Colors.background.secondary} ${Colors.text.primary} font-mono rounded-lg shadow-md shadow-black/10 flex flex-col gap-3`}
    >
      <h2 className="text-xl font-semibold">
        <span className={`${Colors.text.special}`}>Add</span> Question
      </h2>

      {/* Checkboxes */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer text-lg font-semibold">
          <input
            type="checkbox"
            checked={questionType === "MCQ"}
            onChange={() => handleSelect("MCQ")}
          />
          MCQ
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-lg font-semibold">
          <input
            type="checkbox"
            checked={questionType === "CODE"}
            onChange={() => handleSelect("CODE")}
          />
          Code
        </label>
      </div>

      {/* Conditional Rendering */}
      <div className="mt-6">
        {questionType === "MCQ" && <AddMCQ />}
        {questionType === "CODE" && <AddCodeQuestion />}
      </div>
    </div>
  );
};

export default AddQuestionV1;


