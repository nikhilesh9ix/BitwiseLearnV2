// Do optimization in Version 2 - Aayush Vats

"use client";

import { useEffect, useState } from "react";
import { User, Plus, X } from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { useTeacher } from "@/store/teacherStore";
import { getAllBatches } from "@/api/batches/get-all-batches";
import DashboardInfo from "@/component/AllBatches/v1/DashboardInfo";
import Filter from "@/component/general/Filter";
import BatchesForm from "@/component/general/BatchesForm";

type Batch = {
  id: string;
  batchname: string;
  branch: string;
  batchEndYear: string;
};

/* ---------------- HEADER ---------------- */

function Header() {
  const Colors = getColors();
  const teacher = useTeacher();

  if (!teacher.info) return null;

  const { name, email } = teacher.info.data;
  return (
    <div className="flex justify-between p-4">
      {/* Greeting */}
      <div>
        <h1 className="text-5xl font-semibold">
          <span className={Colors.text.special}>Greetings, </span>
          <span className={Colors.text.primary}>{name}</span>
        </h1>

        <p className={`mt-2 text-lg ${Colors.text.primary}`}>
          Enjoy managing{" "}
          <span className={Colors.text.special}>Bitwise Learn</span>
        </p>
      </div>

      {/* Profile */}
      <div className="flex items-center gap-4">
        <div className="p-6 rounded-full bg-white flex items-center justify-center">
          <User size={32} />
        </div>

        <div className="leading-tight">
          <p className={`text-2xl ${Colors.text.primary}`}>{name}</p>
          <p className={Colors.text.secondary}>{email}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- HERO SECTION ---------------- */

export default function HeroSection() {
  const teacher = useTeacher();
  const Colors = getColors();

  const institutionId = teacher.info?.data.institution.id;
  const [batches, setBatches] = useState<any[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<any[]>([]);

  const [addNew, setAddNew] = useState(false);

  const fetchBatches = () => {
    if (!institutionId) return;

    getAllBatches((data: Batch[]) => {
      setBatches(Array.isArray(data) ? data : []);
      setFilteredBatches(Array.isArray(data) ? data : []);
    }, institutionId);
  };

  useEffect(() => {
    fetchBatches();
  }, [institutionId]);

  const onBatchCreated = () => {
    fetchBatches();
    setAddNew(false);
  };

  return (
    <div className="space-y-8">
      {addNew && (
        <div
          className={`fixed inset-0 z-50 bg-black/80 ${Colors.text.primary} flex justify-center items-center`}
        >
          <div
            className={`relative ${Colors.background.secondary} p-8 rounded-lg w-full max-w-xl`}
          >
            <button
              onClick={() => setAddNew(false)}
              className={`absolute top-4 right-4 ${Colors.text.primary} cursor-pointer`}
            >
              <X />
            </button>

            <BatchesForm
              openForm={() => setAddNew(false)}
              institutionId={institutionId as string}
              onSubmit={() => {
                onBatchCreated();
              }}
            />
          </div>
        </div>
      )}

      <Header />

      <div className="flex flex-col gap-10 px-4">
        <div className="flex flex-col gap-3">
          <h1 className={`${Colors.text.special} text-3xl font-semibold`}>
            Batches
          </h1>
          <div className="flex justify-between items-center">
            <Filter data={batches} setFilteredData={setFilteredBatches} />
            <button
              onClick={() => setAddNew(true)}
              className={`flex items-center gap-2 ${Colors.border.specialThick} px-3 py-2 rounded-md ${Colors.text.special} ${Colors.hover.special} cursor-pointer active:scale-95 transition whitespace-nowrap shrink-0`}
            >
              <Plus size={18} />
              Add New Batch
            </button>
          </div>
        </div>
        <DashboardInfo data={filteredBatches} />
      </div>
    </div>
  );
}


