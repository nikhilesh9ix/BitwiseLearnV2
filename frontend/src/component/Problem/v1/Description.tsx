"use client";

import { useState } from "react";
import { ChevronRight, Lightbulb } from "lucide-react";
import TestCaseSection from "./TestcaseSection";
import MarkdownEditor from "@/component/ui/MarkDownEditor";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";

function Description({ content }: { content: any }) {
  if (!content) return null;

  const { name, description, hints, testCases, problemTopics } = content;
  const colors = getColors();
  const theme = useTheme();

  return (
    <div className={`flex flex-col gap-8 ${colors.text.secondary}`}>
      {/* Title */}
      <div className={`${colors.border.default}`}>
        <h1
          className={`text-2xl mt-4 font-semibold tracking-tight ${colors.text.primary}`}
        >
          {name}
        </h1>
      </div>

      {/* Description */}
      <section
        className={`
          rounded-2xl
          overflow-hidden
          transition-all
          ${colors.background.primary}
          ${colors.border.defaultThin}
        `}
      >
        {/* Header */}
        <div
          className={`
            flex items-center justify-between
            px-5 py-4
            ${colors.background.secondary}
            ${colors.border.faded}
          `}
        >
          <div className="flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-(--accent-primary)" />
            <h2
              className={`text-lg font-semibold tracking-wide ${colors.text.primary}`}
            >
              Problem Description
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
            <MarkdownEditor
              height={500}
              value={description}
              mode="preview"
              hideToolbar={true}
              theme={theme.theme === "Dark"?"dark":"light"}
            />
        </div>
      </section>

      {/* Test Cases */}
      <section>
        <h2
          className={`text-lg font-semibold mb-3 ${colors.text.primary}`}
        >
          Sample Test Cases
        </h2>
        <TestCaseSection testCases={testCases} />
      </section>

      {/* Topics */}
      {problemTopics?.length > 0 && (
        <section
          className={`
            rounded-2xl
            p-3
            ${colors.background.secondary}
          `}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-xl font-semibold ${colors.text.primary}`}
            >
              Topics
            </h2>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {problemTopics[0].tagName.map((tag: string) => (
              <span
                key={tag}
                className={`
                  inline-flex items-center gap-2
                  rounded-full px-4 py-1.5
                  text-xs font-medium
                  transition-all
                  ${colors.background.primary}
                  ${colors.border.specialThin}
                  ${colors.text.secondary}
                  ${colors.hover.textSpecial}
                `}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Hints */}
      {hints?.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={18} className="text-yellow-400" />
            <h2
              className={`text-xl font-semibold p-1 ${colors.text.primary}`}
            >
              Hints
            </h2>
          </div>

          <div className="space-y-3">
            {hints.map((hint: string, idx: number) => (
              <HintItem key={idx} index={idx} hint={hint} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Description;

function HintItem({ hint, index }: { hint: string; index: number }) {
  const [open, setOpen] = useState(false);
  const colors = getColors();

  return (
    <div
      onClick={() => {
        if (open) setOpen(false);
      }}
      className={`
        group rounded-xl cursor-pointer
        transition-all duration-300
        ${colors.background.primary}
        ${colors.border.specialThin}
      `}
    >
      {/* Header */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`
          flex w-full items-center justify-between
          px-4 py-3 text-sm
          ${colors.text.secondary}
        `}
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            size={16}
            className={`
              transition-all duration-300
              ${open ? "rotate-90 text-yellow-400" : "text-gray-400"}
            `}
          />
          <span className="font-medium tracking-tight">
            Hint {index + 1}
          </span>
        </div>

        <span
          className={`
            text-xs transition-opacity duration-300
            ${open ? "text-gray-500" : "text-gray-600"}
          `}
        >
          {open ? "Click anywhere to close" : "Reveal"}
        </span>
      </button>

      {/* Animated Content */}
      <div
        className={`
          grid transition-all duration-300 ease-out
          ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
        `}
      >
        <div className="overflow-hidden">
          <div
            className={`
              px-4 pb-4 text-sm leading-relaxed
              ${colors.text.secondary}
            `}
          >
            {hint}
          </div>
        </div>
      </div>
    </div>
  );
}


