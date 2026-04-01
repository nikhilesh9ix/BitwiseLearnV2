"use client";

import { Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { addContentToSection } from "@/api/courses/section/add-content-to-section";
import toast from "react-hot-toast";
import { deleteSectionById } from "@/api/courses/section/delete-section";
import { updateContentToSection } from "@/api/courses/section/update-content-to-section";
import { uploadTranscript } from "@/api/courses/section/upload-transcript";
import { deleteContentFromSection } from "@/api/courses/section/delete-content-from-section";
import Link from "next/link";
import { getAssignmentsBySection } from "@/api/courses/assignment/get-section-assignments";
import { updateAssignment } from "@/api/courses/assignment/update-assignment";
import { deleteAssignmentById } from "@/api/courses/assignment/delete-assignment";
import QuestionEditorWrapper from "../../add-assignment/v1/QuestionEditorWrapper";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { uploadBatches } from "@/api/batches/create-batches";
import { addAssignmentQuestion } from "@/api/courses/assignment-questions/add-question";

type Props = {
  sectionNumber: number;
  sectionId: string;
  sectionData: {
    id: string;
    name: string;
    courseLearningContents: {
      id: string;
      name: string;
      description: string;
      transcript: string;
      videoUrl?: string;
      file?: string;
    }[];
  };
  onAddAssignment: (sectionId: string, onCreated: () => void) => void;
  onSectionDeleted: () => void;
};

type UpdateContentPayload = {
  name?: string;
  description?: string;
  transcript?: File | null;
  videoUrl?: string;
};

// ------------------------ Add Topic Modal --------------------------
interface AddTopicModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => void;
}

