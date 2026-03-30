"use client";
import CodeEditor from "@/component/Problem/v1/Editor";
import TestCases from "@/component/Problem/v1/TestCases";
import React, { useRef, useState } from "react";
import { getColors } from "@/component/general/(Color Manager)/useColors";

function ProblemTrial({ data }: { data: any }) {
  const [output, setOutput] = useState([]);
  const [editorRatio, setEditorRatio] = useState(60);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isEditorResizing = useRef(false);
  const [tab, setTab] = useState<"example" | "output">("example");
  /* Editor resize */
  const handleEditorMouseDown = () => {
    isEditorResizing.current = true;
    document.body.style.cursor = "row-resize";
  };
  const Colors = getColors();

  return (
    <>
      <div ref={rightPanelRef} className="flex-1 flex flex-col min-w-0">
        {/* Code Editor */}
        <div style={{ flex: `${editorRatio} 0 0` }} className="min-h-0">
          <CodeEditor
            setTab={setTab}
            showSubmit={false}
            questionId={data.id}
            output={setOutput}
            template={data.problemTemplates}
          />
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleEditorMouseDown}
          className={`h-1 cursor-row-resize ${Colors.background.special} ${Colors.hover.special}`}
        />

        {/* Test Cases */}
        <div
          style={{
            flex: `${100 - editorRatio} 0 0`,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            //@ts-ignore
            WebkitScrollbar: { display: "none" },
          }}
          className="overflow-y-auto min-h-0"
        >
          <TestCases tab={tab} output={output} testCases={data.testCases} />
        </div>
      </div>
    </>
  );
}

export default ProblemTrial;


