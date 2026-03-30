"use client";

import { getCourseById } from "@/api/courses/course/get-course-by-id";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  CheckLine,
  ChevronDown,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import ReactViewAdobe from "react-adobe-embed";
import View from "react-adobe-embed";
// import PdfViewer from "./PDFViewer";
import { markAsDone, markAsUnDone } from "@/api/courses/course/course-progress";
import MarkdownEditor from "@/component/ui/MarkDownEditor";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";
import AssignmentV2 from "@/component/assignment/v2/AssignmentV2";
import Assignment from "@/component/assignment/Assignment";
import { getCourseProgressById } from "@/api/courses/course/course-progress-by-id";
import createCertificate from "@/lib/certificate";
import { useStudent } from "@/store/studentStore";
import { getStudentAssignmentsBySection } from "@/api/courses/assignment/get-student-section-assignment";

/* ================= TYPES ================= */

type Topic = {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  transcript?: string;
  file?: string;
  isCompleted?: boolean;
};

type Assignment = {
  id: string;
  name: string;
  description: string;
  instruction: string;
  marksPerQuestion: number;
  courseAssignemntQuestions: any[];
};

type Section = {
  id: string;
  name: string;
  isOpen: boolean;
  courseLearningContents: Topic[];
  courseAssignemnts: Assignment[];
};

const Colors = getColors();

/* ================= COMPONENT ================= */

