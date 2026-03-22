"use client";
import { createProblem } from "@/api/problems/create-admin-problem";
import MarkdownEditor from "@/component/ui/MarkDownEditor";
import { X, Plus, Trash2, Save } from "lucide-react";
import { useState } from "react";
import { useColors } from "@/component/general/(Color Manager)/useColors";
import toast from "react-hot-toast";

function ProblemSubmissionForm({ setOpen }: any) {
  const Colors = useColors();
  const [name, setName] = useState("");
  const [description, setDescription] = useState(`# Problem Statement

## Constraints

## Examples

\`\`\`txt
Input:
Output:
\`\`\`
`);
  const [hints, setHints] = useState<string[]>([""]);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {}
  );

  const addHint = () => setHints([...hints, ""]);
  const updateHint = (i: number, v: string) => {
    const copy = [...hints];
    copy[i] = v;
    setHints(copy);
  };
  const removeHint = (i: number) => {
    if (hints.length > 1) {
      setHints(hints.filter((_, idx) => idx !== i));
    }
  };

  const handleSubmit = async () => {
    const nextErrors: { name?: string; description?: string } = {};
    if (!name.trim()) {
      nextErrors.name = "Problem name is required.";
    }
    if (!description.trim()) {
      nextErrors.description = "Problem description is required.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const toastId = toast.loading("Creating Problem...");
    try {
      await createProblem({
        name,
        description,
        hints: hints.filter((h) => h.trim()),
      });

      toast.success("Create Success!", { id: toastId });
      window.location.reload();
      setOpen(false);
    } catch (error) {
      toast.error("Unable to create problem", { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`flex h-[90vh] w-full max-w-4xl flex-col rounded-xl ${Colors.background.secondary} shadow-2xl border ${Colors.border.primary || "border-white/10"}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-white/10 px-6 py-4`}>
          <div>
            <h2 className={`text-xl font-bold ${Colors.text.primary}`}>
              Add New Problem
            </h2>
            <p className={`text-sm ${Colors.text.secondary} mt-1`}>
              Create a new coding challenge for students.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className={`p-2 rounded-full hover:bg-white/5 transition-colors ${Colors.text.secondary} hover:${Colors.text.primary}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
          {/* Problem Name */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${Colors.text.primary}`}>
              Problem Title <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="e.g. Two Sum"
              className={`w-full rounded-lg ${Colors.background.primary} border ${errors.name ? "border-red-500" : "border-white/10"} px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-500 ${Colors.text.primary}`}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${Colors.text.primary}`}>
              Problem Description <span className="text-red-500">*</span>
            </label>
            <div
              className={`rounded-lg border overflow-hidden ${errors.description ? "border-red-500" : "border-white/10"} focus-within:ring-2 focus-within:ring-blue-500/50 transition-all`}
            >
              <MarkdownEditor
                value={description}
                setValue={(val: string) => {
                  setDescription(val);
                  if (errors.description) setErrors({ ...errors, description: undefined });
                }}
                mode={"live"}
                theme="light" // Ideally should match app theme if possible
                hideToolbar={false}
              />
            </div>
            {errors.description && (
              <p className="text-xs text-red-400 mt-1">{errors.description}</p>
            )}
            <p className={`text-xs ${Colors.text.secondary}`}>
              Supports GitHub Flavored Markdown.
            </p>
          </div>

          {/* Hints Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className={`block text-sm font-medium ${Colors.text.primary}`}>
                Hints
              </label>
              <button
                onClick={addHint}
                className={`text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors`}
              >
                <Plus size={14} /> Add Hint
              </button>
            </div>
            
            <div className="space-y-3">
              {hints.map((hint, index) => (
                <div key={index} className="flex gap-2 group">
                  <div className="relative flex-1">
                    <span className={`absolute left-3 top-3 text-xs ${Colors.text.secondary} select-none`}>
                      #{index + 1}
                    </span>
                    <input
                      value={hint}
                      onChange={(e) => updateHint(index, e.target.value)}
                      placeholder="Enter a helpful hint..."
                      className={`w-full rounded-lg ${Colors.background.primary} border border-white/10 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${Colors.text.primary}`}
                    />
                  </div>
                  <button
                    onClick={() => removeHint(index)}
                    disabled={hints.length === 1}
                    className={`p-2.5 rounded-lg border border-transparent ${hints.length > 1 ? "text-red-400 hover:bg-red-500/10 hover:border-red-500/20" : "text-gray-600 cursor-not-allowed"} transition-all`}
                    title="Remove hint"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-6 border-t border-white/10 flex justify-end gap-3 ${Colors.background.secondary} rounded-b-xl`}>
          <button
            onClick={() => setOpen(false)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium ${Colors.text.secondary} hover:bg-white/5 transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0`}
          >
            <Save size={18} />
            Create Problem
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProblemSubmissionForm;
