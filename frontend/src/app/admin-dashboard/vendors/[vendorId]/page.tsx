"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import VendorInfo from "@/component/Vendor-Info/VendorInfo";
import { getVendorData } from "@/api/vendors/get-vendor-by-id";
import { getColors } from "@/component/general/(Color Manager)/useColors";

export default function IndividualVendor() {
  const queryParams = useParams();
  const vendorId = queryParams.vendorId as string;
  const [vendor, setVendor] = useState<any>(null);
  const Colors = getColors();

  useEffect(() => {
    if (!vendorId) return;
    getVendorData(setVendor, vendorId);
  }, [vendorId]);

  if (!vendorId) {
    return (
      <div className={`p-6 ${Colors.text.secondary}`}>
        Vendor ID is required. Please provide vendorId in the URL.
      </div>
    );
  }

  if (!vendor) {
    return <div className={`p-6 ${Colors.text.secondary}`}>Loading...</div>;
  }

  return <VendorInfo vendor={vendor} />;
}



