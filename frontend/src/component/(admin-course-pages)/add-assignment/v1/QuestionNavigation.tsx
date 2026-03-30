import { getColors } from "@/component/general/(Color Manager)/useColors";
import React from "react";

const Colors = getColors();

export default function QuestionNavigation({
  index,
  total,
  onPrev,
  onNext,
  onNew,
  onSubmit,
  locked,
}: any) {
  return (
    <div className="flex justify-between pt-6">
      {/* Previous Button */}
      <button
        disabled={index === 0}
        onClick={onPrev}
        className={`rounded-full ${Colors.background.primary} ${Colors.text.primary} px-6 py-2 cursor-pointer hover:opacity-95 font-semibold`}
      >
        Previous
      </button>

      {/* Add Question Button */}
      {!locked && (
        <button
          onClick={onNew}
          className={`rounded-full ${Colors.background.heroPrimary} ${Colors.text.black} px-6 py-2 cursor-pointer hover:opacity-95 font-semibold`}
        >
          New Question
        </button>
      )}

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        className={`rounded-full ${Colors.background.heroPrimary} ${Colors.text.black} px-6 py-2 cursor-pointer hover:opacity-95 font-semibold`}
      >
        Complete
      </button>

      {/* Next Button */}
      <button
        disabled={index === total - 1}
        onClick={onNext}
        className={`rounded-full ${Colors.background.primary} ${Colors.text.primary} px-6 py-2 cursor-pointer hover:opacity-95 font-semibold`}
      >
        Next
      </button>
    </div>
  );
}