const AddTopicModal = ({ open, onClose, onSubmit }: AddTopicModalProps) => {
  const Colors = getColors();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-sm rounded-2xl ${Colors.background.secondary} ${Colors.border.defaultThick} p-6`}
      >
        {/* Header */}
        <h2 className={`text-lg font-semibold ${Colors.text.primary}`}>
          Add new topic
        </h2>

        {/* Topic Name */}
        <div className="mt-4">
          <label className={`text-sm ${Colors.text.secondary}`}>
            Topic name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Introduction to HTML"
            className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className={`text-sm ${Colors.text.secondary}`}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this topic"
            rows={3}
            className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setName("");
              setDescription("");
              onClose();
            }}
            className={`px-4 py-2 rounded-lg ${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.hover.special} ${Colors.text.primary} transition cursor-pointer`}
          >
            Cancel 
          </button>

          <button
            onClick={() => {
              if (!name.trim() || !description.trim()) return;
              onSubmit({
                name: name.trim(),
                description: description.trim(),
              });
              setName("");
              setDescription("");
            }}
            className={`px-4 py-2 rounded-lg ${Colors.background.special} ${Colors.border.defaultThick} ${Colors.text.primary} ${Colors.hover.special} transition cursor-pointer`}
          >
            Add Topic
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmDeleteSectionModal = ({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const Colors = getColors();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl ${Colors.background.secondary} ${Colors.border.defaultThick} p-6`}
      >
        <h2 className={`text-lg font-semibold ${Colors.text.primary}`}>
          Delete this section?
        </h2>

        <p className={`mt-2 text-sm ${Colors.text.secondary}`}>
          All topics & assignments inside this section will be removed.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.hover.special} ${Colors.text.primary} transition cursor-pointer`}
          >
            Cancel 
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------- Update Topic Modal --------------------
interface UpdateTopicModalProps {
  open: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    description: string;
    transcript: string;
    videoUrl?: string;
    file?: string;
  };
  onUpdate: (data: {
    name: string;
    description: string;
    transcript: string;
    transcriptFile: File | null;
    videoUrl: string;
  }) => void;
}
const UpdateTopicModal = ({
  open,
  onClose,
  initialData,
  onUpdate,
}: UpdateTopicModalProps) => {
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [videoUrl, setVideoUrl] = useState(initialData.videoUrl || "");
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const Colors = getColors();

  useEffect(() => {
    if (open) {
      setName(initialData.name);
      setDescription(initialData.description);
      setVideoUrl(initialData.videoUrl || "");
      setTranscriptText(initialData.transcript || "");
      setTranscriptFile(null);
    }
  }, [
    open,
    initialData.name,
    initialData.description,
    initialData.videoUrl,
    initialData.transcript,
  ]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className={`mt-2 w-full max-w-2xl rounded-2xl ${Colors.background.secondary} ${Colors.border.defaultThick} p-8`}
      >
        {/* Header */}
        <h2 className={`text-xl font-semibold ${Colors.text.primary}`}>
          Update Topic
        </h2>

        {/* Grid Layout */}
        <div className="mt-6 grid grid-cols-2 gap-5">
          {/* Topic Name */}
          <div className="col-span-2">
            <label className={`text-sm ${Colors.text.secondary}`}>
              Topic name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className={`text-sm ${Colors.text.secondary}`}>
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
            />
          </div>

          {/* Transcript Text */}
          <div className="col-span-2">
            <label className={`text-sm ${Colors.text.secondary}`}>
              Transcript (paste text)
            </label>
            <textarea
              rows={4}
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Paste transcript text here (optional)"
              className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
            />
          </div>

          {/* Upload File */}

          <div className="col-span-2 flex justify-between items-center">
            <div>
              <label className={`text-sm ${Colors.text.secondary}`}>
                Upload File (MAX:10MB)
              </label>
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)}
                className={`mt-2 w-full rounded-lg ${Colors.background.primary} ${Colors.border.defaultThin} px-3 py-2 text-sm ${Colors.text.secondary}
              file:mr-3 file:rounded-md file:border-0 file:bg-[#3b82f6]
              file:px-3 file:py-1 file:text-sm file:text-white hover:opacity-80 transition cursor-pointer file:cursor-pointer`}
              />
            </div>
            {initialData.file && (
              <div className="mt-4">
                <Link
                  href={initialData.file}
                  target="_blank"
                  className={`text-sm ${Colors.background.special} ${Colors.hover.special} p-3 rounded-md text-wrapped text-white font-semibold transition`}
                >
                  Previous File
                </Link>
              </div>
            )}
          </div>

          {/* Video URL */}
          <div className="col-span-2">
            <label className="text-sm text-slate-400">Video URL</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.hover.special} ${Colors.text.primary} transition cursor-pointer`}
          >
            Cancel 
          </button>

          <button
            onClick={() => {
              if (!name.trim() || !description.trim()) return;

              onUpdate({
                name: name.trim(),
                description: description.trim(),
                transcript: transcriptText.trim(),
                transcriptFile,
                videoUrl: videoUrl.trim(),
              });
            }}
            className={`text-sm ${Colors.background.special} ${Colors.hover.special} p-3 rounded-md text-wrapped text-white font-semibold transition`}
          >
            Update Topic
          </button>
        </div>
      </div>
    </div>
  );
};

/*------------------------------ Edit Assignment Modal --------------- */

const EditAssignmentModal = ({
  open,
  onClose,
  initialData,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    description: string;
    marksPerQuestion: number;
    instruction: string;
  };
  onUpdate: (data: {
    description: string;
    marksPerQuestion: number;
    instruction: string;
  }) => void;
}) => {
  const [description, setDescription] = useState(initialData.description);
  const [marks, setMarks] = useState<number | "">(initialData.marksPerQuestion);
  const [instruction, setInstruction] = useState(initialData.instruction);
  const [saving, setSaving] = useState(false);
  const Colors = getColors();

  useEffect(() => {
    if (open) {
      setDescription(initialData.description);
      setMarks(initialData.marksPerQuestion);
      setInstruction(initialData.instruction);
    }
  }, [open, initialData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl ${Colors.background.secondary} ${Colors.border.defaultThick} p-6`}
      >
        <h2 className={`text-xl font-semibold ${Colors.text.primary}`}>
          Edit Assignment
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className={`text-sm ${Colors.text.secondary}`}>
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
            />
          </div>
          <div>
            <label className={`text-sm ${Colors.text.secondary}`}>
              Marks Per Question
            </label>
            <input
              type="number"
              value={marks}
              onChange={(e) => {
                const value = e.target.value;
                setMarks(value === "" ? "" : Number(value));
              }}
              className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThin}
              px-3 py-2 text-sm ${Colors.text.secondary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
            />
          </div>
          <div>
            <label className={`text-sm ${Colors.text.secondary}`}>
              Instructions
            </label>
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className={`
                mt-2 w-full rounded-lg
                ${Colors.background.primary} ${Colors.border.defaultThin}
                px-3 py-2 text-sm ${Colors.text.secondary}
                placeholder:text-neutral-500
                focus:outline-none focus:border-sky-500
              `}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.hover.special} ${Colors.text.primary} transition cursor-pointer`}
          >
            Cancel 
          </button>

          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                onUpdate({
                  description,
                  marksPerQuestion: marks === "" ? 0 : marks,
                  instruction,
                });
              } finally {
                setSaving(false);
              }
            }}
            className={`text-sm ${Colors.background.special} ${Colors.hover.special} p-3 rounded-md text-wrapped text-white font-semibold transition cursor-pointer`}
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/*------------------------------ Delete Assignment Modal ------------- */

