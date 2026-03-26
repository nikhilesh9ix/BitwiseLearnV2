"use client";

// imports -----------------------------------------------------------------
import { useEffect, useState } from "react";
import { Search, Clock } from "lucide-react";
import { motion } from "framer-motion";
import {
  getAllAssessments,
  getAllStudentAssessment,
} from "@/api/assessments/get-all-assessments";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// colors ------------------------------------------------------------------
import { useColors } from "@/component/general/(Color Manager)/useColors";
import { useStudent } from "@/store/studentStore";
import { getAssessmentsByBatch } from "@/api/assessments/get-assessments-by-batch";
const Colors = useColors();

// types -------------------------------------------------------------------
type StudentAssessment = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  startTime: string;
  endTime: string;
  individualSectionTimeLimit?: number;
  status?: "UPCOMING" | "LIVE" | "ENDED";
  batchId: string;
  canAccessTest: boolean;
};

// -------------------------------------------------------------------------
// Assessment Card
// -------------------------------------------------------------------------
const AssessmentCard = ({
  assessment,
  onAttempt,
}: {
  assessment: StudentAssessment;
  onAttempt: (assessment: StudentAssessment) => void;
}) => {
  const statusStyles =
    "bg-green-500/10 text-green-400 border border-green-500/30";
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className={`
        rounded-2xl p-5 flex flex-col gap-4
        ${Colors.background.secondary}
        ${Colors.border.defaultThick}
        shadow-lg shadow-black/30
        hover:border-[#64ACFF]/40
        transition
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={`text-lg font-semibold ${Colors.text.primary} leading-tight`}
        >
          {assessment.name}
        </h3>

        {assessment.status && (
          <span className={`text-xs px-3 py-1 rounded-full ${statusStyles}`}>
            {assessment.status}
          </span>
        )}
      </div>

      <p className={`text-sm leading-relaxed ${Colors.text.secondary}`}>
        {assessment.description}
      </p>

      <div
        className={`flex items-center gap-2 text-xs ${Colors.text.secondary}`}
      >
        <Clock className={`${Colors.text.special}`} size={14} />
        <span>
          {new Date(assessment.startTime).toLocaleString()} —{" "}
          {new Date(assessment.endTime).toLocaleString()}
        </span>
      </div>

      <button
        disabled={!assessment.canAccessTest}
        onClick={() => onAttempt(assessment)}
        className={`
          mt-auto w-full rounded-lg py-2.5 text-sm font-semibold
          ${Colors.background.special}
          ${Colors.text.primary}
          ${Colors.hover.special}
          ${assessment.canAccessTest ? "cursor-pointer" : "cursor-not-allowed"}
          hover:shadow-md hover:shadow-primary-hero/30
          transition
        `}
      >
        Attempt Assessment
      </button>
    </motion.div>
  );
};

// -------------------------------------------------------------------------
// Instructions Modal
// -------------------------------------------------------------------------
const InstructionsModal = ({
  assessment,
  onClose,
  onStart,
}: {
  assessment: StudentAssessment;
  onClose: () => void;
  onStart: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`
          w-full max-w-lg rounded-2xl p-6
            ${Colors.background.secondary}
            ${Colors.border.defaultThick}
          shadow-xl shadow-black/40
        `}
      >
        <h2 className={`text-xl font-semibold ${Colors.text.primary}`}>
          {assessment.name}
        </h2>

        <p className={`mt-2 text-sm ${Colors.text.secondary}`}>
          {assessment.description}
        </p>

        <div className="mt-4 max-h-60 overflow-y-auto pr-2">
          <h4 className={`text-sm font-semibold ${Colors.text.primary} mb-2`}>
            Instructions
          </h4>

          <p className={`text-sm ${Colors.text.secondary} whitespace-pre-line`}>
            {assessment.instructions?.trim()
              ? assessment.instructions
              : "No instructions provided for this assessment."}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`rounded-md px-4 py-2 text-sm ${Colors.text.special} ${Colors.hover.textSpecial} hover:underline transition cursor-pointer`}
          >
            Cancel
          </button>

          <button
            onClick={onStart}
            className={`
              rounded-md px-4 py-2 text-sm font-semibold
                ${Colors.background.special}
                ${Colors.text.primary}
                ${Colors.hover.special}
              hover:opacity-90 transition
              cursor-pointer`}
          >
            Start Assessment
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// -------------------------------------------------------------------------
// Skeleton Card
// -------------------------------------------------------------------------
const AssessmentSkeleton = () => (
  <div
    className={`
      rounded-2xl p-5 flex flex-col gap-4
      ${Colors.background.secondary}
      border border-white/10
      animate-pulse
    `}
  >
    <div className="flex justify-between gap-4">
      <div className={`h-5 w-2/3 rounded ${Colors.background.primary}`} />
      <div className={`h-5 w-16 rounded ${Colors.background.primary}`} />
    </div>

    <div className={`h-4 w-full rounded ${Colors.background.primary}`} />
    <div className={`h-4 w-5/6 rounded ${Colors.background.primary}`} />

    <div className={`h-3 w-3/4 rounded ${Colors.background.primary}`} />

    <div
      className={`h-9 w-full rounded ${Colors.background.primary} mt-auto`}
    />
  </div>
);

// -------------------------------------------------------------------------
// Main Component
// -------------------------------------------------------------------------
const StudentAssesmentv1 = () => {
  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedAssessment, setSelectedAssessment] =
    useState<StudentAssessment | null>(null);

  const { info: studentInfo } = useStudent();
  const studentData =
    (studentInfo as { data?: { batch?: { id?: string } }; batch?: { id?: string } } | null)
      ?.data ??
    (studentInfo as { batch?: { id?: string } } | null);
  const studentBatchId = studentData?.batch?.id;

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      let normalizedData: any[] = [];
      if (!studentBatchId) return;
      await getAssessmentsByBatch((data: any) => {
        normalizedData = data;
      }, studentBatchId as any);

      //@ts-ignore
      normalizedData = normalizedData.map((a: any) => ({
        ...a,
        instructions: a.instruction,
      }));

      setAssessments(normalizedData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [studentBatchId]);

  const liveAssessments = assessments.filter(
    (assessment) => assessment.status === "LIVE",
  );

  const filteredAssessments = liveAssessments.filter((assessment) => {
    if (!searchText.trim()) return true;

    const query = searchText.toLowerCase();

    return (
      assessment.name.toLowerCase().includes(query) ||
      assessment.description.toLowerCase().includes(query)
    );
  });

  const router = useRouter();

  return (
    <section className="flex w-full flex-col gap-8 p-6">
      {/* Search */}
      <div className="flex flex-col gap-2 max-w-md">
        <div className="relative w-full">
          <Search
            size={18}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${Colors.text.special}`}
          />
          <input
            type="text"
            placeholder="Search live assessments..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`
              w-full rounded-lg pl-10 pr-4 py-2.5 text-sm
              placeholder:text-neutral-500
              focus:border-[#64ACFF]/60
              focus:ring-1 focus:ring-[#64ACFF]/30
              transition
              ${Colors.background.secondary}
              ${Colors.text.primary}
                ${Colors.border.defaultThick}
              `}
          />
        </div>

        <h1
          className={`text-2xl font-bold ${Colors.text.primary} tracking-tight`}
        >
          Your Assessments
        </h1>
        {/* Helper text BELOW search */}
        <p className={`text-xs ${Colors.text.secondary} tracking-wide`}>
          View and attempt live assessments assigned to you
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <AssessmentSkeleton key={i} />
          ))
        ) : filteredAssessments.length > 0 ? (
          filteredAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onAttempt={setSelectedAssessment}
            />
          ))
        ) : (
          <p
            className={`col-span-full text-center text-sm ${Colors.text.secondary} py-12`}
          >
            No live assessments available right now.
          </p>
        )}
      </div>

      {selectedAssessment && (
        <InstructionsModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          onStart={() => {
            setSelectedAssessment(null);
            router.push(`/assessments/${selectedAssessment.id}`);
          }}
        />
      )}
    </section>
  );
};

export default StudentAssesmentv1;
