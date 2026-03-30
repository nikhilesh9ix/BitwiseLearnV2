import axiosInstance from "@/lib/axios";
import { resolveApiData } from "@/lib/api";
import type { AssessmentListItem } from "./get-assessments-by-batch";

export const getAllAssessments = async (): Promise<AssessmentListItem[]> =>
  resolveApiData(axiosInstance.get("/api/v1/assessments/get-all-assessment"), {
    fallbackMessage: "Error getting assessments",
    fallbackValue: [],
  });

export const getAllStudentAssessment = async (
  id: string,
): Promise<AssessmentListItem[]> => {
  if (!id) {
    return [];
  }

  return resolveApiData(
    axiosInstance.get(`/api/v1/assessments/get-assessment-by-batch/${id}`),
    {
      fallbackMessage: "Error getting assessments",
      fallbackValue: [],
    },
  );
};

export const getAllInstituteAssessment = async (
  id: string,
): Promise<AssessmentListItem[]> =>
  resolveApiData(
    axiosInstance.get(`/api/v1/assessments/get-assessment-by-institution/${id}`),
    {
      fallbackMessage: "Error getting assessments",
      fallbackValue: [],
    },
  );
