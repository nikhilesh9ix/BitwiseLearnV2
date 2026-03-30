"use client";

import { use, useState } from "react";
import InstitutionSidebar from "./InstitutionSidebar";
import { Tabs } from "./Tabs";
import { EntityList } from "./EntityList";
import { getColors } from "@/component/general/(Color Manager)/useColors";

type InstitutionInfoProps = {
  institution: any;
};

const InstitutionInfo = ({ institution }: InstitutionInfoProps) => {
  const [activeTab, setActiveTab] = useState("Teachers");
  const [refreshKey, setRefreshKey] = useState(0);
  const Colors = getColors();

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className={`min-h-screen ${Colors.background.primary} p-6`}>
      <div className="flex gap-6 max-w-screen mx-auto">
        {institution && <InstitutionSidebar
          institution={institution}
          onUpdate={() => { }}
          onDelete={() => { }}
        />}

        <main className="flex-1">
          {institution &&
            <>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                institutionId={institution.id}
                onBatchCreated={handleRefresh}
              />
              <EntityList
                key={refreshKey}
                type={activeTab}
                institutionId={institution.id}
              />
            </>
          }
        </main>
      </div>
    </div>
  );
};

export default InstitutionInfo;


