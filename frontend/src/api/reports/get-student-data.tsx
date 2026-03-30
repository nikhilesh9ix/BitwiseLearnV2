import axiosInstance from "@/lib/axios";

export type CourseReportStudent = {
  id: string;
  name: string;
  rollNumber: string;
  courseProgresses: Array<{ id: string; contentId: string }>;
  courseAssignemntSubmissions: Array<{ id: string; assignmentId: string }>;
  courseAssignmentSubmissions?: Array<{ id: string; assignmentId: string }>;
};

type CourseReportPayload = {
  students?: CourseReportStudent[];
};

export async function getStudentData(
  pageNumber: number,
  courseId: string,
  batchId: string,
  setStudentData?: (data: CourseReportStudent[]) => void,
): Promise<CourseReportStudent[]> {
  try {
    const response = await axiosInstance.post("/api/reports/course-report/", {
      courseId,
      batchId,
      pageNumber,
    });
    const payload = response.data as CourseReportPayload;
    const students = Array.isArray(payload?.students) ? payload.students : [];

    setStudentData?.(students);
    return students;
  } catch {
    setStudentData?.([]);
    return [];
  }
}
