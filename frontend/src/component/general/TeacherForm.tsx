"use client";

import React, { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createTeacher } from "@/api/teachers/create-teacher";
import { getAllBatches } from "@/api/batches/get-all-batches";
import { getColors } from "./(Color Manager)/useColors";
type TeacherFormData = {
  name: string;
  email: string;
  phoneNumber: string;
  batchId: string;
};

type Batch = {
  id: string;
  batchname: string;
  branch: string;
  batchEndYear: string;
};

type Props = {
  openForm: (value: boolean) => void;
  institutionId: string;
  onSubmit?: (data: TeacherFormData) => void;
};

export default function TeacherForm({
  openForm,
  institutionId,
  onSubmit,
}: Props) {
  const [formData, setFormData] = useState<TeacherFormData>({
    name: "",
    email: "",
    phoneNumber: "",
    batchId: "",
  });

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const Colors = getColors();

  const [errors, setErrors] = useState<
    Partial<Record<keyof TeacherFormData, string>>
  >({});

  useEffect(() => {
    if (institutionId) {
      setLoadingBatches(true);
      getAllBatches((data: Batch[]) => {
        setBatches(data || []);
        setLoadingBatches(false);
      }, institutionId).catch((error) => {
        // console.error("Failed to fetch batches:", error);
        toast.error("Failed to load batches");
        setLoadingBatches(false);
      });
    }
  }, [institutionId]);

  const validators = useMemo(
    () => ({
      name: (value: string) => {
        if (!value.trim()) return "Name is required";
        if (!/^[A-Za-z\s]+$/.test(value))
          return "Only alphabets and spaces allowed";
        return "";
      },
      email: (value: string) => {
        if (!value.trim()) return "Email is required";
        if (!value.includes("@")) return "Email must contain @";
        return "";
      },
      phoneNumber: (value: string) => {
        if (!value.trim()) return "Phone number is required";
        if (!/^\d+$/.test(value)) return "Phone number must be digits only";
        return "";
      },
      batchId: (value: string) => {
        if (!value.trim()) return "Batch is required";
        return "";
      },
    }),
    [],
  );

  const validateField = (key: keyof TeacherFormData, value: string) => {
    const validator = validators[key];
    return validator ? validator(value) : "";
  };

  const validateAll = (data: TeacherFormData) => {
    const nextErrors: Partial<Record<keyof TeacherFormData, string>> = {};
    (Object.keys(validators) as Array<keyof TeacherFormData>).forEach((key) => {
      nextErrors[key] = validateField(key, (data[key] ?? "") as string);
    });
    return nextErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    const nextData = { ...formData, [name]: value } as TeacherFormData;
    setFormData(nextData);
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof TeacherFormData, value),
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
    const toastId = toast.loading("Creating Teacher...");
    try {
      await createTeacher({
        ...formData,
        instituteId: institutionId,
      });

      toast.success("Teacher created successfully", { id: toastId });
      await onSubmit?.(formData);
      openForm(false);
      window.location.reload();
    } catch (error) {
      // console.error("Failed to create teacher", error);
      toast.error("Failed to create teacher", { id: toastId });
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold ${Colors.text.primary} mt-1`}>
          Create Teacher
        </h2>
        <p className={`text-xs ${Colors.text.secondary} mt-1`}>
          Fill the details to create a teacher profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter full name"
          required
          error={errors.name}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="teacher@example.com"
          required
          error={errors.email}
        />
        <Input
          label="Phone Number"
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Enter phone number"
          required
          error={errors.phoneNumber}
        />

        <div>
          <Label>Batch</Label>
          <select
            name="batchId"
            value={formData.batchId}
            onChange={handleChange}
            disabled={loadingBatches || batches.length === 0}
            className={`mt-1 w-full rounded-lg border ${Colors.background.primary} px-3 py-2 text-sm ${Colors.text.primary} focus:ring-2 focus:ring-primaryBlue ${errors.batchId ? "border-red-500 focus:ring-red-500" : "border-white/10"} disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              colorScheme: "dark",
            }}
          >
            <option
              value=""
              className={`${Colors.background.primary} ${Colors.text.primary}`}
            >
              {loadingBatches ? "Loading batches..." : "Select a batch"}
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
            className={`rounded-md ${Colors.background.special} px-4 py-2 text-sm font-semibold ${Colors.text.primary}`}
          >
            Create Teacher
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
  const Colors = getColors();
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


