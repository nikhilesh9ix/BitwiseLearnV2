"use client";

import React, { useState } from "react";
import { X, Pencil, Trash2 } from "lucide-react";
import { deleteEntity, updateEntity } from "@/api/institutions/entity";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import toast from "react-hot-toast";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
};

type UpdatePayload = {
  entity: "admins";
  data: UserData;
};

type DeletePayload = {
  entity: "admins";
  id: string;
};

type Props = {
  data: UserData[];
};

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function formatValue(value: any) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && value.includes("T")) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date.toLocaleString();
  }
  return String(value);
}

export default function DashboardInfo({ data }: Props) {
  const [selected, setSelected] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserData | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const Colors = getColors();

  /* ------------------ HANDLERS ------------------ */

  const handleEdit = () => {
    if (!selected) return;
    setFormData(selected);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(null);
  };

  const handleSubmit = async () => {
    setIsDisabled(true);
    try {
      if (!formData) return;

      await updateEntity(
        formData.id,
        {
          data: formData,
          entity: "admin",
        },
        null,
      );
      setIsDisabled(false);
      setSelected(formData);
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      toast.error("Unable to update");
    }
  };

  const handleDelete = async () => {
    try {
      if (!selected) return;
      await deleteEntity(
        selected.id,
        {
          entity: "admin",
          data: "",
        },
        null,
      );

      setSelected(null);
      setIsEditing(false);
      window.location.reload();
    } catch (error) {}
  };

  const handleChange = (key: keyof UserData, value: string) => {
    if (!formData) return;
    setFormData({ ...formData, [key]: value });
  };

  /* --------------------------------------------- */

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className={`py-12 text-center text-sm ${Colors.text.secondary}`}>
        No users found
      </div>
    );
  }

  return (
    <>
      {/* Table */}
      <div
        className={`mx-auto max-w-3/4 overflow-y-auto ${Colors.border.defaultThick} rounded-lg ${Colors.background.secondary} shadow-lg`}
      >
        <table className="w-full">
          <thead className={`${Colors.background.primary}`}>
            <tr
              className={`text-left text-[11px] font-semibold uppercase tracking-wide ${Colors.text.primary}`}
            >
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {data.map((user) => (
              <tr
                key={user.id}
                className={`text-sm ${Colors.text.primary} transition hover:bg-primaryBlue/10`}
              >
                <td className={`px-6 py-4 font-medium ${Colors.text.primary}`}>
                  {user.name}
                </td>

                <td className={`px-6 py-4 ${Colors.text.secondary}`}>
                  {user.email}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`rounded-md bg-primaryBlue/20 px-2 py-1 text-xs font-semibold ${Colors.text.special}`}
                  >
                    {user.role}
                  </span>
                </td>

                <td className={`px-6 py-4 ${Colors.text.secondary}`}>
                  {formatDate(user.createdAt)}
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setSelected(user);
                      setIsEditing(false);
                    }}
                    className={`rounded-md border border-primaryBlue/40 px-3 py-1.5 text-xs font-medium ${Colors.text.special} transition hover:bg-primaryBlue/20 cursor-pointer`}
                  >
                    See details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-xl rounded-2xl border border-white/10 ${Colors.background.secondary} p-6 shadow-2xl`}
          >
            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              className={`absolute right-4 top-4 ${Colors.text.primary} transition hover:text-red-500 cursor-pointer`}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="mb-6 mt-6 flex items-start justify-between gap-4">
              <div>
                <h2 className={`text-xl font-semibold ${Colors.text.primary}`}>
                  User Details
                </h2>
                <p className={`mt-1 text-sm ${Colors.text.secondary}`}>
                  ID: {selected.id}
                </p>
              </div>
              {/* Actions */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      disabled={isDisabled}
                      onClick={handleSubmit}
                      className={`rounded-md ${Colors.background.special} px-4 py-1.5 text-xs font-semibold ${Colors.text.primary} hover:opacity-90 cursor-pointer`}
                    >
                      Save
                    </button>

                    <button
                      onClick={handleCancel}
                      className={`rounded-md border border-white/20 px-4 py-1.5 text-xs ${Colors.text.secondary} ${Colors.hover.textSpecial} cursor-pointer`}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1 rounded-md border border-primaryBlue/40 px-3 py-1.5 text-xs font-medium text-primaryBlue transition hover:bg-primaryBlue/20 cursor-pointer"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1 rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="grid max-h-[60vh] grid-cols-1 gap-x-6 gap-y-5 overflow-y-auto pr-2 sm:grid-cols-2">
              {Object.entries(isEditing ? formData! : selected).map(
                ([key, value]) => {
                  const isReadonly =
                    key === "id" ||
                    key === "createdAt" ||
                    key === "updatedAt" ||
                    key === "role";

                  return (
                    <div key={key}>
                      <p
                        className={`mb-1 mt-2 text-[11px] uppercase tracking-wide ${Colors.text.special}`}
                      >
                        {key.replace(/_/g, " ")}
                      </p>

                      {isEditing && !isReadonly ? (
                        <input
                          value={(formData as any)[key] ?? ""}
                          onChange={(e) =>
                            handleChange(key as keyof UserData, e.target.value)
                          }
                          className={`w-full rounded-md border border-white/10 ${Colors.background.primary} px-3 py-2 text-sm ${Colors.text.primary} focus:outline-none focus:ring-1 focus:ring-primaryBlue`}
                        />
                      ) : (
                        <p
                          className={`break-words text-sm ${Colors.text.primary}`}
                        >
                          {formatValue(value)}
                        </p>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


