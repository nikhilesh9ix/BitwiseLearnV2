"use client";

import { getProblemSolutionById } from "@/api/problems/get-problem-solution";
import MDEditor from "@uiw/react-md-editor";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AddSolution from "./AddSolution";
import { updateSolution } from "@/api/problems/update-solution";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import toast from "react-hot-toast";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";
type SolutionType = {
  id: string;
  solution: string;
  videoSolution: string | null;
  problemId: string;
};

function Solution() {
  const Colors = getColors();
  const { theme } = useTheme();
  const params = useParams();
  const problemId = params.id as string;

  const [solutionForm, setShowSolutionForm] = useState(false);
  const [solution, setSolution] = useState<SolutionType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProblemSolutionById((data: SolutionType | null) => {
      setSolution(data);
    }, problemId);
  }, [problemId]);

  const handleSave = async () => {
    if (!solution) return;

    try {
      setLoading(true);

      await updateSolution(solution.id, {
        solution: solution.solution,
        videoSolution: solution.videoSolution,
      });

      setSolution({
        ...solution,
        solution: solution.solution,
        videoSolution: solution.videoSolution,
      });
      toast.success("Solution saved successfully!");
    } catch (error) {
      toast.error("Failed to save solution!");
    } finally {
      setLoading(false);
    }
  };

  if (solution === null) {
    return (
      <div className="h-screen flex justify-end">
        <button
          onClick={() => setShowSolutionForm(true)}
          className={`inline-flex h-fit items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${Colors.hover.special} ${Colors.text.special} ${Colors.border.specialThick} cursor-pointer active:scale-95 transition-all`}
        >
          + Add New Solution
        </button>

        {solutionForm && (
          <AddSolution stateFn={setShowSolutionForm} id={problemId} />
        )}
      </div>
    );
  }

  return (
    <div className={`h-screen ${Colors.background.primary}`}>
      <div className="flex flex-col gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className={`w-fit rounded-md px-5 py-2 text-sm font-semibold ${Colors.text.primary} ${Colors.background.special} ${Colors.hover.special} disabled:opacity-50 cursor-pointer active:scale-95 transition-all`}
        >
          {loading ? "Saving..." : "Save"}
        </button>

        <input
          type="text"
          placeholder="Video solution URL"
          value={solution.videoSolution ?? ""}
          onChange={(e) =>
            setSolution({
              ...solution,
              videoSolution: e.target.value,
            })
          }
          className={`rounded-md border px-3 py-2 ${Colors.background.secondary} ${Colors.text.primary} ${Colors.border.defaultThin}`}
        />
      </div>

      <div
        className="mt-4"
        data-color-mode={theme === "Dark" ? "dark" : "light"}
      >
        <MDEditor
          height={600}
          value={solution.solution}
          onChange={(value) =>
            setSolution({
              ...solution,
              solution: value || "",
            })
          }
          preview="live"
          previewOptions={{ skipHtml: true }}
          hideToolbar={false}
          spellCheck
        />
      </div>
    </div>
  );
}

export default Solution;


