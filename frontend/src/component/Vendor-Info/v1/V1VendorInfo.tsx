"use client";

import VendorSidebar from "./VendorSidebar";
import VendorInstitutions from "../VendorInstitutions";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type VendorInfoProps = {
    vendor: any;
};

const V1VendorInfo = ({ vendor }: VendorInfoProps) => {
    const Colors = getColors();
    return (
        <div className={`min-h-screen ${Colors.background.primary} p-6`}>
            <div className="flex gap-6 max-w-screen mx-auto">
                <VendorSidebar vendor={vendor} />

                <main className="flex-1">
                    <VendorInstitutions vendorId={vendor.id} />
                </main>
            </div>
        </div>
    );
};

export default V1VendorInfo;



