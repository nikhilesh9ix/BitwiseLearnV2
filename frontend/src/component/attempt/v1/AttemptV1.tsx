"use client";

import { useEffect, useRef, useState } from "react";
import LeftSection from "./LeftSection";
import RightSection from "./RightSection";
import { useRouter } from "next/navigation";
import { useColors } from "@/component/general/(Color Manager)/useColors";
import toast from "react-hot-toast";
import { Wifi } from "lucide-react";

import { getAssessmentById } from "@/api/assessments/get-assessment-by-id";
import { getAssessmentSections } from "@/api/assessments/get-all-sections";
import { getSectionQuestions } from "@/api/assessments/get-section-questions";
import { getProblemData } from "@/api/problems/get-individual-problem";

import ConfirmSubmit from "./ConfirmSubmit";
import ConfirmExit from "./ConfirmExit";

import { useFullscreenEnforcer } from "./Proctoring/FullScreenEnforcer";
import { useTabSwitchCounter } from "./Proctoring/TabSwitchCounter";
import { useAntiCheatControls } from "./Proctoring/AntiCheat";
import { AttemptMode } from "./types";
import CodeRightSection from "./CodeRightSection";
import {
  submitIndividualQuestion,
  submitTest,
} from "@/api/assessments/submit-assessment";

type NetworkInfo = {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
};

