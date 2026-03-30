"use client";

import MDEditor from "@uiw/react-md-editor";
import { PlayCircle, FileText } from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";

function Solution({ content }: any) {
  const Colors = getColors();
  const theme = useTheme();
  const isDark = theme.theme === "Dark";

  if (!content) {
    return (
      <div
        className={`flex items-center justify-center h-full text-sm ${Colors.text.secondary}`}
      >
        No solution available.
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-y-auto px-6 py-5 space-y-8 ${Colors.text.secondary}`}
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        //@ts-ignore
        WebkitScrollbar: { display: "none" },
      }}
    >
      {/* Video Solution */}
      {content.videoSolution && (
        <section
          className={`
            rounded-2xl overflow-hidden transition-all
            ${Colors.background.secondary}
            ${Colors.border.defaultThin}
            hover:border-blue-500/30
          `}
        >
          <div
            className={`
              flex items-center gap-3 px-5 py-4
              ${Colors.background.primary}
              ${Colors.border.default}
            `}
          >
            <span className="h-6 w-1 rounded-full bg-blue-500/70" />
            <PlayCircle size={18} className="text-blue-400" />
            <h2 className={`text-sm font-semibold tracking-wide ${Colors.text.primary}`}>
              Video Solution
            </h2>
          </div>

          <div className="p-5">
            <div
              className={`
                aspect-video rounded-xl overflow-hidden
                ${Colors.background.primary}
                ${Colors.border.defaultThin}
                shadow-lg
              `}
            >
              <iframe
                src={content.videoSolution}
                className="w-full h-full"
              />
            </div>
          </div>
        </section>
      )}

      {/* Written Solution */}
      {content.solution && (
        <section
          className={`
            rounded-2xl overflow-hidden transition-all
            ${Colors.background.secondary}
            ${Colors.border.defaultThin}
            hover:border-blue-500/30
          `}
        >
          <div
            className={`
              flex items-center gap-3 px-5 py-4
              ${Colors.background.primary}
              ${Colors.border.default}
            `}
          >
            <span className="h-6 w-1 rounded-full bg-blue-500/70" />
            <FileText size={18} className="text-blue-400" />
            <h2 className={`text-sm font-semibold tracking-wide ${Colors.text.primary}`}>
              Written Solution
            </h2>
          </div>

          <div className="p-5">
            <div
              className={`
                rounded-xl p-4
                ${Colors.background.primary}
                ${Colors.border.defaultThin}
              `}
            >
              <MDEditor
                height={700}
                //@ts-ignore
                value={content.solution as string}
                onChange={() => { }}
                preview="preview"
                hideToolbar
                spellCheck
                data-color-mode={isDark ? "dark" : "light"}
                style={{
                  backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
                  color: isDark ? "#ffffff" : "#000000",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Solution;


