import axiosInstance from "@/lib/axios";
import React from "react";
import toast from "react-hot-toast";

export const getAllProblemTemplate = async (statefn: any, id: string) => {
  try {
    const getProblem = await axiosInstance.get(
      "/api/v1/problems/admin/get-dsa-problem/templates/" + id,
    );
    const rawData = Array.isArray(getProblem.data)
      ? getProblem.data
      : Array.isArray(getProblem.data?.data)
        ? getProblem.data.data
        : [];

    const normalizedData = rawData.map((item: any) => ({
      ...item,
      problemId: item.problemId ?? item.problem_id ?? "",
      defaultCode: item.defaultCode ?? item.default_code ?? "",
      functionBody: item.functionBody ?? item.function_body ?? "",
    }));

    statefn(normalizedData);
  } catch (error) {
    toast.error("failed to get all template");
    statefn([]);
  }
};
