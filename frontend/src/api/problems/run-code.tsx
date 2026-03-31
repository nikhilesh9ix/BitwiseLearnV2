import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

const toReadableMessage = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((entry) => toReadableMessage(entry))
      .filter((entry) => entry.trim().length > 0);
    return messages.join("\n");
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred =
      record.message ?? record.detail ?? record.error ?? record.msg;
    if (preferred) {
      return toReadableMessage(preferred);
    }

    try {
      return JSON.stringify(record, null, 2);
    } catch {
      return "Code execution failed";
    }
  }

  if (value == null) {
    return "";
  }

  return String(value);
};

export const runCode = async (data: any) => {
  try {
    const payload = {
      ...data,
      problemId: data?.problemId ?? data?.problem_id ?? data?.questionId,
    };
    const result = await axiosInstance.post("/api/v1/code/run", payload);
    return result.data;
  } catch (error: any) {
    const message =
      toReadableMessage(error?.response?.data?.error) ||
      toReadableMessage(error?.response?.data?.message) ||
      toReadableMessage(error?.response?.data?.detail) ||
      toReadableMessage(error?.message) ||
      "Code execution failed";

    return {
      testCases: [],
      compileOutput: message,
      error: message,
    };
  }
};
export const submitCode = async (data: any) => {
  try {
    const payload = {
      ...data,
      problemId: data?.problemId ?? data?.problem_id ?? data?.questionId,
    };
    const result = await axiosInstance.post("/api/v1/code/submit", payload);
    return result.data;
  } catch (error) {
    toast.error("failed submission");
  }
};
