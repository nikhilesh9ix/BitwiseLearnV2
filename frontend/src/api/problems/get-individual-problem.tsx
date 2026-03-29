import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

const normalizeProblemPayload = (payload: any) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return {
    id: payload.id ?? "",
    name: payload.name ?? "",
    description: payload.description ?? "",
    hints: Array.isArray(payload.hints) ? payload.hints : [],
    difficulty: payload.difficulty ?? "EASY",
    published: payload.published ?? "NOT_LISTED",
    createdBy: payload.createdBy ?? payload.created_by ?? null,
    creatorType: payload.creatorType ?? payload.creator_type ?? null,
    createdAt: payload.createdAt ?? payload.created_at ?? null,
    updatedAt: payload.updatedAt ?? payload.updated_at ?? null,
    problemTopics: Array.isArray(payload.problemTopics)
      ? payload.problemTopics
      : Array.isArray(payload.topics)
        ? payload.topics.map((topic: any) => ({
            id: topic?.id ?? "",
            tagName: Array.isArray(topic?.tagName)
              ? topic.tagName
              : Array.isArray(topic?.tag_name)
                ? topic.tag_name
                : [],
          }))
        : [],
    problemTemplates: Array.isArray(payload.problemTemplates)
      ? payload.problemTemplates
      : Array.isArray(payload.templates)
        ? payload.templates.map((template: any) => ({
            id: template?.id ?? "",
            language: template?.language ?? "",
            defaultCode: template?.defaultCode ?? template?.default_code ?? "",
            functionBody: template?.functionBody ?? template?.function_body ?? "",
          }))
        : [],
    testCases: Array.isArray(payload.testCases)
      ? payload.testCases
      : Array.isArray(payload.test_cases)
        ? payload.test_cases.map((testCase: any) => ({
            id: testCase?.id ?? "",
            input: testCase?.input ?? "",
            output: testCase?.output ?? "",
            testType: testCase?.testType ?? testCase?.test_type ?? "",
          }))
        : [],
    solutions: Array.isArray(payload.solutions) ? payload.solutions : [],
    submissions: Array.isArray(payload.submissions) ? payload.submissions : [],
  };
};

export const getProblemData = async (statefn: any, paramId: string) => {
  try {
    const getProblem = await axiosInstance.get(
      "/api/v1/problems/get-dsa-problem/" + paramId,
    );
    statefn(normalizeProblemPayload(getProblem.data?.data));
  } catch (error) {
    toast.error("failed to get problem");
    statefn(null);
  }
};
export const getAdminProblemData = async (statefn: any, paramId: string) => {
  try {
    const getProblem = await axiosInstance.get(
      "/api/v1/problems/admin/get-dsa-problem/" + paramId,
    );
    statefn(normalizeProblemPayload(getProblem.data?.data));
  } catch (error) {
    toast.error("failed to get problem data");
    statefn(null);
  }
};
