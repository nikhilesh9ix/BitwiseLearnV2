import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type {
  AssessmentReportStudent,
  AssessmentReportSummary,
} from "@/api/reports/get-assessment-report";

export type AssessmentReportStats = {
  totalParticipants: number;
  submittedCount: number;
  averageScore: number;
  flaggedCount: number;
  honestCount: number;
  totalTabSwitches: number;
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
    color: "#2563eb",
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#475569",
    marginBottom: 32,
  },
  coverMeta: {
    fontSize: 11,
    color: "#475569",
    marginBottom: 6,
  },
  generatedOn: {
    marginTop: 40,
    fontSize: 9,
    color: "#64748b",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
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
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10,
  },
  statLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 19,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
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
  cellStatusGood: {
    flex: 1,
    fontSize: 8,
    color: "#15803d",
  },
  cellStatusWarn: {
    flex: 1,
    fontSize: 8,
    color: "#b45309",
  },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 20,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    fontSize: 8,
    color: "#64748b",
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 36,
    fontSize: 8,
    color: "#64748b",
  },
  muted: {
    color: "#64748b",
  },
  noteBox: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 6,
    padding: 10,
    marginTop: 12,
  },
  noteText: {
    fontSize: 9,
    color: "#9a3412",
  },
});

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "Not submitted";
  }

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (status?: string | null) => {
  const normalizedStatus = status ?? "UNKNOWN";

  if (normalizedStatus === "NOT_CHEATED") {
    return "Honest";
  }

  if (normalizedStatus === "CHEATED") {
    return "Flagged";
  }

  return normalizedStatus.replaceAll("_", " ");
};

const chunkRows = <T,>(rows: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
};

const Footer = ({ title }: { title: string }) => (
  <>
    <Text style={styles.footer}>Bitwise Learn | {title} | Assessment Report</Text>
    <Text
      style={styles.pageNumber}
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      fixed
    />
  </>
);

