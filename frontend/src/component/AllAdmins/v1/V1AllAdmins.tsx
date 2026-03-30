"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import { getColors } from "@/component/general/(Color Manager)/useColors";
import { getAllAdmins, type AdminListItem } from "@/api/admins/get-all-admins";
import {
  createAdmin,
  type CreateAdminPayload,
} from "@/api/admins/create-admin";
import Filter from "@/component/general/Filter";
import SideBar from "@/component/general/SideBar";
import DashboardInfo from "./DashboardInfo";
import AdminForm from "./AdminForm";

const Colors = getColors();

function V1AllAdmins() {
  const [data, setData] = useState<AdminListItem[]>([]);
  const [addNew, setAddNew] = useState(false);
  const [filteredData, setFilteredData] = useState<AdminListItem[]>([]);

  useEffect(() => {
    void getAllAdmins(setData);
  }, []);

  const handleCreateAdmin = async (payload: CreateAdminPayload) => {
    const toastId = toast.loading("Creating Admin...");

    try {
      await createAdmin(payload);
      setAddNew(false);
      toast.success("Admin Created Successfully", { id: toastId });
      await getAllAdmins(setData);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error creating Admin";
      toast.error(message, { id: toastId });
    }
  };

  return (
    <div className={`flex ${Colors.background.primary}`}>
      {addNew && (
        <AdminForm openForm={setAddNew} onSubmit={handleCreateAdmin} />
      )}

      <div className="h-screen">
        <SideBar />
      </div>

      <div className="ml-10 mt-10 w-full">
        <div className="w-[80%] mx-auto mb-5 flex justify-between">
          <h1 className={`text-3xl ml-3 ${Colors.text.secondary}`}>
            Manage Admins
          </h1>
          <button
            onClick={() => setAddNew(true)}
            className={`${Colors.text.special} flex gap-2 border-primaryBlue border p-2 rounded-xl cursor-pointer ${Colors.hover.special} transition`}
          >
            <Plus className={Colors.text.special} />
            Add Admins
          </button>
        </div>
        <Filter data={data} setFilteredData={setFilteredData} />
        <DashboardInfo data={filteredData} />
      </div>
    </div>
  );
}

export default V1AllAdmins;


