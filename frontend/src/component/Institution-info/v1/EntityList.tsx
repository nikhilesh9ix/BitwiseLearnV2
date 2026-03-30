"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Pencil, Save, Trash } from "lucide-react";

import { getAllTeachers } from "@/api/teachers/get-all-teachers";
import { getAllBatches } from "@/api/batches/get-all-batches";

import { getAllVendors } from "@/api/vendors/get-all-vendors";
import { deleteEntity, updateEntity } from "@/api/institutions/entity";
import { getTeacherByInstitute } from "@/api/teachers/get-teachers-by-institute";
import { getColors } from "@/component/general/(Color Manager)/useColors";
type EntityListProps = {
  type: string;
  institutionId?: string;
};

const Colors = getColors();

export const EntityList = ({ type, institutionId }: EntityListProps) => {
  const router = useRouter();

  const [entities, setEntities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  /* ----------------------------- Helpers ----------------------------- */

  const isEditableEntity = type === "Teachers";

  const backendEntityType = type === "Teachers" ? "teacher" : null;

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString() : "—";

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string" && value.includes("T")) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toLocaleString();
    }
    return String(value);
  };

  /* ----------------------------- Fetch ----------------------------- */

  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      try {
        switch (type) {
          case "Teachers":
            await getTeacherByInstitute((data: any) => {
              setEntities(Array.isArray(data) ? data : []);
            }, institutionId as string);
            break;
          case "Batches":
            await getAllBatches((data: any) => {
              setEntities(Array.isArray(data) ? data : []);
            }, institutionId as string);
            break;
          default:
            setEntities([]);
        }
      } catch (err) {
        // console.error(err);
        setEntities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, institutionId]);

  /* ----------------------------- Filtering ----------------------------- */

  const filteredEntities = useMemo(() => {
    if (!searchQuery) return entities;

    return entities.filter((entity) => {
      const q = searchQuery.toLowerCase();

      if (type === "Teachers")
        return (
          entity.name?.toLowerCase().includes(q) ||
          entity.email?.toLowerCase().includes(q)
        );

      if (type === "Batches")
        return (
          entity.batchname?.toLowerCase().includes(q) ||
          entity.branch?.toLowerCase().includes(q)
        );

      return true;
    });
  }, [entities, searchQuery, type]);

  /* ----------------------------- Actions ----------------------------- */

  const handleSeeDetails = (entity: any) => {
    if (type === "Batches") {
      router.push(`/admin-dashboard/batches/${entity.id || entity._id}`);
      return;
    }

    setSelectedEntity(entity);
    setEditData(entity);
    setIsEditing(false);
  };

  const handleEditChange = (key: string, value: string) => {
    setEditData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    if (!backendEntityType) return;

    await updateEntity(
      selectedEntity.id || selectedEntity._id,
      { entity: backendEntityType, data: editData },
      null,
    );

    setEntities((prev) =>
      prev.map((e) =>
        (e.id || e._id) === (editData.id || editData._id) ? editData : e,
      ),
    );

    setSelectedEntity(editData);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!backendEntityType || !selectedEntity) return;

    const ok = confirm("Are you sure you want to delete?");
    if (!ok) return;

    await deleteEntity(
      selectedEntity.id || selectedEntity._id,
      { entity: backendEntityType, data: "" },
      null,
    );

    setEntities((prev) =>
      prev.filter(
        (e) => (e.id || e._id) !== (selectedEntity.id || selectedEntity._id),
      ),
    );

    setSelectedEntity(null);
  };

  /* ----------------------------- Render ----------------------------- */

  return (
    <>
      <div className="rounded-xl p-4 mr-4">
        <input
          placeholder={`Search ${type.toLowerCase()}`}
          className={`w-full mb-4 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-primaryBlue ${Colors.background.secondary} ${Colors.text.primary}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {loading ? (
          <div className={`py-12 text-center ${Colors.text.secondary}`}>
            Loading...
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className={`py-12 text-center ${Colors.text.secondary}`}>
            No {type.toLowerCase()} found
          </div>
        ) : (
          <div
            className={`border ${Colors.border.defaultThick} ${Colors.background.secondary} rounded-lg overflow-hidden`}
          >
            <table className="w-full">
              <thead
                className={`${Colors.background.primary} text-xs ${Colors.text.primary}`}
              >
                <tr>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEntities.map((entity) => (
                  <tr key={entity.id || entity._id}>
                    <td
                      className={`px-6 py-4  font-medium ${Colors.text.primary}`}
                    >
                      {entity.name || entity.batchname}
                    </td>
                    <td className={`px-6 py-4 ${Colors.text.secondary}`}>
                      {formatDate(entity.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSeeDetails(entity)}
                        className={`border border-primaryBlue/40 px-3 py-1.5 text-xs ${Colors.text.special} hover:bg-primaryBlue/20 cursor-pointer`}
                      >
                        See details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== MODAL ===================== */}
      {selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className={`relative w-full max-w-xl ${Colors.background.primary} p-6 rounded-xl`}
          >
            <button
              onClick={() => setSelectedEntity(null)}
              className={`absolute right-4 top-4 ${Colors.text.secondary} cursor-pointer hover:text-red-700`}
            >
              <X />
            </button>

            <h2 className={`text-xl font-semibold mb-6 ${Colors.text.primary}`}>
              {type} Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {Object.entries(isEditing ? editData : selectedEntity)
                .filter(
                  ([key]) =>
                    ![
                      "_id",
                      "id",
                      "teacherId",
                      "batchId",
                      "institutionId",
                      "vendorId",
                      "instituteId",
                    ].includes(key),
                )
                .map(([key, value]) => (
                  <div key={key}>
                    <p
                      className={`text-xs uppercase ${Colors.text.special} mb-1`}
                    >
                      {key}
                    </p>
                    {isEditing ? (
                      <input
                        value={String(value ?? "")}
                        onChange={(e) => handleEditChange(key, e.target.value)}
                        className={`w-full ${Colors.background.secondary} border border-white/10 px-3 py-2 text-sm ${Colors.text.primary} rounded`}
                      />
                    ) : (
                      <p className={`text-sm ${Colors.text.primary}`}>
                        {formatValue(value)}
                      </p>
                    )}
                  </div>
                ))}
            </div>

            {isEditableEntity && (
              <div className="mt-6 flex justify-end gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleUpdate}
                      className={`flex items-center gap-2 bg-green-600 px-4 py-2 rounded text-sm ${Colors.text.primary} cursor-pointer`}
                    >
                      <Save size={16} /> Save
                    </button>
                    <button
                      onClick={() => {
                        setEditData(selectedEntity);
                        setIsEditing(false);
                      }}
                      className={`flex items-center gap-2 ${Colors.text.primary} border border-white px-4 py-2 rounded text-sm cursor-pointer`}
                    >
                      <X size={16} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`flex items-center gap-2 ${Colors.background.special} px-4 py-2 rounded text-sm ${Colors.text.primary} cursor-pointer`}
                    >
                      <Pencil size={16} /> Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className={`flex items-center gap-2 ${Colors.text.primary} ${Colors.border.defaultThin} px-4 py-2 rounded text-sm cursor-pointer`}
                    >
                      <Trash size={16} /> Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};


