"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type Props = {
  openForm: (value: boolean) => void;
  onSubmit?: (data: InstitutionFormData) => void;
};

type InstitutionFormData = {
  name: string;
  email: string;
  secondaryEmail?: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  address: string;
  pinCode: string;
  tagline: string;
  websiteLink: string;
};

const TOTAL_STEPS = 3;

export default function InstitutionForm({ openForm, onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<InstitutionFormData>({
    name: "",
    email: "",
    secondaryEmail: "",
    phoneNumber: "",
    secondaryPhoneNumber: "",
    address: "",
    pinCode: "",
    tagline: "",
    websiteLink: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InstitutionFormData, string>>>({});
  const Colors = getColors();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const validatePinCode = (pinCode: string): boolean => {
    const pinCodeRegex = /^[0-9]{6}$/;
    return pinCodeRegex.test(pinCode);
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof InstitutionFormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Institution name is required";
      } else if (formData.name.length < 3) {
        newErrors.name = "Institution name must be at least 3 characters";
      }

      if (!formData.tagline.trim()) {
        newErrors.tagline = "Tagline is required";
      }

      if (!formData.websiteLink.trim()) {
        newErrors.websiteLink = "Website link is required";
      } else if (!validateUrl(formData.websiteLink)) {
        newErrors.websiteLink = "Please enter a valid URL";
      }
    }

    if (currentStep === 2) {
      if (!formData.email.trim()) {
        newErrors.email = "Primary email is required";
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (formData.secondaryEmail && !validateEmail(formData.secondaryEmail)) {
        newErrors.secondaryEmail = "Please enter a valid email address";
      }

      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required";
      } else if (!validatePhoneNumber(formData.phoneNumber)) {
        newErrors.phoneNumber = "Phone number must be 10 digits";
      }

      if (
        formData.secondaryPhoneNumber &&
        !validatePhoneNumber(formData.secondaryPhoneNumber)
      ) {
        newErrors.secondaryPhoneNumber = "Phone number must be 10 digits";
      }
    }

    if (currentStep === 3) {
      if (!formData.address.trim()) {
        newErrors.address = "Address is required";
      } else if (formData.address.length < 10) {
        newErrors.address = "Please enter a complete address";
      }

      if (!formData.pinCode.trim()) {
        newErrors.pinCode = "Pin code is required";
      } else if (!validatePinCode(formData.pinCode)) {
        newErrors.pinCode = "Pin code must be 6 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof InstitutionFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const next = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(step)) {
      onSubmit?.(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-lg rounded-2xl ${Colors.border.defaultThick} ${Colors.background.secondary} p-6 shadow-2xl`}>
        {/* Close */}
        <button
          onClick={() => openForm(false)}
          className={`absolute right-4 top-4 ${Colors.text.primary} hover:text-red-500 cursor-pointer active:scale-95 transition-all duration-150`}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className={`text-xs ${Colors.text.special}`}>
            Step {step} of {TOTAL_STEPS}
          </p>
          <h2 className={`text-lg font-semibold ${Colors.text.primary} mt-1`}>
            Create Institution
          </h2>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1 w-full bg-white/10 rounded">
          <div
            className={`h-1 ${Colors.background.special} rounded transition-all`}
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <Input
                label="Institution Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />
              <Input
                label="Tagline"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                error={errors.tagline}
              />
              <Input
                label="Website Link"
                name="websiteLink"
                value={formData.websiteLink}
                onChange={handleChange}
                error={errors.websiteLink}
              />
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <Input
                label="Primary Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
              <Input
                label="Secondary Email"
                name="secondaryEmail"
                type="email"
                value={formData.secondaryEmail}
                onChange={handleChange}
                error={errors.secondaryEmail}
              />
              <Input
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
              />
              <Input
                label="Secondary Phone"
                name="secondaryPhoneNumber"
                type="tel"
                value={formData.secondaryPhoneNumber}
                onChange={handleChange}
                error={errors.secondaryPhoneNumber}
              />
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <div>
                <Label>Address</Label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className={`mt-1 w-full rounded-lg border ${
                    errors.address ? "border-red-500" : "border-white/10"
                  } ${Colors.background.primary} px-3 py-2 text-sm ${Colors.text.primary} focus:ring-2 focus:ring-primaryBlue`}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                )}
              </div>
              <Input
                label="Pin Code"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleChange}
                error={errors.pinCode}
              />
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                className={`text-sm ${Colors.text.special} hover:underline cursor-pointer active:scale-95 transition-all duration-150 hover:opacity-80`}
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
                className={`rounded-md ${Colors.background.special} px-4 py-2 text-sm font-semibold ${Colors.text.primary} cursor-pointer hover:opacity-80 active:scale-95 transition-all duration-150`}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className={`rounded-md ${Colors.background.special} px-4 py-2 text-sm font-semibold ${Colors.text.primary} cursor-pointer hover:opacity-80 active:scale-95 transition-all duration-150`}
              >
                Create Institution
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
  const Colors = getColors();
  return (
    <label className={`text-[11px] uppercase tracking-wide ${Colors.text.special}`}>
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
        className={`mt-1 w-full rounded-lg border ${
          error ? "border-red-500" : "border-white/10"
        } ${Colors.background.primary} px-3 py-2 text-sm ${Colors.text.primary} focus:ring-2 focus:ring-primaryBlue`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}


