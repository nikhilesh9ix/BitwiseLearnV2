import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getStudentsByBatch = async (statefn: any, paramId: string) => {
  try {
    const getStudents = await axiosInstance.get(
      "/api/v1/students/get-student-by-batch/" + paramId,
    );
    statefn(getStudents.data?.data || []);
  } catch (error) {
    toast.error("failed to get students");
  }
};
