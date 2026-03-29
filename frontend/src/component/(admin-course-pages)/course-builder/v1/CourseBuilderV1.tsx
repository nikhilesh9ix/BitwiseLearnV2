"use client";

import { deleteCourseById } from "@/api/courses/course/delete-course-by-id";
import { getCourseById } from "@/api/courses/course/get-course-by-id";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { Trash2, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import AddSection from "../../add-section/v2/AddSectionV2";
import { uploadThumbnail } from "@/api/courses/course/upload-thumbnail";
import { uploadCertificate } from "@/api/courses/course/upload-certificate";
import { FileText, FileImage } from "lucide-react";
import PublishCourse from "../../publish-course/PublishCourse";
import { publishCourse } from "@/api/courses/course/publish-course";
import { createSection } from "@/api/courses/section/create-section";
import { getSections } from "@/api/courses/section/get-section";
import AddAssignment from "../../add-assignment/AddAssignment";
import { updateCourse } from "@/api/courses/course/update-course";
import { useColors } from "@/component/general/(Color Manager)/useColors";

type Props = {
  courseId: string;
};
const Colors = useColors();

/* ---------------- Delete Confirmation Modal ---------------- */

const ConfirmDeleteModal = ({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          w-full max-w-sm
          rounded-2xl
          ${Colors.background.secondary}
          ${Colors.border.defaultThick}
          p-6
          shadow-xl
          animate-in
          fade-in
          zoom-in-95
          `}
      >
        <h2 className={`text-lg font-semibold ${Colors.text.primary}`}>
          Delete this course?
        </h2>

        <p className={`mt-2 text-sm ${Colors.text.secondary}`}>
          This action is permanent and cannot be undone.
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
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Create Section Modal ---------------- */

type CreateSectionModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (sectionName: string) => void;
};

const CreateSectionModal = ({
  open,
  onClose,
  onSubmit,
}: CreateSectionModalProps) => {
  const [sectionName, setSectionName] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-sm rounded-2xl ${Colors.background.secondary} ${Colors.border.defaultThick} p-6`}
      >
        {/* Header */}
        <h2 className={`text-lg font-semibold ${Colors.text.primary}`}>
          Create new section
        </h2>

        {/* Input */}
        <div className="mt-4">
          <label className={`text-sm ${Colors.text.secondary}`}>
            Section name
          </label>
          <input
            type="text"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="e.g. Introduction"
            className={`
              mt-2 w-full rounded-lg
              ${Colors.background.primary} ${Colors.border.defaultThick}
              px-3 py-2 text-sm ${Colors.text.primary}
              placeholder:text-neutral-500
              focus:outline-none focus:border-sky-500
            `}
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setSectionName("");
              onClose();
            }}
            className={`px-4 py-2 rounded-lg ${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.hover.special} ${Colors.text.primary} transition cursor-pointer`}
          >
            Cancel 
          </button>

          <button
            onClick={() => {
              if (!sectionName.trim()) return;
              onSubmit(sectionName.trim());
              setSectionName("");
            }}
            className={`px-4 py-2 rounded-lg ${Colors.background.special} ${Colors.border.defaultThick} ${Colors.text.primary} ${Colors.hover.special} transition cursor-pointer`}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

/*--------------Add Assignment Modal --------------- */