const ConfirmDeleteAssignmentModal = ({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => {
  const Colors = getColors();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl ${Colors.background.secondary} ${Colors.border.defaultThin} p-6`}
      >
        <h2 className={`text-lg font-semibold ${Colors.text.primary}`}>
          Delete this assignment?
        </h2>

        <p className={`mt-2 text-sm ${Colors.text.secondary}`}>
          This will permanently remove the assignment and all its questions.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className={`
px-4 py-2 rounded-lg ${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.hover.special} ${Colors.text.primary} transition cursor-pointer
    ${loading ? "opacity-50 cursor-not-allowed" : ""}
  `}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`
    px-4 py-2 rounded-lg
    text-white transition cursor-pointer
    ${loading
                ? "bg-red-600/60 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500"
              }
  `}
          >
            {loading ? "Deleting Assignment..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------ Main Content ------------------------

const AddSectionV2 = ({
  sectionNumber,
  sectionData,
  sectionId,
  onAddAssignment,
  onSectionDeleted,
}: Props) => {
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const topics = sectionData.courseLearningContents || [];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteTopicConfirm, setShowDeleteTopicConfirm] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"TOPIC" | "ASSIGNMENT">("TOPIC");
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);

  const handleDeleteSection = async () => {
    try {
      await deleteSectionById(sectionId);
      toast.success("Section deleted");
      onSectionDeleted();
    } catch (error) {
      toast.error("Failed to delete section");
    } finally {
      setShowDeleteConfirm(false);
    }
  };
  const [isUpdateTopicOpen, setIsUpdateTopicOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{
    id: string;
    name: string;
    description: string;
    transcript: string;
    videoUrl?: string;
    file?: string;
  } | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [asssignmentLoading, setAssignmentLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<{
    id: string;
    name: string;
    description: string;
    marksPerQuestion: number;
    instruction: string;
  } | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [showDeleteAssignmentConfirm, setShowDeleteAssignmentConfirm] =
    useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(
    null,
  );
  const [deletingAssignment, setDeletingAssignment] = useState(false);
  const [assignmentRefetchKey, setAssignmentRefetchKey] = useState(0);
  const [bulkUploadAssignmentId, setBulkUploadAssignmentId] = useState<string | null>(null);
  const Colors = getColors();

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;

    const toastId = toast.loading("Deleting Topic...");
    try {
      await deleteContentFromSection(topicToDelete);
      toast.success("Topic Deleted", { id: toastId });
      onSectionDeleted();
    } catch (error) {
      // console.error(error);
      toast.error("Failed to delete topic", { id: toastId });
    } finally {
      setShowDeleteTopicConfirm(false);
      setTopicToDelete(null);
    }
  };

  useEffect(() => {
    if (activeTab !== "ASSIGNMENT") return;

    const fetchAssignments = async () => {
      try {
        setAssignmentLoading(true);
        const res = await getAssignmentsBySection(sectionId);
        setAssignments(res.data || []);
      } catch (error) {
        // console.error(error);
        toast.error("Failed to Fetch Assignments");
      } finally {
        setAssignmentLoading(false);
      }
    };

    fetchAssignments();
  }, [activeTab, sectionId, assignmentRefetchKey]);

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setDeletingAssignment(true);
    const toastId = toast.loading("Deleting Assignment...");
    try {
      await deleteAssignmentById(assignmentToDelete);
      toast.success("Assignment Deleted", { id: toastId });
      const res = await getAssignmentsBySection(sectionId);
      setAssignments(res.data || []);
    } catch (error) {
      // console.error(error);
      toast.error("Failed to delete Assignment", { id: toastId });
    } finally {
      setDeletingAssignment(false);
      setShowDeleteAssignmentConfirm(false);
      setAssignmentToDelete(null);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      toast.loading("Uploading assignment questions...", { id: "bulk-upload" });

      if (!bulkUploadAssignmentId) {
        throw new Error("Assignment not selected for bulk upload");
      }

      const uploadResponse = await uploadBatches(
        bulkUploadAssignmentId,
        file,
        "ASSIGNMENT",
        null,
      );

      const rows = Array.isArray(uploadResponse?.data?.rows)
        ? uploadResponse.data.rows
        : [];

      if (rows.length === 0) {
        throw new Error("No valid questions found in uploaded file");
      }

      for (const row of rows) {
        const questionText = String(row?.question ?? "").trim();
        const options = Array.isArray(row?.options)
          ? row.options
              .map((option: unknown) => String(option ?? "").trim())
              .filter(Boolean)
          : [];
        const correctAnswer = String(
          row?.correct_option ?? row?.correctOption ?? "",
        ).trim();

        if (!questionText || options.length === 0 || !correctAnswer) {
          continue;
        }

        await addAssignmentQuestion(bulkUploadAssignmentId, {
          assignmentId: bulkUploadAssignmentId,
          question: questionText,
          options,
          correctAnswer: [correctAnswer],
        });
      }

      setAssignmentRefetchKey((prev) => prev + 1);

      // window.location.reload();
      toast.success("Assignment questions uploaded successfully", {
        id: "bulk-upload",
      });
    } catch (error) {
      console.error(error);
      toast.error("Bulk upload failed", {
        id: "bulk-upload",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setBulkUploadAssignmentId(null);
    }
  };

  return (
    <div
      className={`relative ${Colors.text.primary} ${Colors.background.secondary} rounded-2xl px-6 py-4 ${Colors.border.defaultThin}`}
    >
      {/* Delete Section Button */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="
          absolute top-4 right-4
          p-2 rounded-full
          bg-red-500/10
          border border-red-500/30
          text-red-400
          hover:bg-red-500/20
          hover:border-red-400/60
          transition cursor-pointer
        "
        title="Delete section"
      >
        <Trash2 size={16} />
      </button>

      {/* Section Title */}
      <div className="flex items-center justify-start gap-5">
        <h2 className="text-lg font-semibold">
          Section {sectionNumber}: {sectionData.name}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("TOPIC")}
            className={`
        px-3 py-1.5 text-sm rounded-md transition ${Colors.text.primary} cursor-pointer
        ${activeTab === "TOPIC"
                ? `${Colors.background.special}`
                : `${Colors.background.primary} ${Colors.hover.special}`
              }
      `}
          >
            Topics
          </button>

          <button
            onClick={() => setActiveTab("ASSIGNMENT")}
            className={`
        px-3 py-1.5 text-sm rounded-md transition ${Colors.text.primary} cursor-pointer
        ${activeTab === "ASSIGNMENT"
                ? `${Colors.background.special}`
                : `${Colors.background.primary} ${Colors.hover.special}`
              }
      `}
          >
            Assignments
          </button>
        </div>
      </div>

      {/* Topics list */}
      {activeTab === "TOPIC" && (
        <div className="mt-4 space-y-3">
          {topics.length === 0 ? (
            <p className={`text-sm ${Colors.text.secondary}`}>
              No topics added yet
            </p>
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                className={`
          group
          relative
          flex items-start justify-between
          gap-4
          rounded-lg
          ${Colors.border.defaultThin}
          ${Colors.background.primary}
          px-5 py-3
          transition
        `}
              >
                {/* Content */}
                <div className="flex-1">
                  <p
                    className={`text-[15px] font-semibold ${Colors.text.primary}`}
                  >
                    {topic.name}
                  </p>

                  {topic.description && (
                    <p
                      className={`mt-1 text-sm ${Colors.text.secondary} leading-relaxed`}
                    >
                      {topic.description}
                    </p>
                  )}
                </div>

                {/* button */}
                <button
                  onClick={() => {
                    setSelectedTopic(topic);
                    setIsUpdateTopicOpen(true);
                  }}
                  className={`
            group:opacity-100
            transition
          ${Colors.border.specialThick}
          ${Colors.background.primary}
          ${Colors.hover.special}
          ${Colors.text.special}
            rounded-md
            px-3 py-1.5
            text-xs
            cursor-pointer
          `}
                >
                  Edit
                </button>
                {/*Delete Button */}
                <button
                  onClick={() => {
                    setTopicToDelete(topic.id);
                    setShowDeleteTopicConfirm(true);
                  }}
                  className="
      p-2 rounded-md
      bg-red-500/10
      border border-red-500/30
      text-red-400
      hover:bg-red-500/20
      hover:border-red-400/60
      transition cursor-pointer
    "
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bulk upload hidden input */}
      <input
        type="file"
        accept=".csv,.xlsx"
        ref={fileInputRef}
        onChange={handleBulkUpload}
        hidden
      />

      {activeTab === "ASSIGNMENT" && (
        <div className="mt-4 space-y-3">
          {asssignmentLoading ? (
            <p className={`text-sm ${Colors.text.secondary}`}>
              Loading Assignments...
            </p>
          ) : assignments.length === 0 ? (
            <p className={`text-sm ${Colors.text.secondary}`}>
              No Assignments Added yet
            </p>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setIsAssignmentModalOpen(true);
                }}
                className={`
            group
            relative
            flex items-start justify-between
            gap-4
            rounded-lg
            ${Colors.border.defaultThick}
            ${Colors.background.primary}
            px-5 py-3
            transition
            cursor-pointer
            hover:opacity-80
          `}
              >
                {/* Content */}
                <div className="flex-1">
                  <p
                    className={`text-[15px] font-semibold ${Colors.text.primary}`}
                  >
                    {assignment.name}
                  </p>

                  {assignment.description && (
                    <p
                      className={`mt-1 text-sm ${Colors.text.secondary} leading-relaxed`}
                    >
                      {assignment.description}
                    </p>
                  )}

                  <p
                    className={`mt-2 text-xs ${Colors.text.secondary} opacity-0 group-hover:opacity-100 transition`}
                  >
                    Click to view questions →
                  </p>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <Link
                    href="https://res.cloudinary.com/djy3ewpb8/raw/upload/v1772358952/assignmentFormat_aj6jgo.xlsx"
                    download
                    className={`
            group:opacity-100
            transition
          ${Colors.border.specialThick}
          ${Colors.background.primary}
          ${Colors.hover.special}
          ${Colors.text.special}
            rounded-md
            px-3 py-1.5
            text-xs
            cursor-pointer
          `}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <button>Download Format</button>
                  </Link>

                  {/* Bulk Upload */}
                  <button
                    className={`
            group:opacity-100
            transition
          ${Colors.border.specialThick}
          ${Colors.background.primary}
          ${Colors.hover.special}
          ${Colors.text.special}
            rounded-md
            px-3 py-1.5
            text-xs
            cursor-pointer
          `}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAssignment(assignment);
                      setBulkUploadAssignmentId(assignment.id);
                      setIsAssignmentModalOpen(true);
                      fileInputRef.current?.click();
                    }}
                  >
                    Bulk Upload
                  </button>

                  {/* Edit */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAssignment(assignment);
                      setIsEditAssignmentOpen(true);
                    }}
                    className={`
            group:opacity-100
            transition
          ${Colors.border.specialThick}
          ${Colors.background.primary}
          ${Colors.hover.special}
          ${Colors.text.special}
            rounded-md
            px-3 py-1.5
            text-xs
            cursor-pointer
          `}
                  >
                    Edit
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssignmentToDelete(assignment.id);
                      setShowDeleteAssignmentConfirm(true);
                    }}
                    className="
      p-2 rounded-md
      bg-red-500/10
      border border-red-500/30
      text-red-400
      hover:bg-red-500/20
      hover:border-red-400/60
      transition cursor-pointer
    "
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4 ml-1 flex gap-3">
        {activeTab == "TOPIC" && (
          <button
            className={`
              group:opacity-100
              transition
            ${Colors.border.specialThick}
            ${Colors.background.secondary}
            ${Colors.hover.special}
            ${Colors.text.special}
              rounded-md
              px-3 py-1.5
              text-xs
              cursor-pointer
            `}
            onClick={() => {
              setIsAddTopicOpen(true);
            }}
          >
            + Add Topic
          </button>
        )}
        {activeTab == "ASSIGNMENT" && (
          <button
            onClick={() =>
              onAddAssignment(sectionId, () => {
                setActiveTab("ASSIGNMENT");
                setAssignmentRefetchKey((prev) => prev + 1);
              })
            }
            className={`
              group:opacity-100
              transition
            ${Colors.border.specialThick}
            ${Colors.background.secondary}
            ${Colors.hover.special}
            ${Colors.text.special}
              rounded-md
              px-3 py-1.5
              text-xs
              cursor-pointer
            `}
          >
            + Add Assignment
          </button>
        )}
      </div>

      {/* --------------- Add Topic Modal ---------------- */}
      <AddTopicModal
        open={isAddTopicOpen}
        onClose={() => setIsAddTopicOpen(false)}
        onSubmit={async (data) => {
          const toastId = toast.loading("Creating Topic...");
          try {
            await addContentToSection(sectionId, data.name, data.description);
            toast.success("Created Topic!", { id: toastId });
            setIsAddTopicOpen(false);
            onSectionDeleted();
          } catch (error) {
            toast.error("Unable to create topic");
          }
        }}
      />
      <ConfirmDeleteSectionModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteSection}
      />

      {/* --------------- Update topic Modal ------------ */}
      {selectedTopic && (
        <UpdateTopicModal
          open={isUpdateTopicOpen}
          onClose={() => {
            setIsUpdateTopicOpen(false);
            setSelectedTopic(null);
          }}
          initialData={selectedTopic}
          onUpdate={async (data) => {
            const toastId = toast.loading("Updating Topic...");
            try {
              await updateContentToSection(selectedTopic.id, {
                name: data.name,
                description: data.description,
                videoUrl: data.videoUrl,
                transcript: data.transcript,
              });

              let transcriptUploadFailed = false;
              if (data.transcriptFile) {
                try {
                  await uploadTranscript(selectedTopic.id, data.transcriptFile);
                } catch {
                  transcriptUploadFailed = true;
                }
              }

              if (transcriptUploadFailed) {
                toast.success("Topic updated, but file upload failed", {
                  id: toastId,
                });
              } else {
                toast.success("Topic updated!", { id: toastId });
              }

              //TODO: add re-fetch for topic
              window.location.reload();
              setIsUpdateTopicOpen(false);
              setSelectedTopic(null);
            } catch (error: any) {
              const message =
                error?.message ||
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Failed to update topic";
              toast.error(message, { id: toastId });
            }
          }}
        />
      )}
      <ConfirmDeleteSectionModal
        open={showDeleteTopicConfirm}
        onClose={() => setShowDeleteTopicConfirm(false)}
        onConfirm={handleDeleteTopic}
      />
      {selectedAssignment && isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <QuestionEditorWrapper
            assignmentId={selectedAssignment.id}
            onClose={() => {
              setIsAssignmentModalOpen(false);
              setSelectedAssignment(null);
            }}
          />
        </div>
      )}
      {selectedAssignment && (
        <EditAssignmentModal
          open={isEditAssignmentOpen}
          onClose={() => {
            setIsEditAssignmentOpen(false);
            setSelectedAssignment(null);
          }}
          initialData={{
            name: selectedAssignment.name,
            description: selectedAssignment.description,
            marksPerQuestion: selectedAssignment.marksPerQuestion,
            instruction: selectedAssignment.instruction,
          }}
          onUpdate={async (data) => {
            const toastId = toast.loading("Updating Assignment...");
            try {
              await updateAssignment(selectedAssignment.id, data);
              toast.success("Assignment Updated", { id: toastId });
              setIsEditAssignmentOpen(false);
              setSelectedAssignment(null);
              const res = await getAssignmentsBySection(sectionId);
              setAssignments(res.data || []);
            } catch (error) {
              // console.error(error);
              toast.error("Failed to update Assignment", { id: toastId });
            }
          }}
        />
      )}
      <ConfirmDeleteAssignmentModal
        open={showDeleteAssignmentConfirm}
        onClose={() => setShowDeleteAssignmentConfirm(false)}
        onConfirm={handleDeleteAssignment}
        loading={deletingAssignment}
      />
    </div>
  );
};

export default AddSectionV2;


