"use client";
import { getAllInstitutions } from "@/api/institutions/get-all-institutions";
import Filter from "@/component/general/Filter";
import SideBar from "@/component/general/SideBar";
import { useEffect, useState } from "react";
import DashboardInfo from "./DashboardInfo";
import { Plus } from "lucide-react";
import InstitutionForm from "./InstitutionForm";
import { createInstitution } from "@/api/institutions/create-institution";
import toast from "react-hot-toast";
import { getColors } from "@/component/general/(Color Manager)/useColors";

function V1AllInstitutions() {
  const [data, setData] = useState<any>([]);
  const [addNew, setAddNew] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const Colors = getColors();
  useEffect(() => {
    getAllInstitutions(setData);
  }, []);

  const handleCreateInstitution = async (data: any) => {
    const toastId = toast.loading("Creating Institute...");

    try {
      const res = await createInstitution(data);
      setAddNew(false);
      toast.success("Institute Created Successfully", { id: toastId });
      await getAllInstitutions(setData);
      setAddNew(false);
      toast.success("Institute Created Successfully");
      await getAllInstitutions(setData);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Error creating Institute",
        { id: toastId },
      );
      // console.error(err);
    }
  };

  return (
    <div className={`flex ${Colors.background.primary}`}>
      {addNew && (
        <InstitutionForm
          openForm={setAddNew}
          onSubmit={handleCreateInstitution}
        />
      )}
      <div className="h-screen">
        <SideBar />
      </div>

      <div className="ml-10 mt-10 w-full">
        <div className="w-[80%] mx-auto mb-5 flex justify-between">
          <h1 className={`text-3xl ml-3 ${Colors.text.primary}`}>
            Manage Institutions
          </h1>
          <button
            onClick={() => setAddNew(true)}
            className={`text-primaryBlue flex gap-2 border-primaryBlue border p-2 rounded-xl ${Colors.text.primary} ${Colors.border.fadedThin} ${Colors.hover.special} cursor-pointer`}
          >
            <Plus className="text-primaryBlue" />
            Add Institution
          </button>
        </div>
        <Filter data={data} setFilteredData={setFilteredData} />
        <DashboardInfo data={filteredData} />
      </div>
    </div>
  );
}

export default V1AllInstitutions;


