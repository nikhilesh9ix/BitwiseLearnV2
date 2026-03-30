"use client";

import { useEffect, useState } from "react";
import { User, Plus } from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import useVendor from "@/store/vendorStore";
import { getVendorDashboard } from "@/api/vendors/get-vendor-dashboard";
import { getAllInstitutions } from "@/api/institutions/get-all-institutions";
import { getVendorInstitutions } from "@/api/institutions/get-institutions-by-vendor";
import DashboardInfo from "@/component/AllInstitutions/v1/DashboardInfo";
import Filter from "@/component/general/Filter";
import InstitutionForm from "@/component/AllInstitutions/v1/InstitutionForm";
import { createInstitution } from "@/api/institutions/create-institution";
import toast from "react-hot-toast";

function Header({ name, email, tagline }: any) {
  const Colors = getColors();

  return (
    <div className="flex justify-between p-4">
      <div>
        <span className={`text-5xl ${Colors.text.special}`}>Greetings,</span>{" "}
        <span className={`text-5xl ${Colors.text.primary}`}>{name}</span>
        <div className="mt-2 text-lg">
          <span className={Colors.text.primary}>
            {tagline || "Welcome back to your dashboard"}
          </span>
        </div>
      </div>

      <div className="flex mr-11 items-center gap-6">
        <div className="p-6 bg-white rounded-full">
          <User size={32} />
        </div>

        <div>
          <h1 className={`${Colors.text.primary} text-2xl font-semibold`}>
            {name}
          </h1>
          <p className={Colors.text.secondary}>{email}</p>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const Colors = getColors();
  const vendor = useVendor();
  const setVendor = useVendor((s) => s.setData);

  const [institutionData, setInstitutionData] = useState<any>([]);
  const [filteredData, setFilteredData] = useState<any>([]);
  const [addNew, setAddNew] = useState(false);
  const vendorId = vendor?.info?.data?.id || "";

  useEffect(() => {
    if (!vendor) {
      getVendorDashboard(setVendor);
    }
  }, []);

  useEffect(() => {
    if (vendorId) {
      getVendorInstitutions(setInstitutionData, vendorId as string);
    }
  }, [vendorId]);

  const handleCreateInstitution = async (data: any) => {
    const toastId = toast.loading("Creating Institute...");

    try {
      const res = await createInstitution(data);
      console.log(res);
      setAddNew(false);
      toast.success("Institute Created Successfully", { id: toastId });
      await getVendorInstitutions(setInstitutionData, vendorId as string);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Error creating Institute",
        { id: toastId },
      );
      console.error(err);
    }
  };

  if (!vendor) {
    return <div className="p-10">Loading dashboard...</div>;
  }

  return (
    <>
      {addNew && (
        <InstitutionForm
          openForm={setAddNew}
          onSubmit={handleCreateInstitution}
        />
      )}

      <Header
        name={vendor.info?.data.name}
        email={vendor.info?.data.email}
        tagline={vendor.info?.data.tagline}
      />

      <div className="p-10 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-2xl font-semibold ${Colors.text.special}`}>
            Institutions
          </h2>

          <button
            onClick={() => setAddNew(true)}
            className={`flex gap-2 border p-2 rounded-xl ${Colors.text.special} ${Colors.border.default} ${Colors.hover.special} cursor-pointer`}
          >
            <Plus />
            Add Institution
          </button>
        </div>

        <div className="flex flex-col gap-10">
          <Filter data={institutionData} setFilteredData={setFilteredData} />
          <DashboardInfo data={filteredData} />
        </div>
      </div>
    </>
  );
}


