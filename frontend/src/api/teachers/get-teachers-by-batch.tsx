import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getTeachersByBatch = async (statefn: any, paramId: string) => {
  try {
    const getTeachers = await axiosInstance.get(
      "/api/v1/teachers/get-teacher-by-batch/" + paramId,
    );
    statefn(getTeachers.data?.data || []);
  } catch (error) {
    toast.error("failed to get teacher by batch");
  }
};
