"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createStudent } from "@/api/students/create-student";
import { useColors } from "@/component/general/(Color Manager)/useColors";

type StudentFormData = {
  name: string;
  rollNumber: string;
  email: string;
  batchId: string;
  institutionId: string;
};

type Props = {
  openForm: (value: boolean) => void;
  batchId: string;
  batchName: string;
  institutionId: string;
  onSubmit?: (data: StudentFormData) => void;
};

function BatchStudentForm({
  openForm,
  batchId,
  batchName,
  institutionId,
  onSubmit,
}: Props) {
  const [formData, setFormData] = useState<StudentFormData>({
    name: "",
    rollNumber: "",
    email: "",
    batchId: batchId || "",
    institutionId: institutionId || "",
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
        if (!value.trim()) return "Batch ID is missing";
        return "";
      },
    }),
    [],
  );

  const validateField = (key: keyof StudentFormData, value: string) => {
    const validator = validators[key] as any;
    return validator ? validator(value) : "";
  };

  const validateAll = (data: StudentFormData) => {
    const nextErrors: Partial<Record<keyof StudentFormData, string>> = {};
    (Object.keys(validators) as Array<keyof StudentFormData>).forEach((key) => {
      nextErrors[key] = validateField(key, data[key] ?? "");
    });
    return nextErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!batchId) {
      toast.error("Batch context is missing");
      return;
    }

    if (!institutionId) {
      toast.error("Institution context is missing");
      return;
    }

    setSubmitting(true);
    try {
      await createStudent({
        name: formData.name,
        rollNumber: formData.rollNumber,
        email: formData.email,
        batchId: batchId,
        institutionId: institutionId,
        loginPassword: Math.random().toString(36).slice(-8),
      });
      toast.success("Student created successfully");
      setFormData({
        name: "",
        rollNumber: "",
        email: "",
        batchId: batchId,
        institutionId: institutionId,
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
        <h2 className="text-lg font-semibold text-white mt-1">
          Create Student
        </h2>
        <p className="text-xs text-white/50 mt-1">
          Add a new student to this batch.
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

        <div className="p-3 rounded-lg border border-white/10 bg-black/30">
          <Label>Batch</Label>
          <p className="mt-2 text-sm text-white font-semibold">
            {batchName || "Current Batch"}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => openForm(false)}
            className="text-sm text-white/60 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primaryBlue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
    <label className="text-[11px] uppercase tracking-wide text-primaryBlue">
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
  const Colors = useColors();
  return (
    <div>
      <Label>{label}</Label>
      <input
        {...props}
        className={`mt-1 w-full rounded-lg border ${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.text.primary} px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 ${error ? "border-red-500 focus:ring-red-500" : "border-white/10"}`}
      />
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

export default BatchStudentForm;
