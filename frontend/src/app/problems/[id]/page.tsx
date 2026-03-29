"use client";
import { getProblemData } from "@/api/problems/get-individual-problem";
import Problem from "@/component/Problem/Problem";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function page() {
  const [data, setData] = useState({});
  const params = useParams();

  useEffect(() => {
    const problemId = params?.id;
    if (typeof problemId === "string" && problemId.length > 0) {
      getProblemData(setData, problemId);
    }
  }, [params?.id]);

  return (
    <div className="w-full h-screen">
      <Problem data={data} />
    </div>
  );
}

export default page;
