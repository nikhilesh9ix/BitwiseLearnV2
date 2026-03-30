"use client";

import React, { use, useState } from "react";
import { X } from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type Props = {
  openForm: (value: boolean) => void;
  onSubmit?: (data: AuthFormData) => void;
};

type AuthFormData = {
  name: string;
  email: string;
  password: string;
};

const TOTAL_STEPS = 2;
const Colors = getColors();

export default function VendorForm({ openForm, onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<AuthFormData>({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const next = () => setStep(2);
  const back = () => setStep(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-sm rounded-2xl border ${Colors.border.defaultThin} ${Colors.background.secondary} p-6 shadow-2xl`}>
        {/* Close */}
        <button
          onClick={() => openForm(false)}
          className={`absolute right-4 top-4 ${Colors.text.primary} hover:text-red-500 transition cursor-pointer`}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className={`text-xs ${Colors.text.special}`}>
            Step {step} of {TOTAL_STEPS}
          </p>
          <h2 className={`mt-1 text-lg font-semibold ${Colors.text.primary}`}>Create User</h2>
        </div>

        {/* Progress */}
        <div className="mb-6 h-1 w-full rounded bg-white/10">
          <div
            className={`h-1 rounded ${Colors.background.special} transition-all`}
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                className={`text-sm ${Colors.text.primary} ${Colors.hover.textSpecial} cursor-pointer`}
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
                className={`rounded-md ${Colors.background.special} px-4 py-2 text-sm font-semibold ${Colors.text.primary} transition hover:bg-primaryBlue/90 cursor-pointer`}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className={`rounded-md ${Colors.background.special} px-4 py-2 text-sm font-semibold ${Colors.text.primary} transition hover:bg-primaryBlue/90 cursor-pointer`}
              >
                Create User
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
    <label className={`text-[11px] uppercase tracking-wide ${Colors.text.special}`}>
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
        className={`mt-1 w-full rounded-lg border ${Colors.border.defaultThin} ${Colors.background.primary} px-3 py-2 text-sm ${Colors.text.primary} focus:ring-2 focus:ring-primaryBlue`}
      />
    </div>
  );
}


