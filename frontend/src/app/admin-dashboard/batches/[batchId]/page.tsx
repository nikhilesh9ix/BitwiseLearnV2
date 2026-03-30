"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import BatchInfo from "@/component/Batch-info/BatchInfo";
import { getBatchData } from "@/api/batches/get-batch-by-id";
import { getColors } from "@/component/general/(Color Manager)/useColors";

export default function IndividualBatch() {
  const queryParams = useParams();
  const batchId = queryParams.batchId as string;
  const [batch, setBatch] = useState<any>(null);
  const Colors = getColors();
  useEffect(() => {
    if (!batchId) return;
    getBatchData(setBatch, batchId);
  }, [batchId]);

  if (!batchId) {
    return (
      <div className={`p-6 ${Colors.text.secondary}`}>
        Batch ID is required. Please provide ?id=batchId in the URL.
      </div>
    );
  }

  if (!batch) {
    return <div className={`p-6 ${Colors.text.secondary}`}>Loading...</div>;
  }

  return <BatchInfo batch={batch} institutionId={batch.institutionId} />;
}


