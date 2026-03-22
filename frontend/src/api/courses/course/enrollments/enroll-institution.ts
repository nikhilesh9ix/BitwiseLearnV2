import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export async function enrollInstitutionCourses(data: {
  batchId: string;
  courses: string[];
}) {
  try {
    const result = await axiosInstance.post(
      "/api/v1/courses/add-course-enrollment",
      data,
    );
    toast.success("enrolled");
  } catch (error) {
    toast.error("failed to enroll");
  }
}
