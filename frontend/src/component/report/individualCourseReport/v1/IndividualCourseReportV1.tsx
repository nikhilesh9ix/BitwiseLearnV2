"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import type { TooltipProps } from "recharts";
import {
  ArrowLeft,
  Users,
  FileCheck2,
  BarChart3,
  ClipboardList,
} from "lucide-react";

import {
  getColors,
  type Colors,
} from "@/component/general/(Color Manager)/useColors";
import {
  getStudentData,
  type CourseReportStudent,
} from "@/api/reports/get-student-data";

const Colors = getColors();
const CHART_COLORS = ["#10b981", "#ef4444"];
const PAGE_SIZE = 100;

type TooltipPayload = TooltipProps<number, string>["payload"];

function ProgressTooltip({
  active,
  payload,
  colors,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  colors: Colors;
}) {
  const item = payload?.[0];
  const studentName =
    item && typeof item.payload === "object" && item.payload && "name" in item.payload
      ? String(item.payload.name)
      : "";

  if (!active || !item) {
    return null;
  }

  return (
    <div
      className={`rounded-md ${colors.background.secondary} ${colors.border.defaultThin} px-3 py-2 text-sm`}
    >
      <p className={`font-medium ${colors.text.primary}`}>{studentName}</p>
      <p className="text-emerald-400">Progress: {String(item.value ?? 0)}</p>
    </div>
  );
}

function IndividualCourseReportV1({
  courseId,
  batchId,
}: {
  courseId: string;
  batchId: string;
}) {
  const [students, setStudents] = useState<CourseReportStudent[]>([]);
  const [pageNumber, setPageNumber] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      await getStudentData(0, courseId, batchId, setStudents);
    };

    void loadData();
  }, [courseId, batchId]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students;
    }

    const query = searchTerm.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.rollNumber.toLowerCase().includes(query),
    );
  }, [students, searchTerm]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = useMemo(() => {
    const start = pageNumber * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, pageNumber]);

  const totalStudents = students.length;
  const submittedCount = students.filter(
    (student) => student.courseAssignemntSubmissions.length > 0,
  ).length;
  const notSubmittedCount = totalStudents - submittedCount;
  const submissionRate =
    totalStudents > 0
      ? ((submittedCount / totalStudents) * 100).toFixed(1)
      : "0";

  const progressChartData = students.map((student) => ({
    name: student.name.split(" ")[0],
    progress: student.courseProgresses.length,
  }));

  const assignmentStats = [
    { name: "Submitted", value: submittedCount },
    { name: "Pending", value: notSubmittedCount },
  ];

  return (
    <div
      className={`min-h-screen ${Colors.background.primary} ${Colors.text.primary} p-6`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              router.push(`/admin-dashboard/reports/courses/${courseId}`)
            }
            className={`flex items-center gap-2 text-sm ${Colors.text.secondary} ${Colors.hover.textSpecial} cursor-pointer transition`}
          >
            <ArrowLeft size={18} />
            Back to Courses
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-emerald-500 rounded-full" />
          <h1 className="text-2xl font-semibold">Individual Course Report</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={<Users />}
          />
          <StatCard
            title="Submission Rate"
            value={`${submissionRate}%`}
            icon={<FileCheck2 />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Student Progress"
            subtitle="Completed modules per student"
            icon={<BarChart3 />}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressChartData}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip content={<ProgressTooltip colors={Colors} />} />
                <Bar
                  dataKey="progress"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card
            title="Assignment Status"
            subtitle="Submission overview"
            icon={<ClipboardList />}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assignmentStats}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {assignmentStats.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div
          className={`rounded-lg ${Colors.border.defaultThin} ${Colors.background.secondary} overflow-hidden`}
        >
          <div
            className={`flex items-center justify-between gap-2 p-5 border-b ${Colors.border.defaultThin}`}
          >
            <div className="flex items-center gap-2">
              <ClipboardList size={18} />
              <h2 className={`font-medium ${Colors.text.primary}`}>
                Student Summary
              </h2>
            </div>

            <input
              type="text"
              placeholder="Search by name or roll number"
              className={`rounded ${Colors.background.primary} text-sm p-2 ${Colors.text.primary} placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-300`}
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPageNumber(0);
              }}
            />
          </div>

          <table className="w-full text-sm">
            <thead
              className={`${Colors.background.primary} ${Colors.text.primary}`}
            >
              <tr>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Roll No</th>
                <th className="text-left p-4">Progress</th>
                <th className="text-left p-4">Assignments</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => (
                <tr
                  key={student.id}
                  className={`border-t border-zinc-800 ${Colors.hover.special}`}
                >
                  <td className="p-4">{student.name}</td>
                  <td className="p-4 text-zinc-400">{student.rollNumber}</td>
                  <td className="p-4 text-emerald-400">
                    {student.courseProgresses.length}
                  </td>
                  <td className="p-4">
                    {student.courseAssignemntSubmissions.length}
                  </td>
                  <td className="p-4">
                    {student.courseAssignemntSubmissions.length > 0 ? (
                      <span className="text-emerald-400">Submitted</span>
                    ) : (
                      <span className="text-red-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-4 text-zinc-400">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center p-4 border-t border-zinc-800">
            <button
              disabled={pageNumber === 0}
              onClick={() => setPageNumber((page) => Math.max(0, page - 1))}
              className={`px-4 py-2 rounded ${Colors.background.special} ${Colors.text.primary} cursor-pointer disabled:opacity-40`}
            >
              Prev
            </button>
            <span className={`text-sm ${Colors.text.secondary}`}>
              Page {pageNumber + 1} of {totalPages || 1}
            </span>
            <button
              disabled={pageNumber + 1 >= totalPages}
              onClick={() =>
                setPageNumber((page) => Math.min(page + 1, totalPages - 1))
              }
              className={`px-4 py-2 rounded ${Colors.background.special} ${Colors.text.primary} cursor-pointer disabled:opacity-40`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border ${Colors.border.defaultThin} ${Colors.background.secondary} p-5`}
    >
      <div>
        <p className={`text-sm ${Colors.text.secondary}`}>{title}</p>
        <p className={`text-3xl font-semibold mt-1 ${Colors.text.primary}`}>
          {value}
        </p>
      </div>
      <div className="text-emerald-500">{icon}</div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border ${Colors.border.defaultThin} ${Colors.background.secondary} p-5`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-emerald-500">{icon}</span>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className={`text-sm ${Colors.text.secondary} mb-4`}>{subtitle}</p>
      {children}
    </div>
  );
}

export default IndividualCourseReportV1;


