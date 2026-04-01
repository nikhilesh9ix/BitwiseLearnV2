"use client";

// imports -----------------------------------------------------------------
import { use, useEffect, useState } from "react";
import {
  Search,
  ClipboardList,
  Clock,
  ChevronDown,
  ChevronUp,
  Circle,
  Radio,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { createAssessments } from "@/api/assessments/create-assessments";
import { getAllAssessments } from "@/api/assessments/get-all-assessments";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getColors } from "../../general/(Color Manager)/useColors";
import { getAllInstitutions } from "@/api/institutions/get-all-institutions";
import { getAllBatches } from "@/api/batches/get-all-batches";
import { useStudent } from "@/store/studentStore";
import { getAssessmentsByInstitution } from "@/api/assessments/get-assessments-by-batch";
import { useInstitution } from "@/store/institutionStore";
import { useAdmin } from "@/store/adminStore";
import useLogs from "@/lib/useLogs";

// colors ------------------------------------------------------------------
const Colors = getColors();

// types -------------------------------------------------------------------
type CreateAssessment = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  startTime: string;
  endTime: string;
  individualSectionTimeLimit?: number;
  autoSubmit: boolean;
  status?: "UPCOMING" | "LIVE" | "ENDED";
  batchId: string;
};

// -------------------------------------------------------------------------
// Assessment Card
// -------------------------------------------------------------------------
const getStatus = (status: string) => {
  if (status === "LIVE")
    return "bg-green-500/15 text-green-400 border-green-500/30";
  else if (status === "ENDED")
    return "bg-red-500/15 text-red-400 border-red-500/30";

  return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
};

const formatAssessmentDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN");
};

const AssessmentCard = ({ assessment }: { assessment: CreateAssessment }) => {
  const [status, setStatus] = useState(assessment.status);

  const statusStyles = getStatus(status as any);

  useEffect(() => {
    const interval = setInterval(() => {
      const nowMs = Date.now();
      const startMs = new Date(assessment.startTime).getTime();
      const endMs = new Date(assessment.endTime).getTime();

      if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
        if (nowMs >= endMs && status !== "ENDED") {
          setStatus("ENDED");
          return;
        }
      }

      if (!Number.isNaN(startMs) && nowMs >= startMs && status === "UPCOMING") {
        setStatus("LIVE");
      }
    }, 1000); // check every second

    return () => clearInterval(interval);
  }, [assessment.startTime, status]);
  const router = useRouter();
  const handleClick = (assessmentId: string) => {
    router.push(`/admin-dashboard/assessments/${assessmentId}`);
  };
  return (
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
          {assessment.name}
        </h3>

        {status && (
          <span
            className={`text-xs px-3 py-1 rounded-full border ${statusStyles}`}
          >
            {status}
          </span>
        )}
      </div>

      <p className={`text-sm leading-relaxed ${Colors.text.secondary}`}>
        {assessment.description}
      </p>

      <div className="flex items-center gap-2 text-xs text-secondary-font">
        <Clock size={14} />
        <span>
          {formatAssessmentDateTime(assessment.startTime)} — {formatAssessmentDateTime(assessment.endTime)}
        </span>
      </div>

      <p className="text-xs italic text-secondary-font line-clamp-2">
        {assessment.instructions}
      </p>

      <button
        className={`
          mt-auto w-full rounded-md py-2 text-sm font-medium
          ${Colors.background.special} ${Colors.text.primary}
          hover:opacity-90 transition cursor-pointer
        `}
        onClick={() => handleClick(assessment.id)}
      >
        Edit Assessment
      </button>
    </motion.div>
  );
};

