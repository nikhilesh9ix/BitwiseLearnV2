"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import InstitutionInfo from "@/component/Institution-info/InstitutionInfo";
import { getInstituteData } from "@/api/institutions/get-institute-by-id";
import { getColors } from "@/component/general/(Color Manager)/useColors";

export default function IndividualInstitution() {
  const queryParams = useParams();
  const institutionId = queryParams.institutionId as string;
  const [institution, setInstitution] = useState<any>(null);
  useEffect(() => {
    if (!institutionId) return;
    getInstituteData(setInstitution, institutionId);
  }, [institutionId]);
  const Colors = getColors();

  if (!institutionId) {
    return (
      <div className={`p-6 ${Colors.text.secondary}`}>
        Institution ID is required. Please provide ?id=institutionId in the URL.
      </div>
    );
  }

  if (!institution) {
    return <div className={`p-6 ${Colors.text.secondary}`}>Loading...</div>;
  }

  return <InstitutionInfo institution={institution} />;
}


