// /assessment-report/:assessmentId/
import axiosInstance from "@/lib/axios";

export type AssessmentReportStudent = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  isSubmitted: boolean;
  totalMarks: number;
  tabSwitchCount: number;
  proctoringStatus: string;
  submittedAt: string | null;
};

type AssessmentReportPayload = {
  submissions?: AssessmentReportStudent[];
};

export async function getStudentData(
  assessmentId: string,
  pageNumber: number,
  setStudentData?: (data: AssessmentReportStudent[]) => void,
): Promise<AssessmentReportStudent[]> {
  try {
    const response = await axiosInstance.post("/api/reports/assessment-report/", {
      assessmentId,
      pageNumber,
    });
    const payload = response.data as AssessmentReportPayload;
    const submissions = Array.isArray(payload?.submissions)
      ? payload.submissions
      : [];

    setStudentData?.(submissions);
    return submissions;
  } catch {
    setStudentData?.([]);
    return [];
  }
}