// -------------------------------------------------------------------------
// Add Assessment Pop-up
// -------------------------------------------------------------------------
interface AddAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAssessment) => void;
}
const AddAssessmentModal = ({
  open,
  onClose,
  onSubmit,
}: AddAssessmentModalProps) => {
  const [form, setForm] = useState<CreateAssessment>({
    id: "",
    name: "",
    description: "",
    instructions: "",
    startTime: "",
    endTime: "",
    individualSectionTimeLimit: undefined,
    autoSubmit: true,
    batchId: "",
    status: "UPCOMING",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { loading, role } = useLogs();
  const [startDate, setStartDate] = useState("");
  const [startClock, setStartClock] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endClock, setEndClock] = useState("");
  const { info: institutionInfo } = useInstitution();
  const [institutes, setInstitutes] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [clockColor, setClockColor] = useState("Dark");
  const [selectedInstitute, setSelectedInstitute] = useState("");

  const [batches, setBatches] = useState<
    { id: string; batchname: string; branch: string; batchEndYear: string }[]
  >([]);
  useEffect(() => {
    setClockColor(localStorage.getItem("app-theme") || "Dark");
  }, []);
  const fetchInstitutes = async () => {
    try {
      if (role === null) return;
      console.log(role);
      if (role === 0 || role == 1 || role == 2) {
        console.log(role);
        await getAllInstitutions(setInstitutes);
      } else {
        setInstitutes([
          {
            id: institutionInfo?.data.id || "",
            name: institutionInfo?.data.name || "",
          },
        ]);
      }
    } catch (err) {
      // console.error("Failed to load institutes", err);
    }
  };
  useEffect(() => {
    fetchInstitutes();
  }, []);
  useEffect(() => {
    fetchInstitutes();
  }, [role]);

  useEffect(() => {
    if (!selectedInstitute) {
      setBatches([]);
      setForm((prev) => ({ ...prev, batchId: "" }));
      return;
    }

    const fetchBatches = async () => {
      try {
        await getAllBatches(setBatches, selectedInstitute);
      } catch (err) {
        // console.error("Failed to load batches", err);
      }
    };

    fetchBatches();
  }, [selectedInstitute]);

  if (!open) return null;

  const combineDateTimeToPayload = (date: string, time: string) => {
    if (!date || !time) return "";
    return `${date}T${time}:00`;
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      startTime: combineDateTimeToPayload(startDate, startClock),
      endTime: combineDateTimeToPayload(endDate, endClock),
    };

    console.log(payload);
    const newErrors: Record<string, string> = {};

    if (!payload.name.trim()) newErrors.name = "Assessment name is required";
    if (!payload.description.trim())
      newErrors.description = "Description is required";
    if (!payload.instructions.trim())
      newErrors.instructions = "Instructions are required";
    if (!payload.startTime) newErrors.startTime = "Start date & time required";
    if (!payload.endTime) newErrors.endTime = "End date & time required";
    if (!payload.batchId.trim()) newErrors.batchId = "Batch ID is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(payload);
    onClose();
  };

  const inputBase = `mt-1 w-full rounded-lg ${Colors.background.primary} px-3 py-2 text-sm ${Colors.text.primary} placeholder:text-slate-500 focus:outline-none transition`;

  const errorText = (field: string) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-400">{errors[field]}</p>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm no-scollbar">
      <div
        className={`
                    w-full max-w-lg
          max-h-[85vh]
          rounded-2xl ${Colors.background.secondary} no-scollbar
          overflow-y-auto
          border border-slate-800
          p-5
          `}
      >
        <h2 className={`text-lg font-semibold ${Colors.text.primary} mb-3`}>
          Create new assessment
        </h2>

        {/* Name */}
        <div className="mt-3">
          <label className={`text-sm ${Colors.text.primary}`}>
            Assessment name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. JavaScript Fundamentals"
            className={`${inputBase} `}
          />
          {errorText("name")}
        </div>

        {/* Description */}
        <div className="mt-3">
          <label className={`text-sm ${Colors.text.primary}`}>
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            placeholder="Brief description of the assessment"
            className={`${inputBase} resize-none `}
          />
          {errorText("description")}
        </div>

        {/* Instructions */}
        <div className="mt-3">
          <label className={`text-sm ${Colors.text.primary}`}>
            Instructions
          </label>
          <textarea
            name="instructions"
            value={form.instructions}
            placeholder="Demo Instructions..."
            onChange={handleChange}
            rows={2}
            className={`${inputBase} resize-none `}
          />
          {errorText("instructions")}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <label className={`text-sm font-medium ${Colors.text.primary}`}>
              Auto submit assessment
            </label>
          </div>

          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({ ...prev, autoSubmit: !prev.autoSubmit }))
            }
            className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition
      ${form.autoSubmit ? "bg-[#64ACFF]" : "bg-slate-600"}
    `}
          >
            <span
              className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition
        ${form.autoSubmit ? "translate-x-6" : "translate-x-1"}
      `}
            />
          </button>
        </div>

        {/* Start / End Time */}
        <div className="mt-4 space-y-3">
          <div>
            <label className={`text-sm ${Colors.text.primary}`}>
              Start time
            </label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <input
                type="date"
                className={`${inputBase} ${clockColor === "Dark" ? "date-white" : ""} ${Colors.text.primary} mt-0 col-span-2  startTime",
                )}`}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  clearError("startTime");
                }}
              />
              <input
                type="time"
                className={`${inputBase} ${clockColor === "Dark" ? "date-white" : ""}  mt-0 ${Colors.text.primary} `}
                value={startClock}
                onChange={(e) => {
                  setStartClock(e.target.value);
                  clearError("startTime");
                }}
              />
            </div>
            {errorText("startTime")}
          </div>

          <div>
            <label className={`text-sm  ${Colors.text.primary}`}>
              End time
            </label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <input
                type="date"
                className={`${inputBase} date-white mt-0 col-span-2 endTime",

                )}`}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  clearError("endTime");
                }}
              />
              <input
                type="time"
                className={`${inputBase} date-white mt-0 ${Colors.text.primary} `}
                value={endClock}
                onChange={(e) => {
                  setEndClock(e.target.value);
                  clearError("endTime");
                }}
              />
            </div>
            {errorText("endTime")}
          </div>
        </div>

        {/* Institute dropdown */}
        <div className="mt-3">
          <label className="text-sm text-slate-400">Institute</label>
          <select
            value={selectedInstitute}
            onChange={(e) => setSelectedInstitute(e.target.value)}
            className={`${inputBase}`}
          >
            <option value="">Select institute</option>
            {institutes &&
              institutes.map((institute) => (
                <option key={institute.id} value={institute.id}>
                  {institute.name}
                </option>
              ))}
          </select>
        </div>

        {/* Batch dropdown */}
        {selectedInstitute && (
          <div className="mt-3">
            <label className="text-sm text-slate-400">Batch</label>
            <select
              name="batchId"
              value={form.batchId}
              onChange={handleChange}
              className={`${inputBase} `}
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchname}
                </option>
              ))}
            </select>
            {errorText("batchId")}
          </div>
        )}

        {/* Actions */}
        <div className={`mt-5 flex justify-end gap-3 bottom-0 pt-3`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${Colors.background.primary} ${Colors.text.primary} ${Colors.hover.special}`}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-lg ${Colors.background.special} ${Colors.text.primary} font-medium ${Colors.hover.special}`}
          >
            Create Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------