export default function AttemptV1({
  id,
  mode,
}: {
  id: string;
  mode: AttemptMode;
}) {
  const Colors = useColors();
  const router = useRouter();

  function normalizeAssessmentData(raw: any) {
    const rawSections = Array.isArray(raw?.sections) ? raw.sections : [];

    return {
      id: raw?.id,
      name: raw?.name,
      instructions: raw?.instruction,
      sections: rawSections.map((section: any) => ({
        id: section.id,
        name: section.name,
        type: section.assessmentType ?? section.assessment_type ?? section.type,
        questions: (Array.isArray(section.questions) ? section.questions : []).map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options ?? [],
          problemId: q.problemId ?? null,
          maxMarks: q.maxMarks,
        })),
      })),
    };
  }

  const [started, setStarted] = useState(false);
  const [attemptData, setAttemptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [codingProblem, setCodingProblem] = useState<any>(null);

  const [userAnswers, setUserAnswers] = useState<Record<string, string | null>>(
    {},
  );
  const [codeAnswers, setCodeAnswers] = useState<Record<string, string>>({});

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [submissionReport, setSubmissionReport] = useState<any>(null);
  const intentionalExitRef = useRef(false);
  const [autoSubmit, setAutoSubmit] = useState(false);

  const attemptConfig = {
    label: "Assessment",
    startText: "Start Assessment",
    autoSubmitText: "Assessment auto-submitted.",
    redirectPath: "/assessments",
  };

  // Network Logic
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">(
    navigator.onLine ? "online" : "offline",
  );

  // Network Info
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({});
  useEffect(() => {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!connection) return;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        downlink: connection.downlink,
        effectiveType: connection.effectiveType,
        rtt: connection.rtt,
      });
    };

    updateNetworkInfo();
    connection.addEventListener("change", updateNetworkInfo);

    return () => {
      connection.removeEventListener("change", updateNetworkInfo);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setNetworkStatus("online");
    const handleOffline = () => setNetworkStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function getConnectionQuality(downlink?: number) {
    if (!downlink) {
      return {
        label: "Unknown",
        color: "#9ca3af",
        description: "Unable to estimate connection quality",
      };
    }

    if (downlink >= 5) {
      return {
        label: "Stable",
        color: "#22c55e",
        description: "Connection is stable for assessments",
      };
    }

    if (downlink >= 2) {
      return {
        label: "Average",
        color: "#f59e0b",
        description: "Connection may be unstable at times",
      };
    }

    return {
      label: "Poor",
      color: "#ef4444",
      description: "Connection may interrupt the assessment",
    };
  }

  const connectionQuality = getConnectionQuality(networkInfo.downlink);

  useEffect(() => {
    if (networkStatus === "offline") {
      toast.error("Network disconnected. Your answers will be saved locally.", {
        id: "network-offline",
      });
    }
  }, [networkStatus]);

  // Fetch assessment
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getAssessmentById(id);
        const assessmentData = res?.data;
        if (!assessmentData?.id) {
          throw new Error("Assessment not found");
        }

        const sections = await getAssessmentSections(id);
        const sectionsWithQuestions = await Promise.all(
          (Array.isArray(sections) ? sections : []).map(async (section: any) => {
            const questions = await getSectionQuestions(section.id);
            return {
              ...section,
              questions: Array.isArray(questions) ? questions : [],
            };
          }),
        );

        setAttemptData(
          normalizeAssessmentData({
            ...assessmentData,
            sections: sectionsWithQuestions,
          }),
        );
        setAutoSubmit(Boolean(assessmentData.autoSubmit));
      } catch {
        toast.error("Assessment not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const assessment = attemptData;

  // Proctoring
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const { enterFullscreen } = useFullscreenEnforcer(() => {
    if (intentionalExitRef.current) return;
    toast.error(attemptConfig.autoSubmitText);
    submitTest(id, { tabSwitchCount: tabSwitchCount }).then(() => {
      router.push("/assessments");
    });
  });

  const isProctoringEnabled = started && autoSubmit;

  const tabSwitchCount = useTabSwitchCounter(isProctoringEnabled);
useEffect(() => {
  if (!autoSubmit) return;

  if (tabSwitchCount >= 3) {
    toast.error("Too many tab switches. Auto-submitting...");
    
    submitTest(id, { tabSwitchCount }).then(() => {
      router.push(attemptConfig.redirectPath);
    });
  }
}, [tabSwitchCount, autoSubmit]);


  useAntiCheatControls(started);

  // Load coding problem
  useEffect(() => {
    if (!assessment) return;

    const section = assessment.sections[currentSectionIndex];
    const question = section.questions[currentQuestionIndex];

    if (section.type !== "CODE") return;
    if (!question?.problemId) return;

    getProblemData(setCodingProblem, question.problemId);
  }, [assessment, currentSectionIndex, currentQuestionIndex]);

  if (!started) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 font-mono">
        <div
          className={`w-full max-w-md rounded-2xl p-8 ${Colors.background.secondary}`}
        >
          <h1
            className={`text-2xl font-bold text-center ${Colors.text.special}`}
          >
            {attemptConfig.label} Instructions
          </h1>
          <p className="text-center mt-4">
            Requires <b>fullscreen mode</b>
          </p>
          <button
            className={`${Colors.background.heroSecondary} mt-6 py-3 rounded-xl w-full`}
            onClick={async () => {
              await enterFullscreen();
              setStarted(true);
            }}
          >
            {attemptConfig.startText}
          </button>
        </div>
      </div>
    );
  }

  if (loading || !assessment) return <div>Loading...</div>;

  const section = assessment.sections[currentSectionIndex];
  const questions = section.questions;
  const question = questions[currentQuestionIndex];

  const goNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      return;
    }
    if (currentSectionIndex < assessment.sections.length - 1) {
      setCurrentSectionIndex((s) => s + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
      return;
    }
    if (currentSectionIndex > 0) {
      const prev = assessment.sections[currentSectionIndex - 1];
      setCurrentSectionIndex((s) => s - 1);
      setCurrentQuestionIndex(prev.questions.length - 1);
    }
  };

  const goToSection = (index: number) => {
    setCurrentSectionIndex(index);
    setCurrentQuestionIndex(0);
  };

  const handleSubmitQuestion = async (id: string, data: any) => {
    await submitIndividualQuestion(id, { option: data }, "NO_CODE");
  };
  const handleCodeQuestion = async (
    id: string,
    data: any,
    language: string,
  ) => {
    await submitIndividualQuestion(id, { code: data, language }, "CODE");
  };
  async function submitAssessmentCode(language: string, code: string) {
    await handleCodeQuestion(question.id, code, language);
  }
  const handleSubmitTest = async () => {
    const res = await submitTest(id, { tabSwitchCount });
    const report = res?.data?.report ?? res?.report ?? null;
    setSubmissionReport(report);
    setShowSubmitConfirm(false);
  };

  if (submissionReport) {
    return (
      <div className={`${Colors.background.primary} min-h-screen p-8`}>
        <div className="max-w-2xl mx-auto">
          <h2 className={`text-2xl font-semibold mb-6 ${Colors.text.special}`}>
            Assessment Report
          </h2>

          <div className={`${Colors.background.secondary} rounded-lg p-6 space-y-3`}>
            <div className="flex justify-between text-sm">
              <span className={Colors.text.secondary}>Assessment</span>
              <span className={`font-medium ${Colors.text.primary}`}>
                {submissionReport.assessmentName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={Colors.text.secondary}>Total Questions</span>
              <span className={`font-medium ${Colors.text.primary}`}>
                {submissionReport.totalQuestions ?? 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={Colors.text.secondary}>Marks</span>
              <span className={`font-medium ${Colors.text.primary}`}>
                {submissionReport.obtainedMarks ?? 0} / {submissionReport.totalMarks ?? 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={Colors.text.secondary}>Percentage</span>
              <span className={`font-medium ${Colors.text.primary}`}>
                {submissionReport.percentage ?? 0}%
              </span>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => router.push("/assessments")}
              className={`px-4 py-2 rounded ${Colors.background.special} ${Colors.text.primary}`}
            >
              Back to Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${Colors.background.primary} h-screen flex flex-col`}>
      {/* TOP BAR */}
      <div className="flex gap-3 justify-end items-center px-4 py-3 border-b border-white/10">
        <div className="relative group flex items-center justify-center">
          {/* WiFi Icon */}
          <Wifi
            className="h-6 w-6 cursor-pointer"
            style={{
              color: networkStatus === "online" ? "#22c55e" : "#ef4444",
            }}
          />

          {/* Tooltip */}
          <div className="pointer-events-none absolute top-full mt-2 hidden group-hover:block z-50">
            <div className="rounded-md bg-black px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap">
              {networkStatus === "offline" ? (
                <div className="text-red-400">Network disconnected</div>
              ) : (
                <>
                  <div
                    className="font-semibold"
                    style={{ color: connectionQuality.color }}
                  >
                    Connection: {connectionQuality.label}
                  </div>

                  <div className="opacity-80 mt-1">
                    Estimated bandwidth: ~
                    {networkInfo.downlink?.toFixed(1) ?? "–"} Mbps
                  </div>

                  <div className="opacity-70">
                    {connectionQuality.description}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSubmitConfirm(true)}
          className={`${Colors.background.secondary} ${Colors.text.primary} px-4 py-2 rounded-md hover:opacity-90 font-mono`}
        >
          Submit
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 min-h-0">
        {/* LEFT */}
        <div className="h-full min-h-0">
          <LeftSection
            sectionName={section.type === "NO_CODE" ? "MCQ" : "CODING"}
            sectionIndex={currentSectionIndex}
            totalSections={assessment.sections.length}
            question={
              section.type === "NO_CODE"
                ? question.question
                : codingProblem?.description || "Loading problem..."
            }
            testCases={
              section.type === "CODE" ? (codingProblem?.testCases ?? []) : []
            }
            currentIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            onNext={goNext}
            onPrevious={goPrev}
            sections={assessment.sections}
            onSectionSelect={goToSection}
          />
        </div>

        {/* RIGHT */}
        <div className="h-full min-h-0">
          {section.type === "NO_CODE" && (
            <RightSection
              assignmentName={assessment.name}
              choices={question.options}
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              selectedAnswer={userAnswers[question.id] ?? null}
              onSelectAnswer={(a) => {
                handleSubmitQuestion(question.id, a);
                setUserAnswers((p) => ({ ...p, [question.id]: a }));
              }}
              onResetCurrentAnswer={() =>
                setUserAnswers((p) => ({ ...p, [question.id]: null }))
              }
              onJumpToQuestion={setCurrentQuestionIndex}
              onExit={() => setShowExitConfirm(true)}
              onSubmit={() => setShowSubmitConfirm(true)}
              questionIds={questions.map((q: any) => q.id)}
              userAnswers={userAnswers}
            />
          )}
          {section.type === "CODE" && (
            <CodeRightSection
              problem={codingProblem}
              problemId={question.problemId}
              code={codeAnswers[question.id] ?? ""}
              onChange={(code) => {
                setCodeAnswers((p) => ({ ...p, [question.id]: code }));
              }}
              onRun={() => {}}
              //@ts-ignore
              onSubmit={(language: string, code: string) =>
                submitAssessmentCode(language, code)
              }
            />
          )}
        </div>
      </div>

      <ConfirmSubmit
        open={showSubmitConfirm}
        onCancel={() => setShowSubmitConfirm(false)}
        onConfirm={handleSubmitTest}
      />

      <ConfirmExit
        open={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => router.push("/assessments")}
      />
    </div>
  );
}
