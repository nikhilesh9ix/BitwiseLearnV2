import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getAllProblemCount = async (statefn: any) => {
  try {
    const getProblem = await axiosInstance.get("/api/v1/problems/get-all-dsa-problem/");
    const problems = getProblem.data?.data || [];

    const summary = problems.reduce(
      (acc: { easy: number; medium: number; hard: number; totalQuestion: number }, p: any) => {
        const difficulty = String(p?.difficulty || "").toUpperCase();
        if (difficulty === "EASY") acc.easy += 1;
        if (difficulty === "MEDIUM") acc.medium += 1;
        if (difficulty === "HARD") acc.hard += 1;
        acc.totalQuestion += 1;
        return acc;
      },
      { easy: 0, medium: 0, hard: 0, totalQuestion: 0 },
    );

    statefn(summary);
  } catch (error: any) {
    toast.error("failed to get all problem count");
    statefn({ easy: 0, medium: 0, hard: 0, totalQuestion: 0 });
    throw error;
  }
};
