import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const submitIndividualQuestion = async (
  id: string,
  data: any,
  type: "CODE" | "NO_CODE",
) => {
  try {
    await axiosInstance.post("/api/assessments/submit/question/" + id, data);
  } catch (error) {
    toast.error("error submitting question");
  }
};

export const submitTest = async (id: string, data: any) => {
  try {
    const request = await fetch("https://api.ipify.org?format=json");
    const ipPayload = await request.json();
    const clientIp = ipPayload.ip;

    const res = await axiosInstance.post("/api/assessments/submit/" + id, {
      ...data,
      studentIp: clientIp,
    });

    return res.data;
  } catch (error) {
    toast.error("error submitting test");
    throw error;
  }
};