// Skeleton Card
// -------------------------------------------------------------------------
const AssessmentSkeleton = () => (
  <div
    className={`
      rounded-xl p-4 flex flex-col gap-4
      ${Colors.background.secondary}
      ${Colors.border.defaultThin}
      animate-pulse
    `}
  >
    <div className="flex justify-between gap-4">
      <div className="h-5 w-2/3 rounded bg-white/10" />
      <div className="h-5 w-16 rounded bg-white/10" />
    </div>

    <div className="h-4 w-full rounded bg-white/10" />
    <div className="h-4 w-5/6 rounded bg-white/10" />

    <div className="h-3 w-3/4 rounded bg-white/10" />

    <div className="h-8 w-full rounded bg-white/10 mt-auto" />
  </div>
);

// -------------------------------------------------------------------------
// Empty State
// -------------------------------------------------------------------------
interface NoAssessmentStateProps {
  onCreate: () => void;
}

const NoAssessmentState = ({ onCreate }: NoAssessmentStateProps) => (
  <section className="flex flex-col items-center justify-center gap-6 pt-24 text-center">
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      className="flex h-20 w-20 items-center justify-center rounded-full bg-[#64ACFF]"
    >
      <ClipboardList size={40} className="${Colors.text.primary}" />
    </motion.div>

    <p className={`text-xl font-semibold ${Colors.text.primary}`}>
      No assessments created yet
    </p>

    <p className={`max-w-md text-sm ${Colors.text.secondary}`}>
      Create assessments to evaluate learners, track progress, and measure
      understanding across topics.
    </p>

    <button
      className={`
        rounded-md px-6 py-2 font-medium
        ${Colors.background.special} ${Colors.text.primary}
        hover:opacity-90 transition
      `}
      onClick={onCreate}
    >
      + Create your first assessment
    </button>
  </section>
);

// -------------------------------------------------------------------------
// Main Component
// -------------------------------------------------------------------------

