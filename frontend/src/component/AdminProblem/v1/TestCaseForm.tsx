"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";

export default function TestCaseForm({
  onClose,
  onSave,
}: {
  onClose?: () => void;
  onSave?: (data: any) => void;
}) {
  const [testCaseType, setTestCaseType] = useState<"EXAMPLE" | "HIDDEN">(
    "EXAMPLE",
  );

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ input?: string; output?: string }>({});

  const Colors = getColors();

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    const nextErrors: { input?: string; output?: string } = {};

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    let parsedInput: any = input;

    try {
      parsedInput = JSON.parse(input);
    } catch {
      parsedInput = input;
    }

    const payload = {
      testType: testCaseType,
      input: parsedInput.toString(),
      output,
    };

    onSave?.(payload);

    setTimeout(() => {
      setIsSaving(false);
      onClose?.();
    }, 500);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start">
      <div
        className={`${Colors.background.secondary} w-full max-w-xl mt-16 rounded-lg shadow-xl`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3">
          <h2 className={`font-semibold ${Colors.text.primary}`}>
            Add Test Case
          </h2>
          <button
            onClick={onClose}
            className={`${Colors.text.primary} hover:text-red-500 cursor-pointer active:scale-95 transition-all`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5 text-sm">
          {/* Type */}
          <div>
            <label className={`block ${Colors.text.secondary} mb-1`}>
              Test Case Type
            </label>
            <select
              value={testCaseType}
              onChange={(e) =>
                setTestCaseType(e.target.value as "EXAMPLE" | "HIDDEN")
              }
              className={`w-full px-3 py-2 rounded-md ${Colors.background.primary} ${Colors.text.secondary} cursor-pointer`}
            >
              <option value="EXAMPLE">EXAMPLE</option>
              <option value="HIDDEN">HIDDEN</option>
            </select>
          </div>

          {/* Input */}
          <div>
            <label className={`block mb-1 ${Colors.text.secondary}`}>
              Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={5}
              placeholder={`Enter input`}
              aria-invalid={Boolean(errors.input)}
              aria-describedby={errors.input ? "input-error" : undefined}
              className={`w-full p-2 rounded-md font-mono text-xs resize-none ${Colors.background.primary} ${Colors.text.secondary} placeholder:text-neutral-500 border ${
                errors.input ? "border-red-500/70" : "border-transparent"
              }`}
            />
            {errors.input && (
              <p id="input-error" className="text-xs text-red-400 mt-1">
                {errors.input}
              </p>
            )}
          </div>

          {/* Output */}
          <div>
            <label className={`block mb-1 ${Colors.text.secondary}`}>
              Output
            </label>
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              rows={3}
              placeholder="Expected output"
              aria-invalid={Boolean(errors.output)}
              aria-describedby={errors.output ? "output-error" : undefined}
              className={`w-full p-2 rounded-md font-mono text-xs resize-none ${Colors.background.primary} ${Colors.text.secondary} placeholder:text-neutral-500 border ${
                errors.output ? "border-red-500/70" : "border-transparent"
              }`}
            />
            {errors.output && (
              <p id="output-error" className="text-xs text-red-400 mt-1">
                {errors.output}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4">
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-md ${Colors.text.special} hover:underline cursor-pointer active:scale-95 transition-all`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 py-2 rounded-md font-semibold disabled:opacity-50 ${Colors.text.primary} ${Colors.background.special} ${Colors.hover.special} cursor-pointer active:scale-95 transition-all`}
          >
            {isSaving ? "Saving..." : "Save Test Case"}
          </button>
        </div>
      </div>
    </div>
  );
}


