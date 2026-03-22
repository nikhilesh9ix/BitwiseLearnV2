"use client";

import CourseForm from "@/component/general/CourseForm";
import TeacherForm from "@/component/general/TeacherForm";
import BatchStudentForm from "./BatchStudentForm";
import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import AssessmentsForm from "./AssessmentsForm";
import toast from "react-hot-toast";
import { uploadBatches } from "@/api/batches/create-batches";
import useLogs from "@/lib/useLogs";
import { useColors } from "@/component/general/(Color Manager)/useColors";
import axiosInstance from "@/lib/axios";

type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  batchId: string;
  batchName: string;
  institutionId: string;
  onStudentCreated?: () => void;
};

const Colors = useColors();

const RenderComponent = ({
  value,
  batchId,
  batchName,
  institutionId,
  onClose,
  onStudentCreated,
}: {
  value: string;
  batchId: string;
  batchName: string;
  institutionId: string;
  onClose: (value?: boolean) => void;
  onStudentCreated?: () => void;
}) => {
  switch (value) {
    case "Teachers":
      return (
        <TeacherForm openForm={onClose} institutionId={institutionId || ""} />
      );
    case "Students":
      return (
        <BatchStudentForm
          openForm={onClose}
          batchId={batchId}
          batchName={batchName}
          institutionId={institutionId}
          onSubmit={() => {
            onStudentCreated?.();
          }}
        />
      );
    case "Courses":
      return <CourseForm batchId={batchId} />;
    case "Assessments":
      return <AssessmentsForm />;
    default:
      return null;
  }
};

export const Tabs = ({
  value,
  onValueChange,
  batchId,
  batchName,
  institutionId,
  onStudentCreated,
}: TabsProps) => {
  const [addNew, setAddNew] = useState(false);
  const tabs = ["Students", "Teachers", "Assessments", "Courses"];
  const { loading: logsLoading, role: logRole } = useLogs();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      toast.loading("Uploading students...", { id: "bulk-upload" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("batchId", batchId);

      await uploadBatches(batchId as string, file, "STUDENT", null);
      onStudentCreated?.();
      toast.success("Students uploaded successfully", {
        id: "bulk-upload",
      });
    } catch (error) {
      // console.error(error);
      toast.error("Bulk upload failed", {
        id: "bulk-upload",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadStudentFormat = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/v1/students/get-student-by-batch/${batchId}`,
      );
      const students = response.data?.data || [];

      const headers = ["name", "roll_number", "email", "batch_name"];
      const rows = Array.isArray(students) && students.length > 0
        ? students.map((student: any) => [
            student.name || "",
            student.rollNumber || "",
            student.email || "",
            batchName || "",
          ])
        : [["John Doe", "ROLL-001", "john.doe@example.com", batchName || "Batch-A"]];

      const escapeCsvValue = (value: string) => {
        const normalized = String(value ?? "").replace(/"/g, '""');
        return `"${normalized}"`;
      };

      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) => row.map(escapeCsvValue).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${batchName || "students"}-bulk-format.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download student format");
    }
  };

  return (
    <>
      {/* Bulk upload hidden input */}
      <input
        type="file"
        accept=".csv,.xlsx"
        ref={fileInputRef}
        onChange={handleBulkUpload}
        hidden
      />

      {/* Modal */}
      {addNew && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div
            className={`relative  p-6 rounded-lg w-full max-w-3xl ${Colors.background.secondary}`}
          >
            <button
              onClick={() => setAddNew(false)}
              title="Close"
              aria-label="Close"
              className={`absolute top-4 right-4 ${Colors.text.secondary} hover:text-red-500 cursor-pointer active:scale-95`}
            >
              <X />
            </button>

            <RenderComponent
              value={value}
              batchId={batchId}
              batchName={batchName}
              institutionId={institutionId}
              onClose={() => setAddNew(false)}
              onStudentCreated={onStudentCreated}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-5 mt-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onValueChange(tab)}
            className={`px-4 py-1.5 rounded-md text-md cursor-pointer ${
              value === tab
                ? `${Colors.text.special} ${Colors.border.specialThick}`
                : `${Colors.text.primary} ${Colors.hover.textSpecial}`
            }`}
          >
            {tab}
          </button>
        ))}

        {/* Add New */}
        {!logsLoading &&
          logRole != null &&
          logRole != 5 &&
          !(logRole == 3 && value == "Courses") &&
          value !== "Assessments" &&
          logRole != 4 && (
            <button
              onClick={() => setAddNew(true)}
              className={`flex items-center gap-2 border ${Colors.border.specialThick} ${Colors.text.special} ${Colors.hover.special} cursor-pointer active:scale-95 px-3 py-2 rounded`}
            >
              <Plus size={18} />
              Add New {value}
            </button>
          )}

        {/* Bulk Upload (Students only) */}
        {value === "Students" &&
          !logsLoading &&
          logRole != null &&
          logRole != 5 &&
          logRole != 4 && (
            <>
              <button
                onClick={handleDownloadStudentFormat}
                className={`px-4 py-2 rounded-md ${Colors.hover.special} ${Colors.text.special} ${Colors.border.specialThick} cursor-pointer active:scale-95 transition-all`}
              >
                Download Format
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 border ${Colors.border.specialThick} ${Colors.text.special} ${Colors.hover.special} cursor-pointer active:scale-95 px-3 py-2 rounded`}
              >
                Upload Bulk
              </button>
            </>
          )}
      </div>
    </>
  );
};

export default Tabs;
