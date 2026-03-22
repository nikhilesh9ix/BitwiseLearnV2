import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getAllAssessments = async () => {
  try {
    const res = await axiosInstance.get("/api/v1/assessments/get-all-assessment");
    return res.data?.data || [];
  } catch (error) {
    toast.error("error getting assessments");
    return [];
  }
};
export const getAllStudentAssessment = async (id: string) => {
  try {
    if (!id) return;
    const res = await axiosInstance.get(
      "/api/v1/assessments/get-assessment-by-batch/" + id,
    );
    return res.data?.data || [];
  } catch (error) {
    toast.error("error getting assessments");
    return [];
  }
};

export const getAllInstituteAssessment = async (id: string) => {
  try {
    const res = await axiosInstance.get(
      "/api/v1/assessments/get-assessment-by-institution/" + id,
    );
    return res.data?.data || [];
  } catch (error) {
    toast.error("error getting assessments");
    return [];
  }
};
