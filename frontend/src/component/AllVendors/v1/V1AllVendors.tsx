"use client";
import { getAllVendors } from "@/api/vendors/get-all-vendors";
import Filter from "@/component/general/Filter";
import SideBar from "@/component/general/SideBar";
import React, { useEffect, useState } from "react";
import DashboardInfo from "./DashboardInfo";
import { Plus } from "lucide-react";
import VendorForm from "./VendorForm";
import { createVendors } from "@/api/vendors/create-vendors";
import toast from "react-hot-toast";
import { getColors } from "@/component/general/(Color Manager)/useColors";

function V1AllVendors() {
  const [data, setData] = useState<any>([]);
  const [addNew, setAddNew] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  useEffect(() => {
    getAllVendors(setData);
  }, []);
  const handleCreateVendor = async (data: any) => {
    const toastId = toast.loading("Creating Vendor...");
    try {
      await createVendors(data);
      setAddNew(false);
      toast.success("Vendor Created Successfully", { id: toastId });
      await getAllVendors(setData);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error creating Vendor",
        { id: toastId },
      );
      // console.error(err);
    }
  };
  const Colors = getColors();
  return (
    <div className={`flex ${Colors.background.primary}`}>
      {addNew && (
        <VendorForm openForm={setAddNew} onSubmit={handleCreateVendor} />
      )}
      <div className="h-screen">
        <SideBar />
      </div>

      <div className="ml-10 mt-10 w-full">
        <div className="w-[80%] mx-auto mb-5 flex justify-between">
          <h1 className={`text-3xl ml-3 ${Colors.text.secondary}`}>
            Manage Vendors
          </h1>
          <button
            onClick={() => setAddNew(true)}
            className={`${Colors.text.special} flex gap-2 border-primaryBlue border p-2 rounded-xl cursor-pointer ${Colors.hover.special}`}
          >
            <Plus className={Colors.text.special} />
            Add Vendors
          </button>
        </div>
        <Filter data={data} setFilteredData={setFilteredData} />
        <DashboardInfo
          data={filteredData}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}

export default V1AllVendors;


