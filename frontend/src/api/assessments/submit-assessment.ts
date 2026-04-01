import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

const toReadableMessage = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((entry) => toReadableMessage(entry))
      .filter((entry) => entry.trim().length > 0)
      .join("\n");
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred =
      record.error ?? record.message ?? record.detail ?? record.msg;
    if (preferred) return toReadableMessage(preferred);
    try {
      return JSON.stringify(record);
    } catch {
      return "error submitting question";
    }
  }
  return value == null ? "" : String(value);
};

export const submitIndividualQuestion = async (
  assessmentId: string,
  questionId: string,
  data: any,
  type: "CODE" | "NO_CODE",
) => {
  try {
    const payload =
      type === "NO_CODE"
        ? { questionId, answer: data?.option ?? null }
        : {
            questionId,
            code: data?.code ?? "",
            language: data?.language ?? "",
          };

    await axiosInstance.post(
      "/api/assessments/submit/question/" + assessmentId,
      payload,
    );
  } catch (error: any) {
    const message =
      toReadableMessage(error?.response?.data?.error) ||
      toReadableMessage(error?.response?.data?.message) ||
      toReadableMessage(error?.message) ||
      "error submitting question";
    toast.error(message);
    throw error;
  }
};

export const submitTest = async (id: string, data: any) => {
  try {
    let clientIp = data?.studentIp ?? "";
    if (!clientIp) {
      try {
        const request = await fetch("https://api.ipify.org?format=json");
        const ipPayload = await request.json();
        clientIp = ipPayload?.ip ?? "";
      } catch {
        clientIp = "";
      }
    }

    const res = await axiosInstance.post("/api/assessments/submit/" + id, {
      ...data,
      studentIp: clientIp,
    });

    return res.data;
  } catch (error: any) {
    const message =
      toReadableMessage(error?.response?.data?.error) ||
      toReadableMessage(error?.response?.data?.message) ||
      toReadableMessage(error?.message) ||
      "error submitting test";
    toast.error(message);
    throw error;
  }
};
