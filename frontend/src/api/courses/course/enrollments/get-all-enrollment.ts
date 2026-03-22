import axiosInstance from "@/lib/axios";

export async function getCourseEnrollments(
  id: string,
  courseInfo: any,
  stateFn: any,
) {
  const data = await axiosInstance.get(
    "/api/v1/courses/get-course-enrollments/" + id,
  );
  // console.log(data);
  courseInfo(data.data.course);
  stateFn(data.data.data);
}
export async function getInstituteEnrollments(
  id: string,
  institutionId: string,
  courseInfo: any,
  stateFn: any,
) {
  const data = await axiosInstance.get(
    "/api/course/enrollments/institute/" + institutionId + "/" + id,
  );
  courseInfo(data.data.course);
  // console.log(data.data.data);
  stateFn(data.data.data);
}
