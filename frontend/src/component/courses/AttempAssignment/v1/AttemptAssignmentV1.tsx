"use client";

import React, { useEffect, useState } from "react";
import { getAssignmentById } from "@/api/courses/assignment/get-assignment-by-id";
import { submitAssignment } from "@/api/courses/assignment/submit-assignment";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useParams, useRouter } from "next/navigation";

type AnswerMap = {
  [questionId: string]: string[];
};

function AttemptAssignmentV1({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const params = useParams();
  const Colors = getColors();

  const [assignment, setAssignment] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);

  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [submissionReport, setSubmissionReport] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0); // ⏱ 10 minutes

  /* -------------------- LOAD ASSIGNMENT -------------------- */
  useEffect(() => {
    async function load() {
      const res = await getAssignmentById(assignmentId, null);
      const payload = res?.data ?? res ?? null;
      setAssignment(payload);
      setCurrentIndex(0);
    }
    load();
  }, [assignmentId]);

  /* -------------------- TIMER -------------------- */
  useEffect(() => {
    if (showReviewScreen) return;

    // if (timeLeft <= 0) {
    //   handleFinalSubmit();
    //   return;
    // }

    const interval = setInterval(() => {
      setTimeLeft((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, showReviewScreen]);

  /* -------------------- QUESTIONS -------------------- */
  const questions =
    assignment?.questions ??
    assignment?.courseAssignemntQuestions ??
    assignment?.courseAssignmentQuestions ??
    [];

  const currentQuestion = questions[currentIndex];

  if (!assignment) return <div className="p-6">Loading assignment...</div>;
  if (questions.length === 0)
    return <div className="p-6">No questions found.</div>;

  /* -------------------- HELPERS -------------------- */
  function handleOptionSelect(option: string) {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: [option], // MCQ
    }));
    console.log(answers);
  }

  function toggleReview(questionId: string) {
    setMarkedForReview((prev) => {
      const set = new Set(prev);
      set.has(questionId) ? set.delete(questionId) : set.add(questionId);
      return set;
    });
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  /* -------------------- SUBMIT -------------------- */
  async function handleFinalSubmit() {
    const payload = questions
      .filter((q: any) => answers[q.id])
      .map((q: any) => ({
        question_id: q.id,
        answer: answers[q.id],
      }));
    console.log(payload);

    if (payload.length === 0) {
      alert("No answers selected");
      return;
    }

    setLoading(true);

    try {
      const res = await submitAssignment(assignmentId, payload);
      const report = res?.data?.report ?? res?.report ?? null;
      setSubmissionReport(report);
      setShowReviewScreen(false);
    } catch (error: any) {
      const report =
        error?.response?.data?.data?.report ??
        error?.response?.data?.report ??
        null;

      if (report) {
        setSubmissionReport(report);
        setShowReviewScreen(false);
      }
    } finally {
      setLoading(false);
    }
  }

  if (submissionReport) {
    return (
      <div className={`p-8 max-w-2xl mx-auto ${Colors.text.primary}`}>
        <h2 className={`text-2xl font-semibold mb-6 ${Colors.text.special}`}>
          Assignment Report
        </h2>

        <div className={`${Colors.background.primary} rounded-lg p-6 space-y-3`}>
          <div className="flex justify-between text-sm">
            <span>Assignment</span>
            <span className="font-medium">{submissionReport.assignmentName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Questions</span>
            <span className="font-medium">{submissionReport.totalQuestions ?? 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Answered Questions</span>
            <span className="font-medium">{submissionReport.answeredQuestions ?? 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Correct Answers</span>
            <span className="font-medium">{submissionReport.correctAnswers ?? 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Marks</span>
            <span className="font-medium">
              {submissionReport.obtainedMarks ?? 0} / {submissionReport.totalMarks ?? 0}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Percentage</span>
            <span className="font-medium">{submissionReport.percentage ?? 0}%</span>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => router.push(`/courses/${params.id}`)}
            className={`px-4 py-2 rounded ${Colors.background.special} ${Colors.text.primary}`}
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  /* -------------------- REVIEW SCREEN -------------------- */
  if (showReviewScreen) {
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const reviewCount = markedForReview.size;
    const unansweredCount = totalQuestions - answeredCount;

    return (
      <div className={`p-8 max-w-xl mx-auto `}>
        <h2 className={`text-xl ${Colors.text.special} font-semibold mb-6`}>
          Review Before Final Submit
        </h2>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span>Total Questions</span>
            <span className="font-medium">{totalQuestions}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-green-700">Answered</span>
            <span className="font-medium text-green-700">{answeredCount}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-red-600">Unanswered</span>
            <span className="font-medium text-red-600">{unansweredCount}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-yellow-600">Marked for Review</span>
            <span className="font-medium text-yellow-600">{reviewCount}</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className={`flex justify-end gap-4 mt-6 ${Colors.text.special}`}>
          <button
            onClick={() => setShowReviewScreen(false)}
            className="px-4 py-2 border rounded"
          >
            Back to Assignment
          </button>

          <button
            onClick={handleFinalSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {loading ? "Submitting..." : "Confirm Submit"}
          </button>
        </div>
      </div>
    );
  }

  /* -------------------- MAIN UI -------------------- */
  return (
    <div className={`flex h-screen ${Colors.background.secondary}`}>
      {/* SIDEBAR */}
      <div
        className={`w-64 ${Colors.background.primary} border-r p-4 overflow-y-auto`}
      >
        <h3 className={`font-semibold mb-4 ${Colors.text.primary}`}>
          Questions
        </h3>

        <div className="space-y-2">
          {questions.map((q: any, idx: number) => {
            const answered = !!answers[q.id];
            const review = markedForReview.has(q.id);

            return (
              <div
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex justify-between px-3 py-2 rounded cursor-pointer
                  ${
                    idx === currentIndex
                      ? `${Colors.background.primary} ${Colors.text.primary}`
                      : `${Colors.hover.textSpecial} ${Colors.text.primary}`
                  }`}
              >
                <span>Q{idx + 1}</span>
                <div className="flex gap-1">
                  {answered && <span className="text-green-600">✔</span>}
                  {review && <span className="text-yellow-500">★</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-8">
        <div className="flex justify-between mb-4">
          <h2 className={`text-xl ${Colors.text.secondary} font-semibold`}>
            {assignment.name}
          </h2>
          <span className="font-mono text-red-600">
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>

        <div className={`${Colors.background.primary} rounded shadow p-6`}>
          <div className={`flex justify-between ${Colors.text.primary} mb-3`}>
            <h4>
              Question {currentIndex + 1} of {questions.length}
            </h4>
            <button
              onClick={() => toggleReview(currentQuestion.id)}
              className="text-yellow-600 text-sm"
            >
              {markedForReview.has(currentQuestion.id)
                ? "Unmark Review"
                : "Mark for Review"}
            </button>
          </div>

          <p className={`mb-4 ${Colors.text.secondary}`}>
            {currentQuestion.question}
          </p>

          <div className="space-y-3">
            {(Array.isArray(currentQuestion.options)
              ? currentQuestion.options
              : []
            ).map((opt: string) => {
              const selected = answers[currentQuestion.id]?.includes(opt);

              return (
                <div
                  key={opt}
                  onClick={() => handleOptionSelect(opt)}
                  className={`p-3 border rounded cursor-pointer ${Colors.background.secondary}
                              ${Colors.text.primary}
                    ${
                      selected
                        ? `${Colors.background.heroSecondaryFaded} ${Colors.border.defaultThick}`
                        : `${Colors.hover.textSpecial}`
                    }`}
                >
                  {opt}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-6">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
              className={`px-4 py-2 border rounded disabled:opacity-50 ${Colors.text.special}`}
            >
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                disabled={!answers[currentQuestion.id]}
                className={`px-4 py-2 ${Colors.text.special} rounded disabled:opacity-50`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => setShowReviewScreen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Review & Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttemptAssignmentV1;


