import { useEffect, useState } from "react";
import { Pencil, Save, X, Trash, ArrowLeft } from "lucide-react";
import InfoBlock from "./InfoBlock";
import { deleteEntity, updateEntity } from "@/api/institutions/entity";
import { useRouter } from "next/navigation";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type VendorSidebarProps = {
  vendor: {
    id: string;
    name: string;
    tagline?: string;
    websiteLink?: string;
    email?: string;
    phoneNumber?: string;
    createdAt?: string | Date;
    [key: string]: unknown;
  };
};

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
  labelClassName,
  inputClassName,
}: {
  label: string;
  value: string;
  placeholder?: string;
  labelClassName: string;
  inputClassName: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1">
    <label className={`text-xs ${labelClassName}`}>{label}</label>
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full ${inputClassName} rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
    />
  </div>
);

const VendorSidebar = ({ vendor }: VendorSidebarProps) => {
  const Colors = getColors();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(vendor);
  const router = useRouter();
  useEffect(() => {
    setFormData(vendor);
  }, [vendor]);

  const formattedDate = vendor.createdAt ? formatDate(vendor.createdAt) : "";

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    await updateEntity(
      formData.id,
      {
        entity: "vendor",
        data: formData,
      },
      null,
    );
    window.location.reload();
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      await deleteEntity(
        formData.id,
        {
          entity: "vendor",
          data: "",
        },
        null,
      );
      router.push("/admin-dashboard/vendors");
    }
  };

  return (
    <aside
      className={`w-[320px] ${Colors.background.secondary} ${Colors.text.primary} p-6 rounded-xl min-h-[93vh]`}
    >
      {/* Header */}
      <div
        onClick={() => router.back()}
        className="flex gap-3 mb-4 cursor-pointer"
      >
        <ArrowLeft className="text-gray-400 text-md" />
        <span>Go Back</span>
      </div>
      <div className="mb-4">
        {isEditing ? (
          <InputField
            label="Institution Name"
            value={formData.name}
            onChange={(v) => handleChange("name", v)}
            labelClassName={Colors.text.secondary}
            inputClassName={`${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.text.primary}`}
          />
        ) : (
          <h1 className="text-2xl font-semibold">{vendor.name}</h1>
        )}
      </div>
      {isEditing ? (
        <>
          <textarea
            name="tagline"
            value={formData.tagline || ""}
            onChange={(e) => handleChange("tagline", e.target.value)}
            placeholder="Enter tagline"
            className={`w-full ${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.text.primary} rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none`}
            rows={2}
          />
        </>
      ) : (
        <p className={`text-sm ${Colors.text.secondary} mb-6`}>
          {vendor.tagline || "—"}
        </p>
      )}

      {/* Content */}
      <div className="space-y-4 text-sm mt-6">
        {isEditing ? (
          <>
            <InputField
              label="Website Link"
              value={formData.websiteLink || ""}
              onChange={(v) => handleChange("websiteLink", v)}
              labelClassName={Colors.text.secondary}
              inputClassName={`${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.text.primary}`}
            />
            <InputField
              label="Email"
              value={formData.email || ""}
              onChange={(v) => handleChange("email", v)}
              labelClassName={Colors.text.secondary}
              inputClassName={`${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.text.primary}`}
            />
            <InputField
              label="Contact Number"
              value={formData.phoneNumber || ""}
              onChange={(v) => handleChange("phoneNumber", v)}
              labelClassName={Colors.text.secondary}
              inputClassName={`${Colors.background.primary} ${Colors.border.defaultThick} ${Colors.text.primary}`}
            />

            <InfoBlock label="Member Since" value={formattedDate} />
          </>
        ) : (
          <>
            <InfoBlock label="Website Link" value={vendor.websiteLink || "—"} />
            <InfoBlock label="Email" value={vendor.email || "—"} />
            <InfoBlock
              label="Contact number"
              value={vendor.phoneNumber || "—"}
            />
            <InfoBlock label="Member Since" value={formattedDate} />
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-3">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded cursor-pointer hover:opacity-80 active:scale-95 transition-all"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded cursor-pointer hover:opacity-80 active:scale-95 transition-all"
            >
              <X size={16} />
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded cursor-pointer hover:opacity-80 active:scale-95 transition-all"
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className={`flex-1 flex items-center justify-center gap-2 ${Colors.text.primary} ${Colors.background.primary} px-4 py-2 rounded cursor-pointer hover:opacity-80 active:scale-95 transition-all`}
            >
              <Trash size={16} />
              Delete
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

export default VendorSidebar;