export default function CourseV2() {
  const params = useParams();
  const htmlRef = useRef(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(
    null,
  );
  const [courseName, setCourseName] = useState("");
  const { info } = useStudent();
  const [mode, setMode] = useState<"LEARNING" | "ASSIGNEMENT">("LEARNING");
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [studyMode, setStudyMode] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showPDF, setShowPDF] = useState(true);
  const [completedSection, setCompletedSection] = useState<{ id: string }[]>(
    [],
  );
  const [completedAssignment, setCompletedAssignment] =
    useState<Record<string, boolean>>();
  const [showSidebar, setShowSidebar] = useState(true);
  const [pdfMode, setPdfMode] = useState(false);

  const totalTopics = sections.reduce(
    (acc, sec) => acc + sec.courseLearningContents.length,
    0,
  );

  const completedCount = completedSection.length;

  const progressPercent =
    totalTopics === 0 ? 0 : Math.round((completedCount / totalTopics) * 100);

  const isResizing = useRef(false);

  /* ================= FETCH COURSE ================= */

  useEffect(() => {
    async function fetchData() {
      const res = await getCourseById(params.id as string);
      const payload = res?.data ?? {};
      const rawSections = Array.isArray(payload.courseSections)
        ? payload.courseSections
        : Array.isArray(payload.sections)
          ? payload.sections
          : [];

      const mappedSections = rawSections.map((sec: any) => ({
        ...sec,
        courseLearningContents: Array.isArray(sec.courseLearningContents)
          ? sec.courseLearningContents
          : Array.isArray(sec.contents)
            ? sec.contents.map((content: any) => ({
                ...content,
                videoUrl: content.videoUrl ?? content.video_url,
              }))
            : [],
        courseAssignemnts: Array.isArray(sec.courseAssignemnts)
          ? sec.courseAssignemnts
          : Array.isArray(sec.assignments)
            ? sec.assignments
            : [],
        isOpen: false,
      }));

      setSections(mappedSections);

      setCourseName(payload.name ?? "");
      // map each section and mark the content as done
      const firstTopic =
        mappedSections?.[0]?.courseLearningContents?.[0];
      if (firstTopic) setActiveTopic(firstTopic);
    }

    fetchData();
  }, [params.id]);

  /* ================= FETCH COURSE PROGRESS ================= */

  useEffect(() => {
    async function fetchProgress() {
      if (!params.id) return;

      const res = await getCourseProgressById(params.id as string);
      // console.log(res.data);
      const progress = res.data;
      // console.log(res);
      if (progress?.completedContentIds) {
        setCompletedSection(
          progress.completedContentIds.map((id: string) => ({ id })),
        );
      } else {
        setCompletedSection([]);
      }
    }

    fetchProgress();
  }, [params.id]);

  useEffect(() => {
    async function fetchAssignmentAttemptMap() {
      if (!sections.length) {
        setCompletedAssignment({});
        return;
      }

      const nextMap: Record<string, boolean> = {};

      await Promise.all(
        sections.map(async (section) => {
          const res = await getStudentAssignmentsBySection(section.id);
          const assignmentData = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : [];

          for (const assignment of assignmentData) {
            const assignmentId = assignment?.id;
            if (!assignmentId) continue;
            nextMap[assignmentId] = Boolean(
              assignment?.attempted ??
                assignment?.isAttempted ??
                assignment?.isSubmitted,
            );
          }
        }),
      );

      setCompletedAssignment(nextMap);
    }

    fetchAssignmentAttemptMap();
  }, [sections]);

  /* ================= SIDEBAR RESIZE ================= */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const next = e.clientX - 16;
      setSidebarWidth(Math.min(Math.max(next, 240), 520));
    };

    const stopResize = () => {
      isResizing.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
    };
  }, []);

  const startResize = () => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const toggleStudyMode = async () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      await document.documentElement.requestFullscreen();
      setStudyMode(true);
    } else {
      // Exit fullscreen
      await document.exitFullscreen();
      setStudyMode(false);
    }
  };
  useEffect(() => {
    const handleFullscreenChange = () => {
      setStudyMode(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const isActiveTopicCompleted = activeTopic
    ? completedSection.some((s) => s.id === activeTopic.id)
    : false;

  const handleMarkAsDone = async () => {
    if (!activeTopic) return;

    const isCompleted = completedSection.some((s) => s.id === activeTopic.id);

    if (isCompleted) {
      await markAsUnDone(activeTopic.id);

      setCompletedSection((prev) =>
        prev.filter((s) => s.id !== activeTopic.id),
      );
    } else {
      await markAsDone(activeTopic.id);

      setCompletedSection((prev) => [...prev, { id: activeTopic.id }]);
    }
  };

  /* ================= RENDER ================= */

  const allAssignments = sections.flatMap(
    (section) => section.courseAssignemnts || [],
  );

  return (
    <div className={`min-h-screen ${Colors.background.primary} p-4`}>
      <div
        ref={htmlRef}
        data-report-root
        className="hidden bg-neutral-900 text-white p-6 rounded-lg w-[210mm]"
      ></div>
      <motion.div className="flex gap-4 h-[calc(100vh-2rem)]">
        {/* ================= LEFT SIDEBAR ================= */}
        {!studyMode && showSidebar && (
          <aside
            style={{ width: sidebarWidth }}
            className={`relative ${Colors.background.secondary} rounded-lg shrink-0 overflow-hidden`}
          >
            <SectionNav
              sections={sections}
              mode={mode}
              generatingCertificate={generatingCertificate}
              onCertificate={() => {
                setGeneratingCertificate(true);
                createCertificate(
                  courseName,
                  info?.data.name as string,
                  htmlRef,
                );
                setGeneratingCertificate(false);
              }}
              setMode={setMode}
              completedSection={completedSection}
              totalTopics={totalTopics}
              onSelectTopic={(t: any) => {
                setActiveTopic(t);
                setActiveAssignment(null);
              }}
              onSelectAssignment={(a: any) => {
                setActiveAssignment(a);
                setActiveTopic(null);
              }}
              onToggleSection={(id: string) => {
                setSections((prev) =>
                  prev.map((sec) =>
                    sec.id === id ? { ...sec, isOpen: !sec.isOpen } : sec,
                  ),
                );
              }}
            />

            <button
              onClick={() => setShowSidebar(false)}
              className={`absolute -right-4 top-1/2 -translate-y-1/2 
              p-2 rounded-md shadow-md 
              ${Colors.background.primary} ${Colors.text.primary}
              hover:scale-105 transition cursor-pointer`}
            >
              <ChevronLeft />
            </button>

            <div
              onMouseDown={startResize}
              className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-500/40"
            />
          </aside>
        )}

        {!studyMode && !showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className={`absolute left-2 top-1/2 -translate-y-1/2 
              p-1 rounded-md shadow-lg z-50
              ${Colors.background.primary} ${Colors.text.primary}
              hover:scale-105 transition cursor-pointer`}
          >
            <ChevronRight />
          </button>
        )}

        {/* ================= RIGHT CONTENT ================= */}
        <div
          className={`flex-1 ${Colors.background.secondary} rounded-xl h-full flex flex-col`}
        >
          {/* HEADER */}
          <div
            className={`p-6 ${Colors.background.secondary} flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <h2 className={`${Colors.text.primary} text-lg font-semibold`}>
                {mode === "LEARNING"
                  ? activeTopic?.name
                  : activeAssignment?.name}
              </h2>
            </div>
            <div className=" flex gap-3 justify-end">
              {activeTopic?.file && (
                <button
                  onClick={() => setPdfMode((p) => !p)}
                  className={`px-3 py-2 
                  ${Colors.background.primary} ${Colors.text.primary} 
                  ${Colors.hover.special} rounded-lg cursor-pointer`}
                >
                  {pdfMode ? "Exit PDF Mode" : "PDF Mode"}
                </button>
              )}

              {
                <button
                  onClick={() => {
                    setStudyMode((p) => !p);
                    toggleStudyMode();
                  }}
                  className={`px-3 py-2 ${Colors.background.primary} ${Colors.text.primary} ${Colors.hover.special} cursor-pointer rounded-lg`}
                >
                  {studyMode ? "Exit Study Mode" : "Study Mode"}
                </button>
              }
              {activeTopic?.file && (
                <button
                  onClick={() => {
                    setShowPDF((p) => !p);
                  }}
                  className={`px-3 py-2 ${Colors.background.primary} ${Colors.text.primary} ${Colors.hover.special} cursor-pointer rounded-lg`}
                >
                  {showPDF ? "Video Mode" : "Exit Video Mode"}
                </button>
              )}
              <button
                onClick={handleMarkAsDone}
                className={`px-3 py-2 ${Colors.background.primary} ${Colors.text.primary} ${Colors.hover.special} cursor-pointer rounded-lg`}
              >
                {isActiveTopicCompleted ? "Mark as Undone" : "Mark as Done"}
              </button>
            </div>
          </div>

          {/* ================= CONTENT SWITCH ================= */}
          <div
            className="flex-1 p-6"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              //@ts-ignore
              WebkitScrollbar: { display: "none" },
            }}
          >
            {mode === "LEARNING" && activeTopic && (
              <LearningView
                topic={activeTopic}
                showPDF={showPDF}
                showTranscript={showTranscript}
                setShowPDF={setShowPDF}
                setShowTranscript={setShowTranscript}
                studyMode={studyMode}
                pdfMode={pdfMode}
              />
            )}

            {mode === "ASSIGNEMENT" &&
              !activeAssignment &&
              allAssignments.length === 0 && (
                <div
                  className={`w-full h-fit mt-36 flex flex-col items-center justify-center text-center gap-3 ${Colors.text.secondary}`}
                >
                  <div
                    className={`p-4 rounded-full ${Colors.background.primary}`}
                  >
                    <Book size={32} className={Colors.text.primary} />
                  </div>

                  <p className={`text-lg font-medium ${Colors.text.primary}`}>
                    No assignments yet
                  </p>

                  <p className={`text-sm ${Colors.text.secondary} max-w-xs`}>
                    You’ll see your assignments here once they’re added.
                  </p>
                </div>
              )}

            {mode === "ASSIGNEMENT" && (
              <Assignment
                assignments={
                  activeAssignment ? [activeAssignment] : allAssignments
                }
                map={completedAssignment as any}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================= LEARNING VIEW ================= */

function LearningView({ topic, showPDF, studyMode, pdfMode }: any) {
  const { theme } = useTheme();
  const markdownTheme: "light" | "dark" = theme === "Dark" ? "dark" : "light";

  return (
    <div className={`flex gap-6 ${pdfMode ? "h-full" : ""}`}>
      {!pdfMode && (
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          <div
            className={`aspect-video rounded-xl ${Colors.background.primary}`}
          >
            {topic.videoUrl && (
              <iframe
                src={topic.videoUrl}
                className={"mx-auto w-full h-full"}
                allowFullScreen
              />
            )}
          </div>

          {topic.transcript ? (
            <aside
              className={`w-full ${Colors.background.primary} p-4 rounded-xl flex-1 overflow-y-auto`}
            >
              <MarkdownEditor
                // height={550}
                value={topic.transcript}
                setValue={() => {}}
                mode={"preview"}
                hideToolbar={true}
                theme={markdownTheme}
              />
            </aside>
          ) : (
            <aside
              className={`w-full h-[25%] flex justify-center items-center pt-8 ${Colors.background.secondary} p-4 rounded-xl ${Colors.text.secondary}`}
            >
              No Transcripts yet
            </aside>
          )}
        </div>
      )}

      {topic.file && (showPDF || pdfMode) && (
        <iframe
          src={topic.file}
          className={
            pdfMode
              ? "w-full h-[90vh] rounded-xl"
              : "w-[40%] h-screen rounded-xl"
          }
        />
      )}
    </div>
  );
}

/*========= Course Progress Circle ============*/

function ProgressRing({ value }: { value: number }) {
  const radius = 26;
  const stroke = 5;
  const size = radius * 2;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          stroke="currentColor"
          className="opacity-20"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-300"
        />
      </svg>

      <span className="absolute text-xs font-semibold">{value}%</span>
    </div>
  );
}

/* ================= SIDEBAR ================= */

function SectionNav({
  sections,
  mode,
  setMode,
  onSelectTopic,
  onSelectAssignment,
  onToggleSection,
  completedSection,
  totalTopics,
  onCertificate,
  generatingCertificate,
}: {
  sections: Section[];
  generatingCertificate: boolean;
  mode: "LEARNING" | "ASSIGNEMENT";
  setMode: (m: "LEARNING" | "ASSIGNEMENT") => void;
  onCertificate: () => void;
  onSelectTopic: (t: Topic) => void;
  onSelectAssignment: (a: Assignment) => void;
  onToggleSection: (id: string) => void;
  completedSection: { id: string }[];
  totalTopics: number;
}) {
  const completedCount = completedSection.length;
  const progressPercent =
    totalTopics === 0 ? 0 : Math.round((completedCount / totalTopics) * 100);

  const isCourseCompleted = progressPercent === 100;

  const fetchIcon = (id: string) => {
    return completedSection.some((s) => s.id === id) ? (
      <CheckLine size={14} className="mr-2" />
    ) : (
      <Play size={14} className="mr-2" />
    );
  };
  return (
    <div className="relative h-full">
      {/* Scrollable content */}
      <nav className="h-full overflow-y-auto p-4 space-y-4 pb-24">
        {/* Mode Switch */}
        <div
          className={`flex mb-6 justify-center items-center gap-4 ${Colors.text.primary}`}
        >
          <ProgressRing value={progressPercent} />
          <button
            onClick={() => setMode("LEARNING")}
            className={`px-2 h-10 rounded-md cursor-pointer ${
              mode === "LEARNING"
                ? `${Colors.background.special} ${Colors.text.primary}`
                : `${Colors.background.primary} ${Colors.text.primary}`
            }`}
          >
            Learning
          </button>
          <button
            onClick={() => setMode("ASSIGNEMENT")}
            className={`px-2 h-10 rounded-md cursor-pointer ${
              mode === "ASSIGNEMENT"
                ? `${Colors.background.special} ${Colors.text.primary}`
                : `${Colors.background.primary} ${Colors.text.primary}`
            }`}
          >
            Assignments
          </button>
        </div>

        {sections.map((section) => (
          <div
            key={section.id}
            className={`rounded-lg overflow-hidden ${Colors.background.primary} ${Colors.text.primary} ${Colors.hover.special}`}
          >
            {/* Section Header */}
            <button
              onClick={() => onToggleSection(section.id)}
              className={`w-full px-4 py-3 flex justify-between items-center cursor-pointer ${Colors.hover.special}`}
            >
              <span>{section.name}</span>
              <ChevronDown
                className={`transition-transform ${
                  section.isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Section Content */}
            {section.isOpen && (
              <div
                className={`${Colors.background.primary} ${Colors.text.primary}`}
              >
                {mode === "LEARNING" ? (
                  section.courseLearningContents.length > 0 ? (
                    section.courseLearningContents.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onSelectTopic(t)}
                        className={`flex items-center w-full px-6 py-2 cursor-pointer ${Colors.hover.special}`}
                      >
                        {fetchIcon(t.id)}
                        {t.name}
                      </button>
                    ))
                  ) : (
                    <div className={`px-6 py-2 ${Colors.text.secondary}`}>
                      No topics yet
                    </div>
                  )
                ) : section.courseAssignemnts.length > 0 ? (
                  section.courseAssignemnts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => onSelectAssignment(a)}
                      className={`flex items-center w-full px-6 py-2 cursor-pointer ${Colors.hover.special}`}
                    >
                      {a.name}
                    </button>
                  ))
                ) : (
                  <div className={`px-6 py-2 ${Colors.text.secondary}`}>
                    No assignments yet
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
      {/*  CERTIFICATE BUTTON */}
      {isCourseCompleted && (
        <div className="absolute bottom-4 right-4">
          <button
            className={`px-4 py-2 rounded-lg shadow-md font-medium
          ${Colors.background.special} ${Colors.text.primary}
          hover:scale-105 transition cursor-pointer`}
            onClick={onCertificate}
          >
            {generatingCertificate ? "generating..." : "Get Certificate"}
          </button>
        </div>
      )}
    </div>
  );
}


