import React from "react";
import CodeCompiler from "./CodeCompiler";
import SideBar from "@/component/general/SideBar";

function CompilerV1() {
  return (
    <div className="flex h-screen w-full bg-[#0f0f0f] text-white">
      <SideBar />
      <div className="w-full">
        <CodeCompiler />
      </div>
    </div>
  );
}

export default CompilerV1;
