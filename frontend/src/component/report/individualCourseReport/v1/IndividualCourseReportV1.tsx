"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  Users,
} from "lucide-react";

import {
  getCourseReport,
  type CourseReportPayload,
} from "@/api/reports/get-course-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/component/ui/tabs";
import {
  CourseReportPDF,
  type CourseReportStats,
} from "./CourseReportPDF";

const getAssignmentSubmissions = (
  student: CourseReportPayload["students"][number],
) => student.courseAssignmentSubmissions ?? student.courseAssignemntSubmissions ?? [];

function IndividualCourseReportV1({
  courseId,
  batchId,
}: {
  courseId: string;
  batchId: string;
}) {
  const router = useRouter();
  const [report, setReport] = useState<CourseReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("preview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      const payload = await getCourseReport(courseId, batchId, {
        pageNumber: 0,
        limit: 1000,
      });
      setReport(payload);
      setLoading(false);
    };

    void loadReport();
  }, [courseId, batchId]);

  const students = useMemo(() => report?.students ?? [], [report]);
  const course = report?.course ?? null;
  const batch = report?.batch ?? null;

  const stats = useMemo<CourseReportStats>(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(
      (student) =>
        student.courseProgresses.length > 0 ||
        getAssignmentSubmissions(student).length > 0,
    ).length;
    const studentsWithAssignments = students.filter(
      (student) => getAssignmentSubmissions(student).length > 0,
    ).length;
    const studentsWithFullProgress =
      report?.totalCourseTopics && report.totalCourseTopics > 0
        ? students.filter(
            (student) =>
              student.courseProgresses.length >= report.totalCourseTopics,
          ).length
        : 0;

    return {
      totalStudents,
      activeStudents,
      completionRate:
        totalStudents > 0
          ? Math.round((studentsWithFullProgress / totalStudents) * 100)
          : 0,
      assignmentSubmissionRate:
        totalStudents > 0
          ? Math.round((studentsWithAssignments / totalStudents) * 100)
          : 0,
      averageCompletedTopics:
        totalStudents > 0
          ? Math.round(
              students.reduce(
                (total, student) => total + student.courseProgresses.length,
                0,
              ) / totalStudents,
            )
          : 0,
    };
  }, [report, students]);

  const progressChartData = useMemo(
    () =>
      [...students]
        .sort(
          (left, right) =>
            right.courseProgresses.length - left.courseProgresses.length,
        )
        .slice(0, 8)
        .map((student) => ({
          name: student.name.split(" ")[0] ?? student.name,
          progress: student.courseProgresses.length,
        })),
    [students],
  );

  const assignmentChartData = useMemo(
    () => [
      {
        name: "Submitted",
        value: students.filter(
          (student) => getAssignmentSubmissions(student).length > 0,
        ).length,
        color: "#10b981",
      },
      {
        name: "Pending",
        value: students.filter(
          (student) => getAssignmentSubmissions(student).length === 0,
        ).length,
        color: "#ef4444",
      },
    ],
    [students],
  );

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.rollNumber.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          getAssignmentSubmissions(student).length > 0) ||
        (statusFilter === "pending" &&
          getAssignmentSubmissions(student).length === 0);

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, students]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
        <span className="text-sm text-neutral-400">Generating report data...</span>
      </div>
    );
  }

  if (!course || !batch || !report) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
          <h1 className="text-xl font-semibold">Failed to load report</h1>
          <p className="mt-2 text-sm text-neutral-400">
            The course report data could not be loaded.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition hover:bg-neutral-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const safeName = `${course.name}_${batch.batchname}`.replace(/[^a-z0-9]/gi, "_");
  const pdfFileName = `${safeName || "course"}_Report.pdf`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <button
                onClick={() => router.push(`/admin-dashboard/reports/courses/${courseId}`)}
                className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{course.name}</h1>
                  <p className="mt-1 text-sm text-neutral-400">
                    Batch report for {batch.batchname} with progress and assignment analytics.
                  </p>
                </div>
              </div>
            </div>

            <PDFDownloadLink
              document={<CourseReportPDF report={report} stats={stats} />}
              fileName={pdfFileName}
            >
              {({ loading: pdfLoading }) => (
                <button
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </button>
              )}
            </PDFDownloadLink>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Students"
              value={stats.totalStudents}
            />
            <StatCard
              icon={<FileCheck2 className="h-5 w-5" />}
              label="Active"
              value={stats.activeStudents}
            />
            <StatCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Completion"
              value={stats.completionRate}
              suffix="%"
            />
            <StatCard
              icon={<FileText className="h-5 w-5" />}
              label="Assignments"
              value={stats.assignmentSubmissionRate}
              suffix="%"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-200">Top Progress</h2>
                <p className="text-xs text-neutral-500">
                  Learners with the most completed course topics.
                </p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={progressChartData}>
                  <XAxis dataKey="name" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#a3a3a3", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#171717",
                      border: "1px solid #262626",
                      borderRadius: 12,
                      color: "#ffffff",
                    }}
                  />
                  <Bar dataKey="progress" radius={[8, 8, 0, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-200">Assignment Status</h2>
                <p className="text-xs text-neutral-500">
                  How many learners have submitted at least one assignment.
                </p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={assignmentChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {assignmentChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#171717",
                      border: "1px solid #262626",
                      borderRadius: 12,
                      color: "#ffffff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-2">
                {assignmentChartData.map((entry) => (
                  <div
                    key={entry.name}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-300"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.name}: {entry.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <TabsList className="bg-neutral-950">
                <TabsTrigger value="preview" className="text-neutral-300">
                  <Eye className="h-4 w-4" />
                  PDF Preview
                </TabsTrigger>
                <TabsTrigger value="students" className="text-neutral-300">
                  <Users className="h-4 w-4" />
                  Student Data
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search name or roll number..."
                  className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-emerald-500"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter students by activity status"
                  className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-white outline-none transition focus:border-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <TabsContent value="preview" className="mt-6">
              <div className="h-[720px] overflow-hidden rounded-2xl border border-neutral-800 bg-white">
                <PDFViewer width="100%" height="100%" showToolbar>
                  <CourseReportPDF report={report} stats={stats} />
                </PDFViewer>
              </div>
            </TabsContent>

            <TabsContent value="students" className="mt-6">
              <div className="overflow-hidden rounded-2xl border border-neutral-800">
                <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1.2fr] gap-3 border-b border-neutral-800 bg-neutral-950/80 px-4 py-3 text-xs uppercase tracking-[0.2em] text-neutral-500">
                  <span>Student</span>
                  <span>Roll No</span>
                  <span>Topics</span>
                  <span>Assignments</span>
                  <span>Status</span>
                </div>

                <div className="max-h-[720px] overflow-y-auto">
                  {filteredStudents.map((student) => {
                    const assignmentSubmissions = getAssignmentSubmissions(student);
                    const isActive = assignmentSubmissions.length > 0;

                    return (
                      <div
                        key={student.id}
                        className="grid grid-cols-[2fr,1fr,1fr,1fr,1.2fr] gap-3 border-b border-neutral-800 px-4 py-4 text-sm text-neutral-200 transition hover:bg-neutral-950/50"
                      >
                        <span className="font-medium text-white">{student.name}</span>
                        <span className="text-neutral-400">{student.rollNumber}</span>
                        <span>{student.courseProgresses.length}</span>
                        <span>{assignmentSubmissions.length}</span>
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-rose-500/15 text-rose-400"
                          }`}
                        >
                          {isActive ? "Active" : "Pending"}
                        </span>
                      </div>
                    );
                  })}

                  {filteredStudents.length === 0 && (
                    <div className="px-4 py-12 text-center text-sm text-neutral-500">
                      No students match the current search and status filters.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
      <div className="flex items-center justify-between">
        <span className="rounded-xl bg-neutral-900 p-2 text-emerald-300">{icon}</span>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      </div>
      <p className="mt-5 text-3xl font-semibold text-white">
        {value}
        {suffix ?? ""}
      </p>
    </div>
  );
}

export default IndividualCourseReportV1;
