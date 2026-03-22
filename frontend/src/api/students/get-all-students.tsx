import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getAllStudents = async (statefn: any) => {
  try {
    const getAllStudents = await axiosInstance.get(
      "/api/v1/students/get-all-student",
    );
    statefn(getAllStudents.data?.data || []);
  } catch (error) {
    toast.error("failed to get all students");
  }
};
