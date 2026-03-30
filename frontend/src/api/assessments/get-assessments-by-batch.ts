import axiosInstance from "@/lib/axios";
import { resolveApiData, type StateSetter } from "@/lib/api";

export type AssessmentListItem = {
  id: string;
  name: string;
  description: string;
  instruction?: string;
  instructions?: string;
  startTime: string;
  endTime: string;
  individualSectionTimeLimit?: number;
  status?: "UPCOMING" | "LIVE" | "ENDED";
  batchId: string;
  canAccessTest?: boolean;
};

export const getAssessmentsByBatch = async (
  stateFn: StateSetter<AssessmentListItem[]>,
  paramId: string,
): Promise<AssessmentListItem[]> =>
  resolveApiData(
    axiosInstance.get(`/api/v1/assessments/get-assessment-by-batch/${paramId}`),
    {
      fallbackMessage: "Error getting assessments",
      fallbackValue: [],
      stateSetter: stateFn,
    },
  );

export const getAssessmentsByInstitution = async (
  stateFn: StateSetter<AssessmentListItem[]>,
  paramId: string,
): Promise<AssessmentListItem[]> =>
  resolveApiData(
    axiosInstance.get(
      `/api/v1/assessments/get-assessment-by-institution/${paramId}`,
    ),
    {
      fallbackMessage: "Error getting assessments",
      fallbackValue: [],
      stateSetter: stateFn,
    },
  );