export function AssessmentReportPDF({
  assessment,
  students,
  stats,
}: {
  assessment: AssessmentReportSummary;
  students: AssessmentReportStudent[];
  stats: AssessmentReportStats;
}) {
  const rankedStudents = [...students]
    .filter((student) => student.isSubmitted)
    .sort((left, right) => right.totalMarks - left.totalMarks);
  const topStudents = rankedStudents.slice(0, 5);
  const flaggedStudents = students.filter(
    (student) => student.proctoringStatus !== "NOT_CHEATED",
  );
  const tablePages = chunkRows(students, 18);

  return (
    <Document
      title={`${assessment.name} Assessment Report`}
      author="Bitwise Learn"
      subject="Assessment analytics report"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.brand}>Bitwise Learn</Text>
          <Text style={styles.title}>{assessment.name}</Text>
          <Text style={styles.subtitle}>Assessment Performance Report</Text>
          <Text style={styles.coverMeta}>Window: {formatDate(assessment.startTime)} to {formatDate(assessment.endTime)}</Text>
          <Text style={styles.coverMeta}>Participants: {stats.totalParticipants}</Text>
          <Text style={styles.coverMeta}>Submitted: {stats.submittedCount}</Text>
          <Text style={styles.coverMeta}>Status: {assessment.status}</Text>
          <Text style={styles.generatedOn}>
            Generated on {formatDate(new Date().toISOString())}
          </Text>
        </View>
        <Footer title={assessment.name} />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Participants</Text>
              <Text style={styles.statValue}>{stats.totalParticipants}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Submitted</Text>
              <Text style={styles.statValue}>{stats.submittedCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Average Score</Text>
              <Text style={styles.statValue}>{stats.averageScore}</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Honest</Text>
              <Text style={styles.statValue}>{stats.honestCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Flagged</Text>
              <Text style={styles.statValue}>{stats.flaggedCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tab Switches</Text>
              <Text style={styles.statValue}>{stats.totalTabSwitches}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Snapshot</Text>
          <Text>Description: {assessment.description || "No description provided."}</Text>
          <Text style={styles.muted}>
            Section time limit:{" "}
            {assessment.individualSectionTimeLimit
              ? `${assessment.individualSectionTimeLimit} minutes`
              : "Not configured"}
          </Text>
        </View>

        {topStudents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.cell}>Rank</Text>
                <Text style={styles.cellWide}>Student</Text>
                <Text style={styles.cell}>Roll No</Text>
                <Text style={styles.cell}>Score</Text>
                <Text style={styles.cell}>Status</Text>
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
                    <Text style={styles.cellWide}>{student.studentName}</Text>
                    <Text style={styles.cell}>{student.studentRollNumber || "N/A"}</Text>
                    <Text style={styles.cell}>{student.totalMarks}</Text>
                    <Text
                      style={
                        student.proctoringStatus === "NOT_CHEATED"
                          ? styles.cellStatusGood
                          : styles.cellStatusWarn
                      }
                    >
                      {statusLabel(student.proctoringStatus)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <Footer title={assessment.name} />
      </Page>

      {tablePages.map((pageRows, pageIndex) => (
        <Page key={`students-${pageIndex}`} size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Student Submission Summary {tablePages.length > 1 ? `(${pageIndex + 1}/${tablePages.length})` : ""}
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.cellWide}>Student</Text>
                <Text style={styles.cell}>Roll No</Text>
                <Text style={styles.cell}>Score</Text>
                <Text style={styles.cell}>Tabs</Text>
                <Text style={styles.cell}>Submitted</Text>
                <Text style={styles.cell}>Status</Text>
              </View>
              {pageRows.map((student, rowIndex) => {
                const rowStyle =
                  rowIndex === pageRows.length - 1
                    ? styles.tableRowLast
                    : rowIndex % 2 === 0
                      ? styles.tableRow
                      : [styles.tableRow, styles.tableRowAlt];

                return (
                  <View key={student.id} style={rowStyle}>
                    <Text style={styles.cellWide}>{student.studentName}</Text>
                    <Text style={styles.cell}>{student.studentRollNumber || "N/A"}</Text>
                    <Text style={styles.cell}>{student.totalMarks}</Text>
                    <Text style={styles.cell}>{student.tabSwitchCount}</Text>
                    <Text style={styles.cell}>
                      {student.isSubmitted ? "Yes" : "No"}
                    </Text>
                    <Text
                      style={
                        student.proctoringStatus === "NOT_CHEATED"
                          ? styles.cellStatusGood
                          : styles.cellStatusWarn
                      }
                    >
                      {statusLabel(student.proctoringStatus)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
          <Footer title={assessment.name} />
        </Page>
      ))}

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integrity Review</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.cellWide}>Student</Text>
              <Text style={styles.cell}>Status</Text>
              <Text style={styles.cell}>Tabs</Text>
              <Text style={styles.cellWide}>Submitted At</Text>
            </View>
            {(flaggedStudents.length > 0 ? flaggedStudents : students.slice(0, 10)).map(
              (student, index, collection) => {
                const rowStyle =
                  index === collection.length - 1
                    ? styles.tableRowLast
                    : index % 2 === 0
                      ? styles.tableRow
                      : [styles.tableRow, styles.tableRowAlt];

                return (
                  <View key={student.id} style={rowStyle}>
                    <Text style={styles.cellWide}>{student.studentName}</Text>
                    <Text
                      style={
                        student.proctoringStatus === "NOT_CHEATED"
                          ? styles.cellStatusGood
                          : styles.cellStatusWarn
                      }
                    >
                      {statusLabel(student.proctoringStatus)}
                    </Text>
                    <Text style={styles.cell}>{student.tabSwitchCount}</Text>
                    <Text style={styles.cellWide}>
                      {formatDateTime(student.submittedAt)}
                    </Text>
                  </View>
                );
              },
            )}
          </View>

          {flaggedStudents.length > 0 ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                {flaggedStudents.length} participant
                {flaggedStudents.length === 1 ? "" : "s"} were marked with a
                non-clean proctoring status and should be reviewed manually.
              </Text>
            </View>
          ) : (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                No suspicious proctoring activity was recorded for this
                assessment.
              </Text>
            </View>
          )}
        </View>
        <Footer title={assessment.name} />
      </Page>
    </Document>
  );
}
