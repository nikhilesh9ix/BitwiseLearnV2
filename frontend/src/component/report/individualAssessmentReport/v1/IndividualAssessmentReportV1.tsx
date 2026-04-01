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
  Download,
  Eye,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  getAssessmentReport,
  type AssessmentReportPayload,
} from "@/api/reports/get-assessment-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/component/ui/tabs";
import {
  AssessmentReportPDF,
  type AssessmentReportStats,
} from "./AssessmentReportPDF";

const STATUS_META: Record<
  string,
  { label: string; color: string; background: string }
> = {
  NOT_CHEATED: {
    label: "Honest",
    color: "#22c55e",
    background: "rgba(34, 197, 94, 0.15)",
  },
  CHEATED: {
    label: "Flagged",
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.15)",
  },
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusMeta = (status?: string | null) => {
  const normalizedStatus = status ?? "UNKNOWN";

  return STATUS_META[normalizedStatus] ?? {
    label: normalizedStatus.replaceAll("_", " "),
    color: "#94a3b8",
    background: "rgba(148, 163, 184, 0.15)",
  };
};

function IndividualAssessmentReportV1({
  assessmentId,
}: {
  assessmentId: string;
}) {
  const router = useRouter();
  const [report, setReport] = useState<AssessmentReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("preview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      const payload = await getAssessmentReport(assessmentId, {
        pageNumber: 0,
        limit: 1000,
      });
      setReport(payload);
      setLoading(false);
    };

    void loadReport();
  }, [assessmentId]);

  const assessment = report?.assessment ?? null;
  const submissions = useMemo(() => report?.submissions ?? [], [report]);

  const stats = useMemo<AssessmentReportStats>(() => {
    const totalParticipants = submissions.length;
    const submittedStudents = submissions.filter((submission) => submission.isSubmitted);
    const submittedCount = submittedStudents.length;
    const averageScore =
      submittedCount > 0
        ? Math.round(
            submittedStudents.reduce(
              (total, submission) => total + submission.totalMarks,
              0,
            ) / submittedCount,
          )
        : 0;
    const flaggedCount = submissions.filter(
      (submission) => submission.proctoringStatus !== "NOT_CHEATED",
    ).length;

    return {
      totalParticipants,
      submittedCount,
      averageScore,
      flaggedCount,
      honestCount: Math.max(0, totalParticipants - flaggedCount),
      totalTabSwitches: submissions.reduce(
        (total, submission) => total + submission.tabSwitchCount,
        0,
      ),
    };
  }, [submissions]);

  const statusChartData = useMemo(() => {
    const counts = submissions.reduce<Record<string, number>>((accumulator, submission) => {
      accumulator[submission.proctoringStatus] =
        (accumulator[submission.proctoringStatus] ?? 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts).map(([status, value]) => ({
      name: getStatusMeta(status).label,
      value,
      color: getStatusMeta(status).color,
    }));
  }, [submissions]);

  const scoreChartData = useMemo(
    () =>
      [...submissions]
        .filter((submission) => submission.isSubmitted)
        .sort((left, right) => right.totalMarks - left.totalMarks)
        .slice(0, 8)
        .map((submission) => ({
          name: submission.studentName.split(" ")[0] ?? submission.studentName,
          score: submission.totalMarks,
        })),
    [submissions],
  );

  const filteredSubmissions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return submissions.filter((submission) => {
      const matchesSearch =
        !query ||
        submission.studentName.toLowerCase().includes(query) ||
        submission.studentRollNumber.toLowerCase().includes(query) ||
        submission.studentEmail.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || submission.proctoringStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, submissions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
        <span className="text-sm text-neutral-400">Generating report data...</span>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
          <h1 className="text-xl font-semibold">Failed to load report</h1>
          <p className="mt-2 text-sm text-neutral-400">
            The assessment report data could not be loaded.
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

  const safeName = assessment.name.replace(/[^a-z0-9]/gi, "_");
  const pdfFileName = `${safeName || "assessment"}_Report.pdf`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <button
                onClick={() => router.back()}
                className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-500/15 p-3 text-blue-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{assessment.name}</h1>
                  <p className="mt-1 max-w-3xl text-sm text-neutral-400">
                    {assessment.description || "Assessment performance and proctoring report."}
                  </p>
                </div>
              </div>
            </div>

            <PDFDownloadLink
              document={
                <AssessmentReportPDF
                  assessment={assessment}
                  students={submissions}
                  stats={stats}
                />
              }
              fileName={pdfFileName}
            >
              {({ loading: pdfLoading }) => (
                <button
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
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
              label="Participants"
              value={stats.totalParticipants}
            />
            <StatCard
              icon={<FileText className="h-5 w-5" />}
              label="Submitted"
              value={stats.submittedCount}
            />
            <StatCard
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Average Score"
              value={stats.averageScore}
            />
            <StatCard
              icon={<ShieldAlert className="h-5 w-5" />}
              label="Flagged"
              value={stats.flaggedCount}
              danger
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-200">Top Scores</h2>
                <p className="text-xs text-neutral-500">
                  Highest submitted scores in this assessment.
                </p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={scoreChartData}>
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
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-neutral-200">Proctoring Status</h2>
                <p className="text-xs text-neutral-500">
                  Distribution of clean versus flagged participants.
                </p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {statusChartData.map((entry) => (
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
                {statusChartData.map((entry) => (
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
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
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
                  placeholder="Search name, roll number or email..."
                  className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-blue-500"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter students by proctoring status"
                  className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {Object.keys(
                    submissions.reduce<Record<string, true>>((accumulator, submission) => {
                      accumulator[submission.proctoringStatus] = true;
                      return accumulator;
                    }, {}),
                  ).map((status) => (
                    <option key={status} value={status}>
                      {getStatusMeta(status).label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <TabsContent value="preview" className="mt-6">
              <div className="h-[720px] overflow-hidden rounded-2xl border border-neutral-800 bg-white">
                <PDFViewer width="100%" height="100%" showToolbar>
                  <AssessmentReportPDF
                    assessment={assessment}
                    students={submissions}
                    stats={stats}
                  />
                </PDFViewer>
              </div>
            </TabsContent>

            <TabsContent value="students" className="mt-6">
              <div className="overflow-hidden rounded-2xl border border-neutral-800">
                <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,1.2fr] gap-3 border-b border-neutral-800 bg-neutral-950/80 px-4 py-3 text-xs uppercase tracking-[0.2em] text-neutral-500">
                  <span>Student</span>
                  <span>Roll No</span>
                  <span>Score</span>
                  <span>Tabs</span>
                  <span>Submitted</span>
                  <span>Status</span>
                </div>

                <div className="max-h-[720px] overflow-y-auto">
                  {filteredSubmissions.map((submission) => {
                    const status = getStatusMeta(submission.proctoringStatus);

                    return (
                      <div
                        key={submission.id}
                        className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,1.2fr] gap-3 border-b border-neutral-800 px-4 py-4 text-sm text-neutral-200 transition hover:bg-neutral-950/50"
                      >
                        <div>
                          <p className="font-medium text-white">{submission.studentName}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {submission.studentEmail}
                          </p>
                        </div>
                        <span className="text-neutral-400">
                          {submission.studentRollNumber || "N/A"}
                        </span>
                        <span>{submission.totalMarks}</span>
                        <span>{submission.tabSwitchCount}</span>
                        <div className="text-xs text-neutral-400">
                          <p>{submission.isSubmitted ? "Yes" : "No"}</p>
                          <p className="mt-1 text-[11px] text-neutral-500">
                            {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                        <span
                          className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: status.background,
                            color: status.color,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>
                    );
                  })}

                  {filteredSubmissions.length === 0 && (
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
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
      <div className="flex items-center justify-between">
        <span className="rounded-xl bg-neutral-900 p-2 text-blue-300">{icon}</span>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      </div>
      <p className={`mt-5 text-3xl font-semibold ${danger ? "text-amber-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

export default IndividualAssessmentReportV1;
