import axiosInstance from "@/lib/axios";
import React from "react";
import toast from "react-hot-toast";

export const getAllProblemTestCases = async (statefn: any, id: string) => {
  try {
    const getProblem = await axiosInstance.get(
      "/api/v1/problems/admin/get-dsa-problem/testcases/" + id,
    );
    const rawData = Array.isArray(getProblem.data)
      ? getProblem.data
      : Array.isArray(getProblem.data?.data)
        ? getProblem.data.data
        : [];

    const normalizedData = rawData.map((item: any) => ({
      ...item,
      testType: item.testType ?? item.test_type ?? "",
      problemId: item.problemId ?? item.problem_id ?? "",
      createdAt: item.createdAt ?? item.created_at ?? "",
      updatedAt: item.updatedAt ?? item.updated_at ?? "",
    }));

    statefn(normalizedData);
  } catch (error) {
    toast.error("failed to get testcase");
    statefn([]);
  }
};
