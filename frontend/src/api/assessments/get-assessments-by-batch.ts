import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getAssessmentsByBatch = async (statefn: any, paramId: string) => {
  try {
    const getAssessments = await axiosInstance.get(
      "/api/v1/assessments/get-assessment-by-batch/" + paramId,
    );
    statefn(getAssessments.data?.data || []);
  } catch (error) {
    toast.error("error getting assessments");
  }
};
export const getAssessmentsByInstitution = async (
  statefn: any,
  paramId: string,
) => {
  const getAssessments = await axiosInstance.get(
    "/api/v1/assessments/get-assessment-by-institution/" + paramId,
  );
  statefn(getAssessments.data?.data || []);
};
