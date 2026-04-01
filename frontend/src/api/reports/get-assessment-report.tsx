import axiosInstance from "@/lib/axios";

type AssessmentReportApiResponse = {
  assessment?: {
    id: string;
    name: string;
    description: string;
    start_time?: string;
    end_time?: string;
    startTime?: string;
    endTime?: string;
    status: string;
    report_status?: string;
    reportStatus?: string;
    individual_section_time_limit?: number | null;
    individualSectionTimeLimit?: number | null;
  };
  submissions?: Array<{
    id: string;
    student_id?: string;
    studentId?: string;
    student_name?: string;
    studentName?: string;
    student_email?: string;
    studentEmail?: string;
    student_roll_number?: string;
    studentRollNumber?: string;
    is_submitted?: boolean;
    isSubmitted?: boolean;
    total_marks?: number | null;
    totalMarks?: number | null;
    tab_switch_count?: number;
    tabSwitchCount?: number;
    proctoring_status?: string;
    proctoringStatus?: string;
    student_ip?: string;
    studentIp?: string;
    started_at?: string | null;
    startedAt?: string | null;
    submitted_at?: string | null;
    submittedAt?: string | null;
  }>;
  total?: number;
  page?: number;
  total_pages?: number;
};

export type AssessmentReportSummary = {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
  reportStatus: string;
  individualSectionTimeLimit: number | null;
};

export type AssessmentReportStudent = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRollNumber: string;
  isSubmitted: boolean;
  totalMarks: number;
  tabSwitchCount: number;
  proctoringStatus: string;
  studentIp: string;
  startedAt: string | null;
  submittedAt: string | null;
};

export type AssessmentReportPayload = {
  assessment: AssessmentReportSummary | null;
  submissions: AssessmentReportStudent[];
  total: number;
  page: number;
  totalPages: number;
};

const DEFAULT_PAYLOAD: AssessmentReportPayload = {
  assessment: null,
  submissions: [],
  total: 0,
  page: 1,
  totalPages: 1,
};

export async function getAssessmentReport(
  assessmentId: string,
  options?: {
    pageNumber?: number;
    limit?: number;
  },
): Promise<AssessmentReportPayload> {
  try {
    const response = await axiosInstance.post("/api/reports/assessment-report/", {
      assessmentId,
      pageNumber: options?.pageNumber ?? 0,
      limit: options?.limit ?? 1000,
    });

    const payload = response.data as AssessmentReportApiResponse;

    return {
      assessment: payload.assessment
        ? {
            id: payload.assessment.id,
            name: payload.assessment.name,
            description: payload.assessment.description,
            startTime:
              payload.assessment.startTime ?? payload.assessment.start_time ?? "",
            endTime:
              payload.assessment.endTime ?? payload.assessment.end_time ?? "",
            status: payload.assessment.status,
            reportStatus:
              payload.assessment.reportStatus ??
              payload.assessment.report_status ??
              "NOT_REQUESTED",
            individualSectionTimeLimit:
              payload.assessment.individualSectionTimeLimit ??
              payload.assessment.individual_section_time_limit ??
              null,
          }
        : null,
      submissions: Array.isArray(payload.submissions)
        ? payload.submissions.map((submission) => ({
            id: submission.id,
            studentId: submission.studentId ?? submission.student_id ?? "",
            studentName:
              submission.studentName ?? submission.student_name ?? "Unknown Student",
            studentEmail: submission.studentEmail ?? submission.student_email ?? "",
            studentRollNumber:
              submission.studentRollNumber ?? submission.student_roll_number ?? "",
            isSubmitted: Boolean(
              submission.isSubmitted ?? submission.is_submitted ?? false,
            ),
            totalMarks: Number(submission.totalMarks ?? submission.total_marks ?? 0),
            tabSwitchCount: Number(
              submission.tabSwitchCount ?? submission.tab_switch_count ?? 0,
            ),
            proctoringStatus:
              submission.proctoringStatus ?? submission.proctoring_status ?? "UNKNOWN",
            studentIp: submission.studentIp ?? submission.student_ip ?? "",
            startedAt: submission.startedAt ?? submission.started_at ?? null,
            submittedAt: submission.submittedAt ?? submission.submitted_at ?? null,
          }))
        : [],
      total: Number(payload.total ?? 0),
      page: Number(payload.page ?? 1),
      totalPages: Number(payload.total_pages ?? 1),
    };
  } catch {
    return DEFAULT_PAYLOAD;
  }
}
