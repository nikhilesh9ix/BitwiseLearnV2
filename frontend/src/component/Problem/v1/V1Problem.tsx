"use client";

import React, { useRef, useState, useEffect } from "react";
import CodeEditor from "./Editor";
import TestCases from "./TestCases";
import Description from "./Description";
import Solution from "./Solution";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/component/ui/tabs";
import Submission from "./Submission";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useColors } from "@/component/general/(Color Manager)/useColors";
type ProblemViewData = {
  id: string;
  solution?: string;
  problemTemplates?: unknown[];
  testCases?: unknown[];
};

function V1Problem({ data }: { data: ProblemViewData }) {
  const Colors = useColors();

  /* Sidebar */
  const [sidebarWidth, setSidebarWidth] = useState(720);
  const [output, setOutput] = useState([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isSidebarResizing = useRef(false);

  /* Editor split */
  const [editorRatio, setEditorRatio] = useState(60);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"example" | "output">("example");
  const isEditorResizing = useRef(false);

  const router = useRouter();
  const handleSidebarMouseDown = () => {
    isSidebarResizing.current = true;
    document.body.style.cursor = "col-resize";
  };

  const handleEditorMouseDown = () => {
    isEditorResizing.current = true;
    document.body.style.cursor = "row-resize";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isSidebarResizing.current && sidebarRef.current) {
      const left = sidebarRef.current.getBoundingClientRect().left;
      const width = e.clientX - left;
      if (width >= 320 && width <= 720) {
        setSidebarWidth(width);
      }
    }

    if (isEditorResizing.current && rightPanelRef.current) {
      const rect = rightPanelRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = (y / rect.height) * 100;
      if (ratio >= 30 && ratio <= 75) {
        setEditorRatio(ratio);
      }
    }
  };

  const handleMouseUp = () => {
    isSidebarResizing.current = false;
    isEditorResizing.current = false;
    document.body.style.cursor = "default";
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      className={`
        h-screen flex overflow-hidden
        ${Colors.background.secondary}
        ${Colors.text.primary}
      `}
    >
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        className={`
          flex flex-col relative
          ${Colors.background.primary}
          ${Colors.border.defaultRight}
        `}
      >
        <Tabs defaultValue="description" className="flex flex-col h-full">
          {/* Tabs Header */}
          <TabsList
            className={`
              w-full px-4
              ${Colors.background.primary}
              ${Colors.border.default}
            `}
          >
            <div className="px-6 pt-4">
              <button
                onClick={() => router.push("/problems")}
                className={`
                  inline-flex items-center gap-2 text-sm font-medium
                  ${Colors.text.special}
                  hover:opacity-80 transition
                `}
              >
                <ChevronLeft size={22} />
              </button>
            </div>

            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="solution">Solution</TabsTrigger>
            <TabsTrigger value="submission">Submission</TabsTrigger>
          </TabsList>

          {/* Tabs Content */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <TabsContent value="description">
              <Description content={data} />
            </TabsContent>

            <TabsContent value="solution">
              <Solution content={data.solution} />
            </TabsContent>

            <TabsContent value="submission">
              <Submission id={data.id} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Sidebar Resize */}
        <div
          onMouseDown={handleSidebarMouseDown}
          className={`
            absolute right-0 top-0 h-full w-1 cursor-col-resize
            ${Colors.background.accent}
            hover:opacity-80
          `}
        />
      </div>

      {/* Right Panel */}
      <div ref={rightPanelRef} className="flex-1 flex flex-col min-w-0">
        {/* Code Editor */}
        <div style={{ flex: `${editorRatio} 0 0` }} className="min-h-0">
          <CodeEditor
            questionId={data.id}
            setTab={setTab}
            output={setOutput}
            template={data.problemTemplates}
          />
        </div>

        {/* Editor Resize */}
        <div
          onMouseDown={handleEditorMouseDown}
          className={`
            h-1 cursor-row-resize
            ${Colors.background.accent}
            hover:opacity-80
          `}
        />

        {/* Test Cases */}
        <div
          style={{
            flex: `${100 - editorRatio} 0 0`,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="overflow-y-auto min-h-0"
        >
          <TestCases tab={tab} output={output} testCases={data.testCases} />
        </div>
      </div>
    </div>
  );
}

export default V1Problem;
