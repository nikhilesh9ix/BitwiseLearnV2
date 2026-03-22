import axiosInstance from "@/lib/axios";

export const getAllCourses = async (publishedOnly: boolean = false) => {
  const endpoint = publishedOnly
    ? "/api/v1/courses/listed-courses"
    : "/api/v1/courses/get-all-courses-by-admin";
  const res = await axiosInstance.get(endpoint);
  return res.data?.data || [];
};
export const getInstitutionCourses = async (id: string) => {
  const res = await axiosInstance.get(
    "/api/v1/courses/get-course-by-institution/" + id,
  );
  return res.data?.data || [];
};

export const getStudentCourses = async () => {
  const res = await axiosInstance.get("/api/v1/courses/get-student-courses");
  return res.data?.data || [];
};
