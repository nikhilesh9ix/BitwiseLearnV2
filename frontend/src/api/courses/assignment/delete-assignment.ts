import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const deleteAssignmentById = async (assignmentId: string) => {
  try {
    if (!assignmentId) throw new Error("Assignment ID is Required");

    const res = await axiosInstance.delete(
      `/api/v1/courses/remove-assignment-from-section/${assignmentId}`,
    );

    return res.data;
  } catch (error: any) {
    toast.error(error.message || "failed to add section");
  }
};