const AddAssignmentPopup = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-999 flex justify-center mt-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-200" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const CourseSidebar = ({
  course,
  isPublished,
  onEdit,
}: {
  course: any;
  isPublished: boolean;
  onEdit: () => void;
}) => {
  return (
    <aside
      className={`
      w-90
      h-full
      ${Colors.border.defaultThick}
      ${Colors.background.secondary}
      backdrop-blur-xl
      px-6 py-6
      flex flex-col gap-6
      rounded-lg
        `}
    >
      {/* Thumbnail */}
      <div className="w-full h-45 rounded-xl overflow-hidden ">
        {course.thumbnail ? (
          <img src={course.thumbnail} className="w-full h-full object-cover" />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${Colors.text.secondary}`}
          >
            No Thumbnail
          </div>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <h2 className={`text-lg font-semibold ${Colors.text.primary}`}>
          {course.name}
        </h2>
        <p className={`text-xs ${Colors.text.secondary} leading-relaxed`}>
          {course.description}
        </p>
        <p className={`text-sm ${Colors.text.secondary}`}>
          {course.instructorName}
        </p>
      </div>

      {/* Status */}
      <span
        className={`inline-flex w-fit px-3 py-1 rounded-full text-xs border
          ${
            isPublished
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
          }`}
      >
        {course.isPublished}
      </span>

      {/* Meta */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className={`${Colors.text.primary} font-semibold`}>Level</span>
          <span className={`${Colors.text.secondary}`}>{course.level}</span>
        </div>
        <div className="flex justify-between">
          <span className={`${Colors.text.primary} font-semibold`}>
            Duration
          </span>
          <span className={`${Colors.text.secondary}`}>
            {course.duration || "-"}
          </span>
        </div>
      </div>
      <button
        onClick={onEdit}
        className={`
    mt-auto
    self-end
    px-6 py-2
    text-sm
    rounded-md
    ${Colors.background.special}
    ${Colors.text.primary}
    ${Colors.hover.special}
    transition
    cursor-pointer
          `}
      >
        Edit
      </button>
    </aside>
  );
};

/*-----------------Edit Course Modal -------------- */

const EditCourseModal = ({
  open,
  onClose,
  course,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  course: any;
  onSave: (data: {
    description: string;
    duration?: string;
    instructorName: string;
    level: "BASIC" | "INTERMEDIATE" | "ADVANCE";
  }) => void;
}) => {
  const [description, setDescription] = useState(course?.description || "");
  const [duration, setDuration] = useState(course?.duration || "");
  const [instructorName, setInstructorName] = useState(
    course?.instructorName || "",
  );
  const [level, setLevel] = useState(course?.level || "BASIC");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDescription(course?.description || "");
    setDuration(course?.duration || "");
    setInstructorName(course?.instructorName || "");
    setLevel(course?.level || "BASIC");
  }, [open, course]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);

    await onSave({
      description,
      duration,
      instructorName,
      level,
    });

    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          w-full max-w-md
          rounded-2xl
          ${Colors.background.secondary}
          ${Colors.border.defaultThick}
          p-6
          shadow-xl
          animate-in fade-in zoom-in-95
        `}
      >
        <h2 className={`text-lg font-semibold ${Colors.text.primary}`}>
          Edit course details
        </h2>

        {/* Instructor */}
        <div className="mt-4">
          <label className={`text-sm ${Colors.text.secondary}`}>
            Instructor name
          </label>
          <input
            value={instructorName}
            onChange={(e) => setInstructorName(e.target.value)}
            className={`mt-2 w-full rounded-lg ${Colors.background.primary} ${Colors.border.defaultThin} px-3 py-2 text-sm ${Colors.text.primary} focus:outline-none focus:border-sky-500`}
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
            rows={3}
            className={`mt-2 w-full rounded-lg ${Colors.background.primary} ${Colors.border.defaultThin} px-3 py-2 text-sm ${Colors.text.primary} focus:outline-none focus:border-sky-500`}
          />
        </div>

        {/* Level */}
        <div className="mt-4">
          <label className={`text-sm ${Colors.text.secondary}`}>Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
            className={`mt-2 w-full rounded-lg ${Colors.background.primary} ${Colors.border.defaultThin} px-3 py-2 text-sm ${Colors.text.primary} focus:outline-none focus:border-sky-500`}
          >
            <option value="BASIC">Basic</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCE">Advance</option>
          </select>
        </div>

        {/* Duration */}
        <div className="mt-4">
          <label className={`text-sm ${Colors.text.secondary}`}>Duration</label>
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 6 weeks"
            className={`mt-2 w-full rounded-lg ${Colors.background.primary} ${Colors.border.defaultThin} px-3 py-2 text-sm ${Colors.text.primary} focus:outline-none focus:border-sky-500`}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.text.primary} ${Colors.hover.special} transition cursor-pointer`}
          >
            Cancel
          </button>

          <button
            disabled={saving}
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg ${Colors.background.special} ${Colors.border.defaultThick} ${Colors.text.primary} ${Colors.hover.special} transition cursor-pointer`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Component ---------------- */

const CourseBuilderV1 = ({ courseId }: Props) => {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const certificateInputRef = useRef<HTMLInputElement | null>(null);
  const [certificateFileName, setCertificateFileName] = useState<string | null>(
    null,
  );
  const [thumbnailFileName, setThumbnailFileName] = useState<string | null>(
    null,
  );
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const isPublished = course?.isPublished === "PUBLISHED";
  const [showEditCourse, setShowEditCourse] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      const res = await getCourseById(courseId);
      setCourse(res.data);
    };

    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;

    const fetchSections = async () => {
      const res = await getSections(courseId);
      setSections(res.data);
    };

    fetchSections();
  }, [courseId]);

  const CourseBuilderSkeleton = () => {
    return (
      <div className="p-4 pt-0 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className={`h-7 w-64 ${Colors.background.secondary} rounded`} />

          <div className="flex gap-3 mt-4">
            <div
              className={`h-9 w-36 ${Colors.background.secondary} rounded-md`}
            />
            <div
              className={`h-9 w-36 ${Colors.background.secondary} rounded-md`}
            />
            <div
              className={`h-9 w-24 ${Colors.background.secondary} rounded-md`}
            />
          </div>
        </div>

        {/* Section */}
        <div className="mt-10 space-y-8">
          <div className="rounded-xl border border-slate-800 p-5 space-y-4">
            <div
              className={`h-5 w-40 ${Colors.background.secondary} rounded`}
            />
            <div
              className={`h-4 w-full ${Colors.background.secondary} rounded`}
            />
            <div
              className={`h-4 w-5/6 ${Colors.background.secondary} rounded`}
            />
          </div>
        </div>

        {/* Add buttons */}
        <div className="flex gap-3 mt-6">
          <div
            className={`h-9 w-32 ${Colors.background.secondary} rounded-md`}
          />
          <div
            className={`h-9 w-40 ${Colors.background.secondary} rounded-md`}
          />
        </div>

        {/* Floating delete button */}
        <div
          className={`fixed bottom-6 right-6 h-12 w-28 ${Colors.background.secondary} rounded-full`}
        />
      </div>
    );
  };

  if (!course) {
    return <CourseBuilderSkeleton />;
  }

  const courseName = course.name;
  const instructorName = course.instructorName;
  // const sections = course.courseSections || [];

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      toast.loading("Uploading Thumbnail... ", { id: "thumbnail" });

      const res = await uploadThumbnail(courseId, file);

      if (res?.data?.thumbnail) {
        toast.success("ThumbNail Uploaded", { id: "thumbnail" });

        const refreshed = await getCourseById(courseId);
        setCourse(refreshed.data);
      } else {
        toast.error("Upload Failed", { id: "thumbnail" });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: "thumbnail" });
    } finally {
      setThumbnailFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCertificateUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      toast.loading("Uploading Certificate...", { id: "certificate" });

      const res = await uploadCertificate(courseId, file);

      if (!res?.data?.certificate) throw new Error();

      toast.success("Certificate uploaded", { id: "certificate" });
      const refreshed = await getCourseById(courseId);
      setCourse(refreshed.data);
    } catch {
      toast.error("Certificate upload failed", { id: "certificate" });
    } finally {
      setCertificateFileName(null);
      if (certificateInputRef.current) certificateInputRef.current.value = "";
    }
  };

  const handlePublishCourse = async () => {
    try {
      toast.loading("Updating publish status...", { id: "publish" });

      const res = await publishCourse(courseId);

      const { isPublished } = res.data;

      toast.success(
        isPublished
          ? "Course published successfully"
          : "Course unpublished successfully",
        { id: "publish" },
      );

      const refreshed = await getCourseById(courseId);
      setCourse(refreshed.data);
    } catch (error) {
      toast.error("Failed to update publish status", { id: "publish" });
    } finally {
      setShowPublishModal(false);
    }
  };

  const publishRequirements = [
    {
      label: "Course name added",
      satisfied: Boolean(course?.name?.trim()),
    },
    {
      label: "Instructor name added",
      satisfied: Boolean(course?.instructorName?.trim()),
    },
    {
      label: "At least one section Needed",
      satisfied: Array.isArray(sections) && sections.length > 0,
    },
    {
      label: "Thumbnail uploaded",
      satisfied: Boolean(course?.thumbnail),
    },
    {
      label: "Certificate uploaded",
      satisfied: Boolean(course?.certificate),
    },
  ];

  return (
    <div className={`flex min-h-screen overflow-hidden`}>
      <CourseSidebar
        course={course}
        isPublished={isPublished}
        onEdit={() => setShowEditCourse(true)}
      />
      <main className="flex-1 overflow-y-auto p-4 pt-0">
        {/*HIDDEN FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setThumbnailFileName(file.name);
            handleThumbnailUpload(e);
          }}
        />
        {/*HIDDEN INPUT FOR CERTIFICATE */}
        <input
          ref={certificateInputRef}
          type="file"
          accept="application/pdf,image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setCertificateFileName(file.name);
            handleCertificateUpload(e);
          }}
        />
        {/* top nav */}
        <div className="sticky top-0 z-40 backdrop-blur border-b border-neutral-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={() => router.push("/admin-dashboard/courses")}
              className={`flex items-center gap-1 text-2xl ${Colors.text.special} transition cursor-pointer mt-1`}
            >
              <ChevronLeft size={28} />
            </button>

            <h1 className={` ${Colors.text.primary} text-2xl`}>
              {courseName} by {instructorName}
            </h1>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => certificateInputRef.current?.click()}
              className={`px-3 py-1.5 text-sm rounded-md ${Colors.border.specialThick} ${Colors.text.special} ${Colors.hover.special} transition cursor-pointer`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} />
                Upload Certificate
              </div>
              {certificateFileName && (
                <p
                  className={`mt-1 text-xs ${Colors.text.secondary} truncate max-w-45`}
                >
                  {certificateFileName}
                </p>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 text-sm rounded-md ${Colors.border.specialThick} ${Colors.text.special} ${Colors.hover.special} transition cursor-pointer`}
            >
              <div className="flex items-center gap-2">
                <FileImage size={16} />
                Upload Thumbnail
              </div>
              {thumbnailFileName && (
                <p
                  className={`mt-1 text-xs ${Colors.text.secondary} truncate max-w-45`}
                >
                  {thumbnailFileName}
                </p>
              )}
            </button>

            <button
              onClick={() => setShowPublishModal(true)}
              className={`
    px-4 py-1.5 text-sm rounded-md font-medium transition cursor-pointer
    ${Colors.text.primary} ${Colors.background.special} ${Colors.hover.special}
  `}
            >
              {isPublished ? "UnPublish" : "Publish"}
            </button>
          </div>
        </div>

        {/* course sections */}
        <div className="mt-10 space-y-6">
          {sections.map((section, index) => (
            <AddSection
              key={section.id}
              sectionId={section.id}
              sectionNumber={index + 1}
              sectionData={section}
              onAddAssignment={(sectionId) => {
                setActiveSectionId(sectionId);
                setShowAddAssignment(true);
              }}
              onSectionDeleted={async () => {
                const res = await getSections(courseId);
                setSections(res.data);
              }}
            />
          ))}
        </div>

        {/* add buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowCreateSection(true)}
            className={`    px-4 py-1.5 text-sm rounded-md font-medium transition cursor-pointer
    ${Colors.text.primary} ${Colors.background.special} ${Colors.hover.special}`}
          >
            + Add Section
          </button>
        </div>

        {/* Floating Delete Button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className={`
          fixed bottom-6 right-6
          flex items-center gap-2
          px-4 py-3
          rounded-full
          ${Colors.background.secondary}
          backdrop-blur-md
          border border-red-500/30
          text-red-300
          shadow-lg
          hover:border-red-400/60
          hover:shadow-[0_0_18px_rgba(239,68,68,0.25)]
          hover:scale-102 transition cursor-pointer`}
        >
          <Trash2 size={18} />
          Delete
        </button>

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            try {
              await deleteCourseById(courseId);
              router.push("/admin-dashboard/courses");
              toast.success("Course deleted successfully");
            } catch (error) {
              toast.error("Failed to delete course");
            } finally {
              setShowDeleteConfirm(false);
            }
          }}
        />

        {/* publish course modal  */}
        <PublishCourse
          open={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onConfirm={handlePublishCourse}
          requirements={publishRequirements}
          isPublished={course?.isPublished === "PUBLISHED"}
        />

        {/* create section modal  */}
        <CreateSectionModal
          open={showCreateSection}
          onClose={() => setShowCreateSection(false)}
          onSubmit={async (name) => {
            try {
              await createSection(courseId, name);
              toast.success("Section created!");

              const res = await getSections(courseId);
              setSections(res.data);
            } catch (error) {
              toast.error("Unable to create section");
            } finally {
              setShowCreateSection(false);
            }
          }}
        />

        {/*Add Assignment Modal */}
        {showAddAssignment && activeSectionId && (
          <AddAssignmentPopup
            open={showAddAssignment}
            onClose={async () => {
              setShowAddAssignment(false);
              setActiveSectionId(null);
              const res = await getSections(courseId);
              setSections(res.data);
            }}
          >
            <AddAssignment
              sectionId={activeSectionId}
              onClose={async () => {
                setShowAddAssignment(false);
                setActiveSectionId(null);
                const res = await getSections(courseId);
                setSections(res.data);
              }}
            />
          </AddAssignmentPopup>
        )}

        {/* Edit Course Modal */}
        <EditCourseModal
          open={showEditCourse}
          onClose={() => setShowEditCourse(false)}
          course={course}
          onSave={async (data) => {
            try {
              toast.loading("Updating Course...", { id: "update-course" });

              await updateCourse(courseId, data);

              const refreshed = await getCourseById(courseId);
              setCourse(refreshed.data);

              toast.success("Course Updated", { id: "update-course" });
            } catch (error) {
              toast.error("Failed to Update Course", { id: "update-course" });
            } finally {
              setShowEditCourse(false);
            }
          }}
        />
      </main>
    </div>
  );
};

export default CourseBuilderV1;
