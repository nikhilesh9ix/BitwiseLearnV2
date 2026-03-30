"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Save, X, Trash, Upload, ArrowLeft } from "lucide-react";
import InfoBlock from "./InfoBlock";
import { updateEntity, deleteEntity } from "@/api/institutions/entity";
import { useRouter } from "next/navigation";
import { uploadBatches } from "@/api/batches/create-batches";
import toast from "react-hot-toast";
import useLogs from "@/lib/useLogs";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type BatchSidebarProps = {
  batch: any;
};
const Colors = getColors();

const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  const getOrdinalSuffix = (n: number): string => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
};

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1">
    <label className={`text-xs ${Colors.text.secondary}`}>{label}</label>
    <input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full ${Colors.background.secondary} ${Colors.border.defaultThick} rounded px-3 py-2 text-sm ${Colors.text.primary} focus:outline-none focus:ring-1 focus:ring-blue-500`}
    />
  </div>
);

const BatchSidebar = ({ batch }: BatchSidebarProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(batch);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { loading: logsLoading, role: logRole } = useLogs();
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      toast.loading("Uploading students...", { id: "bulk-upload" });

      const formData = new FormData();
      formData.append("file", file);

      await uploadBatches("", file, "CLOUD", null);

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
  useEffect(() => {
    if (logRole === null) return;
    if (logRole < 4) {
      setIsVisible(true);
    }
  }, [logRole]);
  useEffect(() => {
    setFormData(batch);
  }, [batch]);

  if (!batch) return null;

  const formattedDate = batch.createdAt ? formatDate(batch.createdAt) : "";

  const studentCount = batch?.students?.length ?? 0;

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    await updateEntity(
      formData.id,
      {
        entity: "batch",
        data: formData,
      },
      null,
    );
    setIsEditing(false);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this batch?")) {
      await deleteEntity(
        formData.id,
        {
          entity: "batch",
          data: "",
        },
        null,
      );
      router.push("/admin-dashboard/batches");
    }
  };

  return (
    <aside
      className={`w-[320px] ${Colors.background.secondary} ${Colors.text.primary} p-6 rounded-xl min-h-[93vh]`}
    >
      <div
        onClick={() => router.back()}
        className="flex gap-3 mb-4 cursor-pointer"
      >
        <ArrowLeft className="text-gray-400 text-md" />
        <span>Go Back</span>
      </div>
      <input
        type="file"
        accept=".csv,.xlsx"
        ref={fileInputRef}
        onChange={handleBulkUpload}
        hidden
      />
      {/* Header */}
      <div className="mb-4">
        {isEditing ? (
          <InputField
            label="Batch Name"
            value={formData.batchname}
            onChange={(v) => handleChange("batchname", v)}
          />
        ) : (
          <h1 className="text-2xl font-semibold">{batch.batchname}</h1>
        )}
      </div>

      {isEditing ? (
        <InputField
          label="Branch"
          value={formData.branch}
          onChange={(v) => handleChange("branch", v)}
        />
      ) : (
        <p className="text-sm text-gray-400 mb-6">{batch.branch}</p>
      )}

      {/* Content */}
      <div className="space-y-4 text-sm mt-6">
        {isEditing ? (
          <>
            <InputField
              label="End Year"
              value={formData.batchEndYear}
              onChange={(v) => handleChange("batchEndYear", v)}
            />

            <InfoBlock
              label="Institution"
              value={batch?.institution?.name ?? "—"}
            />

            <InfoBlock label="Number of Students" value={studentCount} />

            <InfoBlock label="Created At" value={formattedDate} />
          </>
        ) : (
          <>
            <InfoBlock
              label="Institution"
              value={batch?.institution?.name ?? "—"}
            />
            <InfoBlock label="End Year" value={batch.batchEndYear} />
            <InfoBlock label="Number of Students" value={studentCount} />
            <InfoBlock label="Created At" value={formattedDate} />
          </>
        )}
      </div>

      {/* Actions */}
      {!logsLoading && isVisible && (
        <>
          <div className="mt-8 flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded ${Colors.text.primary} ${Colors.background.special} ${Colors.hover.special} cursor-pointer active:scale-95`}
                >
                  <Save size={16} />
                  Save
                </button>

                <button
                  onClick={() => setIsEditing(false)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded ${Colors.text.special} ${Colors.border.specialThick} ${Colors.hover.special} cursor-pointer active:scale-95`}
                >
                  <X size={16} />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded ${Colors.text.primary} ${Colors.background.special} ${Colors.hover.special} cursor-pointer active:scale-95`}
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  onClick={handleDelete}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded text-red-500 border border-red-500 hover:bg-red-500/30 cursor-pointer active:scale-95`}
                >
                  <Trash size={16} />
                  Delete
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 mt-4 w-full flex items-center justify-center gap-2  px-4 py-2 rounded ${Colors.text.special} ${Colors.border.specialThick} ${Colors.hover.special} cursor-pointer active:scale-95`}
          >
            <Upload size={16} />
            upload cloud credentials
          </button>
        </>
      )}
    </aside>
  );
};

export default BatchSidebar;


