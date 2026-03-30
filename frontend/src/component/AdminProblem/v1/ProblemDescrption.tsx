"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import TestCaseSection from "@/component/Problem/v1/TestcaseSection";
import MarkdownEditor, { THEME_MAP } from "@/component/ui/MarkDownEditor";
import { changeStatus, deleteStatus } from "@/api/problems/change-status";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";
import useLogs from "@/lib/useLogs";
import { useInstitution } from "@/store/institutionStore";
import { useRouter } from "next/navigation";
import useVendor from "@/store/vendorStore";

function ProblemDescrption({
  data,
  testMode,
  setTestMode,
}: {
  data: any;
  testMode: boolean;
  setTestMode: any;
}) {
  if (!data) return null;

  const {
    name,
    description,
    hints,
    testCases,
    problemTopics,
    createdBy,
    creatorType,
  } = data;
  const { loading, role } = useLogs();
  const [width, setWidth] = useState(420); // initial width in px
  const [showButton, setShowButton] = useState(false);
  const isResizing = useRef(false);
  const Colors = getColors();
  const { info } = useInstitution();
  const { info: vendorinfo } = useVendor();

  useEffect(() => {
    if (role === null) return;
    if (
      creatorType === "INSTITUTION" &&
      createdBy === info?.data.id &&
      role == 3
    ) {
      setShowButton(true);
      return;
    }

    if (
      creatorType === "VENDOR" &&
      createdBy === vendorinfo?.data.id &&
      role == 2
    ) {
      setShowButton(true);
      return;
    }
    if (role < 2) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
  }, [role, info?.data.id, createdBy, creatorType]);
  const startResizing = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (e: MouseEvent) => {
    if (!isResizing.current) return;

    const newWidth = e.clientX;
    const minWidth = 300;
    const maxWidth = 700;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  };
  const handlePublish = async (id: string) => {
    await changeStatus(id);
    data.problem = "LISTED";
    window.location.reload();
  };
  const router = useRouter();
  const handleGoBack = () => {
    router.back();
  };
  const handleDelete = async (id: string) => {
    console.log("delte is id" + id);
    await deleteStatus(id);
    router.push("/admin-dashboard/problems");
  };
  return (
    <div
      className={`relative h-screen overflow-y-auto border-r ${Colors.border.defaultRight} ${Colors.text.secondary} mt-12 p-4 space-y-6 ${Colors.background.primary}`}
      style={{
        width,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        //@ts-ignore
        WebkitScrollbar: { display: "none" },
      }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-blue-500/30"
      />
      <div onClick={handleGoBack} className="flex gap-3 cursor-pointer">
        <ArrowLeft className="text-gray-400 text-md" />
        <span>Go Back</span>
      </div>
      <div className="flex space-x-3 mx-auto items-center justify-between mb-4">
        {showButton && (
          <button
            onClick={() => handleDelete(data.id)}
            className={` px-2 py-2 text-white font-medium rounded-lg transition-colors cursor-pointer bg-red-600 hover:bg-red-700`}
          >
            Delete Question
          </button>
        )}
        {showButton && (role === 0 || role === 1) && (
          <button
            onClick={() => handlePublish(data.id)}
            className={` px-2 py-2 text-white font-medium rounded-lg transition-colors cursor-pointer
    ${
      data.published === "NOT_LISTED"
        ? "bg-blue-600 hover:bg-blue-700"
        : "bg-red-600 hover:bg-red-700"
    }`}
          >
            {data.published === "NOT_LISTED"
              ? "List Question"
              : "unList Question"}
          </button>
        )}
        <label className="items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={testMode}
            onChange={() => setTestMode(!testMode)}
            className="hidden"
          />
          <div
            className={`w-10 h-5 rounded-full transition-colors flex items-center py-3
      ${testMode ? "bg-green-500" : "bg-gray-300"}`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transform transition-transform
        ${testMode ? "translate-x-5" : "translate-x-1"}`}
            />
          </div>
          <span className="text-sm font-medium">Test Mode</span>
        </label>
      </div>
      {/* Problem Title */}
      <h1 className={`text-xl font-semibold ${Colors.text.primary}`}>{name}</h1>
      {/* Problem Description */}
      <MarkdownEditor
        height={550}
        value={description}
        setValue={(data) => {}}
        mode={"preview"}
        hideToolbar={true}
        theme={useTheme().theme === "Dark" ? "dark" : "light"}
      />
      <TestCaseSection testCases={testCases} />
      {/* Topics */}
      {problemTopics?.length > 0 && (
        <div>
          <h2 className={`text-lg font-semibold ${Colors.text.primary} mb-2`}>
            Topics
          </h2>

          <div className="flex flex-wrap gap-2">
            {problemTopics[0].tagName.map((tag: string) => (
              <span
                key={tag}
                className={`text-xs px-3 py-1 rounded-full ${Colors.background.secondary} ${Colors.border.defaultThin} ${Colors.text.secondary}`}
              >
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Hints */}
      {hints?.length > 0 && (
        <div>
          <h2 className={`text-lg font-semibold ${Colors.text.primary} mb-2`}>
            Hints
          </h2>

          <div className="space-y-2">
            {hints.map((hint: string, idx: number) => (
              <HintItem key={idx} index={idx} hint={hint} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProblemDescrption;

function HintItem({ hint, index }: { hint: string; index: number }) {
  const [open, setOpen] = useState(false);
  const Colors = getColors();

  return (
    <div
      className={`${Colors.background.secondary} ${Colors.border.defaultThin} rounded-lg`}
    >
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${Colors.text.secondary} ${Colors.hover.special} cursor-pointer transition`}
      >
        <ChevronRight
          size={16}
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="font-medium">Hint {index + 1}</span>
      </button>

      {open && (
        <div className={`px-4 pb-3 text-sm ${Colors.text.secondary} mt-3`}>
          {hint}
        </div>
      )}
    </div>
  );
}


