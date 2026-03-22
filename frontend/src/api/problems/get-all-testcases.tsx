import axiosInstance from "@/lib/axios";
import React from "react";
import toast from "react-hot-toast";

export const getAllProblemTestCases = async (statefn: any, id: string) => {
  try {
    const getProblem = await axiosInstance.get(
      "/api/v1/problems/admin/get-dsa-problem/testcases/" + id,
    );
    statefn(getProblem.data);
  } catch (error) {
    toast.error("failed to get testcase");
  }
};