const AssessmentsV1 = () => {
  const [assessments, setAssessments] = useState<CreateAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateAssessment, setOpenCreateAssessment] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "UPCOMING" | "LIVE" | "ENDED"
  >("ALL");
  const [filterOpen, setFilterOpen] = useState(false);

  const { info: instituteInfo } = useInstitution();
  const { info: adminInfo } = useAdmin();
  const { loading: logsLoading, role: logsRole } = useLogs();
  const fetchAssessments = async () => {
    try {
      setLoading(true);
      if (!instituteInfo?.data.id && !adminInfo?.data.id) return;

      let res: any;
      if (logsRole != null && logsRole < 3) {
        res = await getAllAssessments();
        setAssessments(res || []);
      } else {
        res = await getAssessmentsByInstitution((data: any) => {
          //@ts-ignore
          setAssessments(data || []);
          // @ts-ignore
        }, instituteInfo.data.id as any);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (logsRole === null) return;
    fetchAssessments();
  }, [logsLoading, logsRole]);

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = searchText.trim()
      ? assessment.name.toLowerCase().includes(searchText.toLowerCase()) ||
        assessment.description.toLowerCase().includes(searchText.toLowerCase())
      : true;

    const matchesStatus =
      statusFilter === "ALL" ? true : assessment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <section className="flex w-full flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${Colors.text.secondary}`}
            />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`
        w-full rounded-xl pl-10 pr-4 py-2.5 text-sm
        ${Colors.background.secondary}
        ${Colors.text.primary}
        ${Colors.border.fadedThin}
        outline-none
        focus:ring-2 focus:ring-(--accent-primary)/30
        transition
      `}
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-48">
            <div className="relative">
              <button
                onClick={() => setFilterOpen((prev) => !prev)}
                className={`
          flex items-center gap-2
          px-4 py-2.5 rounded-xl text-sm
          ${Colors.background.secondary}
          ${Colors.text.primary}
          ${Colors.border.fadedThin}
          ${Colors.hover.special}
          transition cursor-pointer
        `}
              >
                {statusFilter === "ALL" ? "All Status" : statusFilter}

                {filterOpen ? (
                  <ChevronUp size={16} className={Colors.text.secondary} />
                ) : (
                  <ChevronDown size={16} className={Colors.text.secondary} />
                )}
              </button>

              {filterOpen && (
                <div
                  className={`
            absolute right-0 mt-2 w-48
            ${Colors.background.secondary}
            ${Colors.border.fadedThin}
            rounded-xl
            shadow-xl backdrop-blur-md
            overflow-hidden z-50
          `}
                >
                  {["ALL", "UPCOMING", "LIVE", "ENDED"].map((status) => {
                    const isActive = statusFilter === status;

                    return (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(
                            status as "ALL" | "UPCOMING" | "LIVE" | "ENDED",
                          );
                          setFilterOpen(false);
                        }}
                        className={`
                  w-full flex items-center justify-between
                  px-4 py-2.5 text-sm
                  ${Colors.text.primary}
                  ${Colors.hover.textSpecial}
                  transition cursor-pointer
                  ${isActive ? Colors.background.primary : ""}
                `}
                      >
                        <div className="flex items-center gap-2">
                          {status === "LIVE" && (
                            <Radio size={14} className={Colors.text.special} />
                          )}
                          {status === "ENDED" && (
                            <XCircle
                              size={14}
                              className={Colors.text.special}
                            />
                          )}
                          {status === "UPCOMING" && (
                            <Clock size={14} className={Colors.text.special} />
                          )}
                          {status === "ALL" && (
                            <Circle
                              size={14}
                              className={Colors.text.secondary}
                            />
                          )}

                          <span>
                            {status === "ALL" ? "All Status" : status}
                          </span>
                        </div>

                        {isActive && (
                          <CheckCircle2
                            size={14}
                            className={Colors.text.special}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          className={`
    rounded-md px-4 py-2 text-sm font-medium
    ${Colors.background.special}
    ${Colors.text.primary}
    ${Colors.hover.special}
    transition
  `}
          onClick={() => {
            setOpenCreateAssessment(true);
          }}
        >
          + Add Assessment
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AssessmentSkeleton key={i} />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <NoAssessmentState onCreate={() => setOpenCreateAssessment(true)} />
      ) : filteredAssessments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 pt-20 text-center">
          <Search size={40} className="text-[#64ACFF]" />
          <p className={`text-xl font-semibold ${Colors.text.primary}`}>
            No matching assessments found
          </p>
          <p className={`text-sm ${Colors.text.secondary}`}>
            Try adjusting your search keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssessments.map((assessment, index) => (
            <AssessmentCard key={index} assessment={assessment} />
          ))}
        </div>
      )}

      {/* Add Assessment pop-up Modal  */}
      <AddAssessmentModal
        open={openCreateAssessment}
        onClose={() => setOpenCreateAssessment(false)}
        onSubmit={async (data) => {
          const toastId = toast.loading("Creating assessment...");

          try {
            await createAssessments(data);
            toast.success("Assessment created successfully!", {
              id: toastId,
            });
            setOpenCreateAssessment(false);

            await fetchAssessments();
          } catch (error) {
            // console.error("Create assessment error:", error);

            toast.error("Unable to create assessment", {
              id: toastId,
            });
          }
        }}
      />
    </section>
  );
};

export default AssessmentsV1;


