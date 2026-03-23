"use client";

import { getAllProblemTemplate } from "@/api/problems/get-all-template";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Editor } from "@monaco-editor/react";
import ShowAddTemplateForm from "./ShowAddTemplateForm";
import { createProblemTemplate } from "@/api/problems/create-template";
import { updateProblemTemplate } from "@/api/problems/update-tempate";
import { useColors } from "@/component/general/(Color Manager)/useColors";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";

type Template = {
  id: string;
  problemId: string;
  language: string;
  defaultCode: string;
  functionBody: string;
};

const LANGUAGE_MAP: Record<string, string> = {
  PYTHON: "python",
  JAVA: "java",
  CPP: "cpp",
  JS: "javscript",
  TYPESCRIPT: "typescript",
};

function Templates() {
  const param = useParams();
  const Colors = useColors();
  const { theme } = useTheme();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [currentDisplay, setCurrentDisplay] = useState<
    "defaultCode" | "functionBody"
  >("defaultCode");

  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /** editable values */
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [functionBodyMap, setFunctionBodyMap] = useState<
    Record<string, string>
  >({});

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    getAllProblemTemplate((res: Template[]) => {
      setTemplates(res);

      if (!res.length) return;

      const initialLang = res[0].language;
      setSelectedLang(initialLang);

      const defaultCodes: Record<string, string> = {};
      const functionBodies: Record<string, string> = {};

      res.forEach((t) => {
        defaultCodes[t.language] = t.defaultCode;
        functionBodies[t.language] = t.functionBody;
      });

      setCodeMap(defaultCodes);
      setFunctionBodyMap(functionBodies);
    }, param.id as string);
  }, [param.id]);

  /* ---------------- MAP ---------------- */
  const templateMap = useMemo(() => {
    const map: Record<string, Template> = {};
    templates.forEach((t) => {
      map[t.language] = t;
    });
    return map;
  }, [templates]);

  if (!selectedLang) {
    return (
      <div
        className={`h-screen w-full flex flex-col items-center justify-center ${Colors.text.primary}`}
      >
        {showTemplateForm && (
          <ShowAddTemplateForm
            onClose={() => setShowTemplateForm(false)}
            onSave={(data) => {
              createProblemTemplate(param.id as string, data);
              getAllProblemTemplate((res: Template[]) => {
                setTemplates(res);

                if (!res.length) return;

                const initialLang = res[0].language;
                setSelectedLang(initialLang);

                const defaultCodes: Record<string, string> = {};
                const functionBodies: Record<string, string> = {};

                res.forEach((t) => {
                  defaultCodes[t.language] = t.defaultCode;
                  functionBodies[t.language] = t.functionBody;
                });

                setCodeMap(defaultCodes);
                setFunctionBodyMap(functionBodies);
                window.location.reload();
              }, param.id as string);
            }}
          />
        )}
        No templates available
        <button
          onClick={() => setShowTemplateForm(true)}
          className={`mt-3 rounded-md px-4 py-2 text-sm font-medium ${Colors.border.specialThick} ${Colors.text.special} ${Colors.hover.special} cursor-pointer active:scale-95 transition-all`}
        >
          + Add New Template
        </button>
      </div>
    );
  }

  const monacoLanguage = LANGUAGE_MAP[selectedLang] || "plaintext";

  const editorValue =
    currentDisplay === "defaultCode"
      ? (codeMap[selectedLang] ?? "")
      : (functionBodyMap[selectedLang] ?? "");

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!selectedLang) return;
    const activeTemplate = templateMap[selectedLang];

    await updateProblemTemplate(
      activeTemplate.id,
      {
        language: selectedLang,
        defaultCode: codeMap[selectedLang],
        functionBody: functionBodyMap[selectedLang],
      },
      templateMap,
    );

    getAllProblemTemplate((res: Template[]) => {
      setTemplates(res);

      if (!res.length) return;

      const initialLang = res[0].language;
      setSelectedLang(initialLang);

      const defaultCodes: Record<string, string> = {};
      const functionBodies: Record<string, string> = {};

      res.forEach((t) => {
        defaultCodes[t.language] = t.defaultCode;
        functionBodies[t.language] = t.functionBody;
      });

      setCodeMap(defaultCodes);
      setFunctionBodyMap(functionBodies);
    }, param.id as string);

    setIsEditing(false);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className={`h-screen flex flex-col ${Colors.text.primary}`}>
      {showTemplateForm && (
        <ShowAddTemplateForm
          onClose={() => setShowTemplateForm(false)}
          onSave={(data) => createProblemTemplate(param.id as string, data)}
        />
      )}

      {/* Top Actions */}
      <div className="w-full p-3 flex justify-end gap-3">
        <button
          onClick={() => setShowTemplateForm(true)}
          className={`rounded-md px-4 py-2 text-sm ${Colors.border.specialThick} ${Colors.text.special} ${Colors.hover.special} cursor-pointer active:scale-95 transition-all`}
        >
          + Add New Template
        </button>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className={`rounded-md px-4 py-2 text-sm ${Colors.border.specialThick} ${Colors.text.special} ${Colors.hover.special} cursor-pointer active:scale-95 transition-all`}
          >
            Edit
          </button>
        ) : (
          <button
            onClick={handleSave}
            className={`rounded-md px-4 py-2 text-sm ${Colors.border.specialThick} ${Colors.text.special} ${Colors.hover.special} cursor-pointer active:scale-95 transition-all`}
          >
            Save
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex">
        {["defaultCode", "functionBody"].map((tab) => (
          <button
            key={tab}
            onClick={() =>
              setCurrentDisplay(tab as "defaultCode" | "functionBody")
            }
            className={`px-4 py-2 text-sm font-medium cursor-pointer active:scale-95 transition-all rounded-md ${
              currentDisplay === tab
                ? `${Colors.background.special} ${Colors.text.primary}`
                : `${Colors.background.primary} ${Colors.text.secondary}`
            }`}
          >
            {tab === "defaultCode" ? "Default Code" : "Function Body"}
          </button>
        ))}
      </div>

      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 ${Colors.border.default}`}
      >
        <h2 className={`text-sm font-semibold ${Colors.text.primary}`}>
          {selectedLang} Editor
        </h2>

        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className={`px-3 py-1.5 rounded-md ${Colors.background.primary} ${Colors.border.defaultThin} ${Colors.text.primary} cursor-pointer`}
        >
          {Object.keys(templateMap).map((lang) => (
            <option
              className={`cursor-pointer ${Colors.text.primary}`}
              key={lang}
              value={lang}
            >
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          key={`${selectedLang}-${currentDisplay}-${isEditing}`}
          language={monacoLanguage}
          value={editorValue}
          theme={theme === "Dark" ? "vs-dark" : "vs-light"}
          onChange={(value) => {
            if (!isEditing) return;

            if (currentDisplay === "defaultCode") {
              setCodeMap((prev) => ({
                ...prev,
                [selectedLang]: value ?? "",
              }));
            } else {
              setFunctionBodyMap((prev) => ({
                ...prev,
                [selectedLang]: value ?? "",
              }));
            }
          }}
          options={{
            readOnly: !isEditing,
            fontSize: 14,
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            minimap: { enabled: false },
            automaticLayout: true,
            wordWrap: "on",
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}

export default Templates;
