"use client";

import { createSolution } from "@/api/problems/create-solution";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import MarkdownEditor from "@/component/ui/MarkDownEditor";
import { X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type AddSolutionProps = {
  id: string;
  stateFn: (open: boolean) => void;
};

function AddSolution({ stateFn, id }: AddSolutionProps) {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [solutionDescription, setSolutionDescription] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Colors = getColors();

  const handleSubmit = async () => {
    if (!solutionDescription.trim()) {
      setError("Solution description is required");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await createSolution(id, {
        videoUrl: videoUrl || null,
        solution: solutionDescription,
      });
      window.location.reload();
      stateFn(false); // close form
      toast.success("Solution added successfully!");
    } catch (err) {
      toast.error("Failed to save solution. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div
        className={`w-full max-w-3xl ${Colors.background.secondary} rounded-lg shadow-xl p-6 space-y-5`}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className={`text-lg font-semibold ${Colors.text.primary}`}>
            Add New Solution
          </h2>
          <button
            onClick={() => stateFn(false)}
            className={`${Colors.text.primary} hover:text-red-500 cursor-pointer active:scale-95 transition-all`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Video URL */}
        <div>
          <label className={`block text-sm ${Colors.text.primary} mb-1`}>
            Video URL (optional)
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            className={`w-full ${Colors.background.primary} ${Colors.text.primary} border ${Colors.border.defaultThin} px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-300`}
          />
        </div>

        {/* Markdown Editor */}
        <div>
          <label className={`block text-sm ${Colors.text.secondary} mb-1`}>
            Solution Description *
          </label>
          <MarkdownEditor
            theme={"light"}
            value={solutionDescription}
            setValue={setSolutionDescription}
            mode="live"
            hideToolbar={false}
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3">
          <button
            onClick={() => stateFn(false)}
            className={`px-4 py-2 ${Colors.text.special} rounded-md text-sm hover:underline cursor-pointer active:scale-95 transition-all`}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`px-5 py-2 ${Colors.background.special} rounded-md text-sm font-medium ${Colors.text.primary} ${Colors.hover.special} disabled:opacity-60 cursor-pointer active:scale-95 transition-all`}
          >
            {isSaving ? "Saving..." : "Save Solution"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddSolution;


