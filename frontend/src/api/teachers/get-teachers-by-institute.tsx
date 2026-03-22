import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getTeacherByInstitute = async (statefn: any, paramId: string) => {
  try {
    const response = await axiosInstance.get(
      "/api/v1/teachers/get-teacher-by-institute/" + paramId,
    );
    statefn(response.data?.data || []);
  } catch (error) {
    toast.error("failed to get teacher by institution");
  }
};
