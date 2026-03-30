"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createBatch } from "@/api/batches/create-batch";
import { getColors } from "./(Color Manager)/useColors";

type BatchFormData = {
  batchname: string;
  branch: string;
  batchEndYear: string;
};

type Props = {
  openForm: (value: boolean) => void;
  institutionId: string;
  onSubmit?: (data: BatchFormData) => void;
};

const Colors = getColors();

function BatchesForm({ openForm, institutionId, onSubmit }: Props) {
  const [formData, setFormData] = useState<BatchFormData>({
    batchname: "",
    branch: "",
    batchEndYear: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof BatchFormData, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();

  const validators = useMemo(
    () => ({
      batchname: (value: string) => {
        if (!value.trim()) return "Batch name is required";
        if (value.trim().length < 3)
          return "Batch name must be at least 3 characters";
        return "";
      },
      branch: (value: string) => {
        if (!value.trim()) return "Branch is required";
        if (!/^[A-Za-z0-9\s-]+$/.test(value.trim()))
          return "Branch can include letters, numbers, spaces, and dashes";
        return "";
      },
      batchEndYear: (value: string) => {
        if (!value.trim()) return "End year is required";
        if (!/^\d{4}$/.test(value)) return "Enter a valid 4-digit year";
        const numeric = parseInt(value, 10);
        if (numeric < currentYear)
          return `Year must be greater than ${currentYear}`;
        return "";
      },
    }),
    [currentYear],
  );

  const validateField = (key: keyof BatchFormData, value: string) => {
    const validator = validators[key];
    return validator ? validator(value) : "";
  };

  const validateAll = (data: BatchFormData) => {
    const nextErrors: Partial<Record<keyof BatchFormData, string>> = {};
    (Object.keys(validators) as Array<keyof BatchFormData>).forEach((key) => {
      nextErrors[key] = validateField(key, data[key] ?? "");
    });
    return nextErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextData = { ...formData, [name]: value } as BatchFormData;
    setFormData(nextData);
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof BatchFormData, value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateAll(formData);
    setErrors(nextErrors);

    const hasError = Object.values(nextErrors).some(
      (msg) => msg && msg.length > 0,
    );
    if (hasError) return;

    if (!institutionId) {
      toast.error("Institution context is missing");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Creating Batch...");
    try {
      await createBatch({ ...formData, institutionId });
      toast.success("Batch created successfully", { id: toastId });
      setFormData({ batchname: "", branch: "", batchEndYear: "" });
      onSubmit?.(formData);
      openForm(false);
    } catch (error) {
      // console.error("Failed to create batch", error);
      toast.error("Failed to create batch", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold ${Colors.text.primary} mt-1`}>
          Create Batch
        </h2>
        <p className={`text-xs ${Colors.text.secondary} mt-1`}>
          Fill the details to create a batch for this institution.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Batch Name"
          name="batchname"
          value={formData.batchname}
          onChange={handleChange}
          placeholder="Enter batch name"
          required
          error={errors.batchname}
        />
        <Input
          label="Branch"
          name="branch"
          value={formData.branch}
          onChange={handleChange}
          placeholder="e.g. Computer Science"
          required
          error={errors.branch}
        />
        <Input
          label="Batch End Year"
          name="batchEndYear"
          value={formData.batchEndYear}
          onChange={handleChange}
          placeholder="e.g. 2028"
          required
          error={errors.batchEndYear}
          inputMode="numeric"
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => openForm(false)}
            className={`text-sm ${Colors.text.secondary} ${Colors.hover.textSpecial}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`rounded-md ${Colors.background.special} px-4 py-2 text-sm font-semibold ${Colors.text.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? "Creating..." : "Create Batch"}
          </button>
        </div>
      </form>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  const Colors = getColors();
  return (
    <label
      className={`text-[11px] uppercase tracking-wide ${Colors.text.special}`}
    >
      {children}
    </label>
  );
}

function Input({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        {...props}
        className={`mt-1 w-full rounded-lg border ${Colors.background.primary} px-3 py-2 text-sm ${Colors.text.primary} focus:ring-2 focus:ring-primaryBlue ${error ? "border-red-500 focus:ring-red-500" : "border-white/10"}`}
      />
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

export default BatchesForm;


