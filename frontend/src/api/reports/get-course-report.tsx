import axiosInstance from "@/lib/axios";

export type CourseReportStudent = {
  id: string;
  name: string;
  rollNumber: string;
  courseProgresses: Array<{ id: string; contentId: string }>;
  courseAssignemntSubmissions: Array<{ id: string; assignmentId: string }>;
  courseAssignmentSubmissions: Array<{ id: string; assignmentId: string }>;
};

export type CourseReportPayload = {
  students: CourseReportStudent[];
  batch: {
    id: string;
    batchname: string;
  } | null;
  course: {
    id: string;
    name: string;
  } | null;
  totalStudents: number;
  page: number;
  totalPages: number;
  totalCourseTopics: number;
  totalAssignments: number;
};

type CourseReportApiResponse = {
  students?: Array<{
    id: string;
    name?: string;
    rollNumber?: string;
    roll_number?: string;
    courseProgresses?: Array<{ id: string; contentId: string }>;
    course_progresses?: Array<{ id: string; content_id: string }>;
    courseAssignemntSubmissions?: Array<{ id: string; assignmentId: string }>;
    courseAssignmentSubmissions?: Array<{ id: string; assignmentId: string }>;
    course_assignment_submissions?: Array<{ id: string; assignment_id: string }>;
  }>;
  batch?: {
    id: string;
    batchname: string;
  };
  course?: {
    id: string;
    name: string;
  };
  total_students?: number;
  totalStudents?: number;
  page?: number;
  total_pages?: number;
  totalPages?: number;
  totalCourseTopics?: number;
  total_course_topics?: number;
  totalAssignments?: number;
  total_assignments?: number;
};

const DEFAULT_PAYLOAD: CourseReportPayload = {
  students: [],
  batch: null,
  course: null,
  totalStudents: 0,
  page: 1,
  totalPages: 1,
  totalCourseTopics: 0,
  totalAssignments: 0,
};

export async function getCourseReport(
  courseId: string,
  batchId: string,
  options?: {
    pageNumber?: number;
    limit?: number;
  },
): Promise<CourseReportPayload> {
  try {
    const response = await axiosInstance.post("/api/reports/course-report/", {
      courseId,
      batchId,
      pageNumber: options?.pageNumber ?? 0,
      limit: options?.limit ?? 1000,
    });

    const payload = (response.data?.data ?? response.data) as CourseReportApiResponse;

    return {
      students: Array.isArray(payload.students)
        ? payload.students.map((student) => {
            const courseProgresses = Array.isArray(student.courseProgresses)
              ? student.courseProgresses
              : Array.isArray(student.course_progresses)
                ? student.course_progresses.map((progress) => ({
                    id: progress.id,
                    contentId: progress.content_id,
                  }))
                : [];

            const courseAssignmentSubmissions = Array.isArray(
              student.courseAssignmentSubmissions,
            )
              ? student.courseAssignmentSubmissions
              : Array.isArray(student.courseAssignemntSubmissions)
                ? student.courseAssignemntSubmissions
                : Array.isArray(student.course_assignment_submissions)
                  ? student.course_assignment_submissions.map((submission) => ({
                      id: submission.id,
                      assignmentId: submission.assignment_id,
                    }))
                  : [];

            return {
              id: student.id,
              name: student.name ?? "Unknown Student",
              rollNumber: student.rollNumber ?? student.roll_number ?? "",
              courseProgresses,
              courseAssignemntSubmissions: courseAssignmentSubmissions,
              courseAssignmentSubmissions,
            };
          })
        : [],
      batch: payload.batch ?? null,
      course: payload.course ?? null,
      totalStudents: Number(payload.totalStudents ?? payload.total_students ?? 0),
      page: Number(payload.page ?? 1),
      totalPages: Number(payload.totalPages ?? payload.total_pages ?? 1),
      totalCourseTopics: Number(
        payload.totalCourseTopics ?? payload.total_course_topics ?? 0,
      ),
      totalAssignments: Number(
        payload.totalAssignments ?? payload.total_assignments ?? 0,
      ),
    };
  } catch {
    return DEFAULT_PAYLOAD;
  }
}
