"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createStudent } from "@/api/students/create-student";
import { getColors } from "./(Color Manager)/useColors";
type StudentFormData = {
  name: string;
  rollNumber: string;
  email: string;
  batchId: string;
  batchName: string;
};

type Props = {
  openForm: (value: boolean) => void;
  institutionId: string;
  batches: Array<{
    id: string;
    batchname: string;
    branch: string;
    batchEndYear: string;
  }>;
  onSubmit?: (data: StudentFormData) => void;
};

const Colors = getColors();

function StudentForm({ openForm, institutionId, batches, onSubmit }: Props) {
  const [formData, setFormData] = useState<StudentFormData>({
    name: "",
    rollNumber: "",
    email: "",
    batchId: "",
    batchName: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof StudentFormData, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const validators = useMemo(
    () => ({
      name: (value: string) => {
        if (!value.trim()) return "Name is required";
        if (!/^[A-Za-z\s]+$/.test(value))
          return "Only alphabets and spaces allowed";
        return "";
      },
      rollNumber: (value: string) => {
        if (!value.trim()) return "Roll number is required";
        return "";
      },
      email: (value: string) => {
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Invalid email format";
        return "";
      },
      batchId: (value: string) => {
        if (!value.trim()) return "Batch is required";
        return "";
      },
    }),
    [],
  );

  const validateField = (key: keyof StudentFormData, value: string) => {
    const validator = validators[key];
    return validator ? validator(value) : "";
  };

  const validateAll = (data: StudentFormData) => {
    const nextErrors: Partial<Record<keyof StudentFormData, string>> = {};
    (Object.keys(validators) as Array<keyof StudentFormData>).forEach((key) => {
      nextErrors[key] = validateField(key, data[key] ?? "");
    });
    return nextErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const nextData = { ...formData, [name]: value } as StudentFormData;
    setFormData(nextData);
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof StudentFormData, value),
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
    try {
      await createStudent({
        ...formData,
        loginPassword: Math.random().toString(36).slice(-8), // Generate temporary password
      });
      toast.success("Student created successfully");
      setFormData({
        name: "",
        rollNumber: "",
        email: "",
        batchId: "",
        batchName: "",
      });
      onSubmit?.(formData);
      openForm(false);
    } catch (error) {
      // console.error("Failed to create student", error);
      toast.error("Failed to create student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold ${Colors.text.primary} mt-1`}>
          Create Student
        </h2>
        <p className={`text-xs ${Colors.text.secondary} mt-1`}>
          Fill the details to add a student to this institution.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Student Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter full name"
          required
          error={errors.name}
        />

        <Input
          label="Roll Number"
          name="rollNumber"
          value={formData.rollNumber}
          onChange={handleChange}
          placeholder="e.g. 123456"
          required
          error={errors.rollNumber}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="student@example.com"
          required
          error={errors.email}
        />

        <div>
          <Label>Batch</Label>
          <select
            name="batchId"
            value={formData.batchId}
            onChange={handleChange}
            disabled={batches.length === 0}
            className={`mt-1 w-full rounded-lg border ${Colors.background.primary} px-3 py-2 text-sm ${Colors.text.primary} focus:ring-2 focus:ring-primaryBlue ${errors.batchId ? "border-red-500 focus:ring-red-500" : "border-white/10"} disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              colorScheme: "dark",
            }}
          >
            <option
              value=""
              className={`${Colors.background.primary} ${Colors.text.primary}`}
            >
              {batches.length === 0 ? "No batches available" : "Select a batch"}
            </option>
            {batches.map((batch) => (
              <option
                key={batch.id}
                value={batch.id}
                className={`${Colors.background.primary} ${Colors.text.primary}`}
              >
                {batch.batchname} - {batch.branch} ({batch.batchEndYear})
              </option>
            ))}
          </select>
          {errors.batchId ? (
            <p className="mt-1 text-xs text-red-400">{errors.batchId}</p>
          ) : null}
        </div>

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
            {submitting ? "Creating..." : "Create Student"}
          </button>
        </div>
      </form>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
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

export default StudentForm;


