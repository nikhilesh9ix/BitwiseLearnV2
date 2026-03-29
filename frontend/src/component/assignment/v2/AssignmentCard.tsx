"use client";

import { Clock, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useColors } from "@/component/general/(Color Manager)/useColors";
import type { AssignmentCardData } from "./AssignmentV2";

const Colors = useColors();

export default function AssignmentCard({
  assignment,
}: {
  assignment: AssignmentCardData;
}) {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [open, setOpen] = useState(false);

  const statusStyles =
    assignment.status === "LIVE"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : assignment.status === "ENDED"
        ? "bg-red-500/15 text-red-400 border-red-500/30"
        : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={`
          rounded-xl p-4 flex flex-col gap-4
          ${Colors.background.secondary}
          ${Colors.border.fadedThick}
          hover:border-white/20 transition
        `}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className={`text-lg font-semibold ${Colors.text.primary}`}>
            {assignment.name}
          </h3>

          <span
            className={`text-xs px-3 py-1 rounded-full border ${statusStyles}`}
          >
            {assignment.status}
          </span>
        </div>

        <p className={`text-sm leading-relaxed ${Colors.text.secondary}`}>
          {assignment.description}
        </p>

        <div className="flex items-center justify-between text-xs text-secondary-font">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{assignment.durationInMinutes} mins</span>
          </div>

          <div className="flex items-center gap-1">
            <ClipboardList size={14} />
            <span>{assignment.totalMarks} marks</span>
          </div>
        </div>

        <button
          disabled={assignment.status === "UPCOMING" || assignment.isAttempted}
          onClick={() => setOpen(true)}
          className={`
    mt-auto w-full rounded-md py-2 text-sm font-medium
    ${Colors.background.special} ${Colors.text.primary}
    hover:opacity-90 transition
    disabled:opacity-50 disabled:cursor-not-allowed
  `}
        >
          {assignment.isAttempted
            ? "Assignment Attempted"
            : assignment.status === "ENDED"
              ? "View Assignment"
              : "Start Assignment"}
        </button>
      </motion.div>

      {/* ================= CONFIRM POPUP ================= */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl p-6 ${Colors.background.secondary}`}
            >
              <h2 className={`text-xl font-semibold ${Colors.text.primary}`}>
                Start Assignment?
              </h2>

              <p className={`mt-3 text-sm ${Colors.text.secondary}`}>
                This assignment will open in fullscreen mode. Make sure you’re
                ready before starting.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className={`
    px-4 py-2 rounded-md text-sm font-medium
    border border-white/15
    ${Colors.text.secondary}
    hover:bg-white/5 hover:border-white/30
    transition
  `}
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setOpen(false);
                    router.push(
                      `/courses/${courseId}/assignment/${assignment.id}/attempt`,
                    );
                  }}
                  className={`
    px-4 py-2 rounded-md text-sm font-medium
    ${Colors.background.special}
    ${Colors.text.primary}
    hover:opacity-90
    transition
  `}
                >
                  Start
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
