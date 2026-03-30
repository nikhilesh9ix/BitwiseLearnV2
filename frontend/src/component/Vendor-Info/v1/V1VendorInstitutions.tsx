"use client";
import { getVendorInstitutions } from "@/api/institutions/get-institutions-by-vendor";
import Filter from "@/component/general/Filter";
import { useEffect, useState } from "react";
import DashboardInfo from "./DashboardInfo";
import { Plus } from "lucide-react";
import InstitutionForm from "./InstitutionForm";
import { createInstitution } from "@/api/institutions/create-institution";
import toast from "react-hot-toast";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type V1VendorInstitutionsProps = {
  vendorId: string;
};

function V1VendorInstitutions({ vendorId }: V1VendorInstitutionsProps) {
  const [data, setData] = useState<any>([]);
  const [addNew, setAddNew] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const Colors = getColors();

  useEffect(() => {
    getVendorInstitutions(setData, vendorId);
  }, [vendorId]);

  const handleCreateInstitution = async (data: any) => {
    try {
      await createInstitution(data);
      setAddNew(false);
      toast.success("Institute Created Successfully");
      getVendorInstitutions(setData, vendorId);
    } catch (err) {
      toast.error("Error creating Institute");
      // console.error(err);
    }
  };

  return (
    <div className="w-full">
      {addNew && (
        <InstitutionForm
          openForm={setAddNew}
          onSubmit={handleCreateInstitution}
        />
      )}

      <div className="w-full">
        <div className="w-full mb-5 flex justify-between">
          <h1 className={`text-3xl ml-3 ${Colors.text.primary}`}>Manage Institutions</h1>
          <button
            onClick={() => setAddNew(true)}
            className={`flex gap-2 ${Colors.text.special} ${Colors.border.specialThick} ${Colors.hover.special} p-2 rounded-lg cursor-pointer hover:opacity-80 active:scale-95 transition-all`}
          >
            <Plus className={`${Colors.text.special}`} />
            Add Institution
          </button>
        </div>
        <Filter data={data} setFilteredData={setFilteredData} />
        <DashboardInfo data={filteredData} />
      </div>
    </div>
  );
}

export default V1VendorInstitutions;


