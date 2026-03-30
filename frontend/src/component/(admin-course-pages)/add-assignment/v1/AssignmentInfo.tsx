"use client";

import { getColors } from "@/component/general/(Color Manager)/useColors";

export default function AssignmentInfo({
  assignment,
  setAssignment,
  onSubmit,
  onClose,
  loading,
}: any) {
  const update = (key: string, value: any) =>
    setAssignment({ ...assignment, [key]: value });
  const Colors = getColors();

  return (
    <div
      className={`
        flex flex-col gap-7
        rounded-2xl
        p-7
        ${Colors.background.secondary}
        border border-white/10
        shadow-[0_20px_60px_rgba(0,0,0,0.7)]
      `}
    >
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
        <h1 className={`${Colors.text.primary} text-2xl font-semibold`}>
          Create Assignment
        </h1>
        <p className={`text-sm ${Colors.text.secondary}`}>
          Configure assignment details before adding questions
        </p>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className={`text-sm ${Colors.text.primary}`}>
          Assignment Title
        </label>
        <input
          value={assignment.title}
          placeholder="Enter assignment title"
          className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
          onChange={(e) => update("title", e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className={`text-sm ${Colors.text.primary}`}>Description</label>
        <textarea
          value={assignment.description}
          placeholder="Brief description of the assignment"
          className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      {/* Instructions */}
      <div className="flex flex-col gap-1">
        <label className={`text-sm ${Colors.text.primary}`}>
          Instructions for students
        </label>
        <textarea
          value={assignment.instructions}
          placeholder="Rules, guidelines, or hints for students"
          className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
          onChange={(e) => update("instructions", e.target.value)}
        />
      </div>

      {/* Marks */}
      <div className="flex flex-col gap-1 w-1/5">
       <label className={`text-sm ${Colors.text.secondary}`}>Marks per question</label>
        <input
          type="number"
          min={0}
          step={1}
          value={assignment.marksPerQuestion}
          placeholder="e.g. 2"
          className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
          onChange={(e) => {
            const value = e.target.value;

            if (value === "") {
              update("marksPerQuestion", "");
              return;
            }

            const num = Math.max(0, Number(value));
            update("marksPerQuestion", num);
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onClose}
          className={`px-4 py-2 rounded-lg ${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.hover.special} ${Colors.text.primary} transition cursor-pointer`}
        >
          Cancel
        </button>

        <button
          onClick={onSubmit}
          disabled={loading}
          className={`text-sm ${Colors.background.special} ${Colors.hover.special} p-3 rounded-md text-wrapped text-white font-semibold transition cursor-pointer`}
        >
          {loading ? "Creating Assignment..." : "Create Assignment"}
        </button>
      </div>
    </div>
  );
}


