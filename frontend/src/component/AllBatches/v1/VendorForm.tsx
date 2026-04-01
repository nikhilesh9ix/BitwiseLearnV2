"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { createBatch } from "@/api/batches/create-batch";
import { useInstitution } from "@/store/institutionStore";

type Props = {
  openForm: (value: boolean) => void;
  onSubmit?: (data: BatchFormData) => void;
};

type BatchFormData = {
  institutionId: string;
  batchname: string;
  branch: string;
  batchEndYear: string;
};

const TOTAL_STEPS = 2;

export default function BatchForm({ openForm, onSubmit }: Props) {
  const institution = useInstitution();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<BatchFormData>({
    institutionId: institution.info?.data?.id ?? "",
    batchname: "",
    branch: "",
    batchEndYear: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const next = () => {
    if (!formData.institutionId.trim()) {
      toast.error("Institution ID is required");
      return;
    }
    if (!formData.batchname.trim() || !formData.branch.trim()) {
      toast.error("Batch name and branch are required");
      return;
    }
    setStep(2);
  };
  const back = () => setStep(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{4}$/.test(formData.batchEndYear.trim())) {
      toast.error("Enter a valid 4-digit end year");
      return;
    }

    const toastId = toast.loading("Creating Batch...");
    setSubmitting(true);
    try {
      await createBatch({
        institutionId: formData.institutionId.trim(),
        batchname: formData.batchname.trim(),
        branch: formData.branch.trim(),
        batchEndYear: formData.batchEndYear.trim(),
      });
      toast.success("Batch created successfully", { id: toastId });
      onSubmit?.(formData);
      openForm(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to create batch";
      toast.error(message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-divBg p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={() => openForm(false)}
          className="absolute right-4 top-4 text-white/50 hover:text-white transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-primaryBlue">
            Step {step} of {TOTAL_STEPS}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            Create Batch
          </h2>
        </div>

        {/* Progress */}
        <div className="mb-6 h-1 w-full rounded bg-white/10">
          <div
            className="h-1 rounded bg-primaryBlue transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <Input
                label="Institution ID"
                name="institutionId"
                value={formData.institutionId}
                onChange={handleChange}
                placeholder="Paste institution ID"
                required
              />
              <Input
                label="Batch Name"
                name="batchname"
                value={formData.batchname}
                onChange={handleChange}
                placeholder="Enter batch name"
                required
              />
              <Input
                label="Branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="Enter branch"
                required
              />
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <Input
              label="Batch End Year"
              name="batchEndYear"
              value={formData.batchEndYear}
              onChange={handleChange}
              placeholder="e.g. 2027"
              inputMode="numeric"
              required
            />
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                className="text-sm text-white/60 hover:text-white"
              >
                Back
              </button>
            ) : (
              <span />
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={next}
                className="rounded-md bg-primaryBlue px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaryBlue/90"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-primaryBlue px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaryBlue/90"
              >
                {submitting ? "Creating..." : "Create Batch"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- UI Primitives ---------- */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] uppercase tracking-wide text-primaryBlue">
      {children}
    </label>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        {...props}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primaryBlue"
      />
    </div>
  );
}
