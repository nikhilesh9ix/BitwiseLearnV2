import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type {
  CourseReportPayload,
  CourseReportStudent,
} from "@/api/reports/get-course-report";

export type CourseReportStats = {
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  assignmentSubmissionRate: number;
  averageCompletedTopics: number;
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  cover: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 12,
    color: "#0f766e",
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#4b5563",
    marginBottom: 28,
  },
  meta: {
    fontSize: 11,
    color: "#4b5563",
    marginBottom: 6,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#99f6e4",
  },
  statRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 10,
  },
  statLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 19,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#ccfbf1",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableRowLast: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  cell: {
    flex: 1,
    fontSize: 8,
  },
  cellWide: {
    flex: 2,
    fontSize: 8,
  },
  cellGood: {
    flex: 1,
    fontSize: 8,
    color: "#15803d",
  },
  cellWarn: {
    flex: 1,
    fontSize: 8,
    color: "#b91c1c",
  },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 20,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 8,
    color: "#6b7280",
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 36,
    fontSize: 8,
    color: "#6b7280",
  },
});

const chunkRows = <T,>(rows: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
};

const Footer = ({ title }: { title: string }) => (
  <>
    <Text style={styles.footer}>Bitwise Learn | {title} | Course Report</Text>
    <Text
      style={styles.pageNumber}
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      fixed
    />
  </>
);

const getAssignmentSubmissions = (student: CourseReportStudent) =>
  student.courseAssignmentSubmissions ?? student.courseAssignemntSubmissions ?? [];

const statusLabel = (student: CourseReportStudent) =>
  getAssignmentSubmissions(student).length > 0 ? "Active" : "At Risk";

export function CourseReportPDF({
  report,
  stats,
}: {
  report: CourseReportPayload;
  stats: CourseReportStats;
}) {
  const courseName = report.course?.name ?? "Course";
  const batchName = report.batch?.batchname ?? "Batch";
  const tablePages = chunkRows(report.students, 20);
  const topStudents = [...report.students]
    .sort(
      (left, right) =>
        right.courseProgresses.length - left.courseProgresses.length ||
        getAssignmentSubmissions(right).length -
          getAssignmentSubmissions(left).length,
    )
    .slice(0, 5);

  return (
    <Document
      title={`${courseName} Course Report`}
      author="Bitwise Learn"
      subject="Course progress analytics report"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.brand}>Bitwise Learn</Text>
          <Text style={styles.title}>{courseName}</Text>
          <Text style={styles.subtitle}>Course Progress Report</Text>
          <Text style={styles.meta}>Batch: {batchName}</Text>
          <Text style={styles.meta}>Students: {stats.totalStudents}</Text>
          <Text style={styles.meta}>Topics: {report.totalCourseTopics}</Text>
          <Text style={styles.meta}>Assignments: {report.totalAssignments}</Text>
        </View>
        <Footer title={courseName} />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Students</Text>
              <Text style={styles.statValue}>{stats.totalStudents}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active Students</Text>
              <Text style={styles.statValue}>{stats.activeStudents}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Completion Rate</Text>
              <Text style={styles.statValue}>{stats.completionRate}%</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Assignment Submission Rate</Text>
              <Text style={styles.statValue}>{stats.assignmentSubmissionRate}%</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg Completed Topics</Text>
              <Text style={styles.statValue}>{stats.averageCompletedTopics}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Batch</Text>
              <Text style={styles.statValue}>{batchName}</Text>
            </View>
          </View>
        </View>

        {topStudents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performing Learners</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.cell}>Rank</Text>
                <Text style={styles.cellWide}>Student</Text>
                <Text style={styles.cell}>Roll No</Text>
                <Text style={styles.cell}>Topics</Text>
                <Text style={styles.cell}>Assignments</Text>
              </View>
              {topStudents.map((student, index) => {
                const rowStyle =
                  index === topStudents.length - 1
                    ? styles.tableRowLast
                    : index % 2 === 0
                      ? styles.tableRow
                      : [styles.tableRow, styles.tableRowAlt];

                return (
                  <View key={student.id} style={rowStyle}>
                    <Text style={styles.cell}>{index + 1}</Text>
                    <Text style={styles.cellWide}>{student.name}</Text>
                    <Text style={styles.cell}>{student.rollNumber}</Text>
                    <Text style={styles.cell}>{student.courseProgresses.length}</Text>
                    <Text style={styles.cell}>{getAssignmentSubmissions(student).length}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <Footer title={courseName} />
      </Page>

      {tablePages.map((students, pageIndex) => (
        <Page key={`students-${pageIndex}`} size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Student Progress Summary {tablePages.length > 1 ? `(${pageIndex + 1}/${tablePages.length})` : ""}
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.cellWide}>Student</Text>
                <Text style={styles.cell}>Roll No</Text>
                <Text style={styles.cell}>Topics</Text>
                <Text style={styles.cell}>Assignments</Text>
                <Text style={styles.cell}>Status</Text>
              </View>
              {students.map((student, index) => {
                const rowStyle =
                  index === students.length - 1
                    ? styles.tableRowLast
                    : index % 2 === 0
                      ? styles.tableRow
                      : [styles.tableRow, styles.tableRowAlt];

                const isActive = getAssignmentSubmissions(student).length > 0;

                return (
                  <View key={student.id} style={rowStyle}>
                    <Text style={styles.cellWide}>{student.name}</Text>
                    <Text style={styles.cell}>{student.rollNumber}</Text>
                    <Text style={styles.cell}>{student.courseProgresses.length}</Text>
                    <Text style={styles.cell}>{getAssignmentSubmissions(student).length}</Text>
                    <Text style={isActive ? styles.cellGood : styles.cellWarn}>
                      {statusLabel(student)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
          <Footer title={courseName} />
        </Page>
      ))}
    </Document>
  );
}
