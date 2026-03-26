import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getProblemSolutionById = async (statefn: any, id: string) => {
  try {
    const getProblem = await axiosInstance.get(
      "/api/v1/problems/admin/get-dsa-problem/solution/" + id,
    );
    const rawData = Array.isArray(getProblem.data)
      ? getProblem.data
      : Array.isArray(getProblem.data?.data)
        ? getProblem.data.data
        : [];

    const normalizedData = rawData.map((item: any) => ({
      ...item,
      videoSolution: item.videoSolution ?? item.video_solution ?? null,
      problemId: item.problemId ?? item.problem_id ?? "",
    }));

    statefn(normalizedData[0] ?? null);
  } catch (error) {
    toast.error("failed to get problem solution");
    statefn(null);
  }
};
