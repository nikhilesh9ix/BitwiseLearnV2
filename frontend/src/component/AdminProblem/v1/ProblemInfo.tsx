"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/component/ui/tabs";
import AllTestCases from "./AllTestCases";
import Solution from "./Solution";
import Submissions from "./Submissions";
import Templates from "./Templates";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function ProblemInfo({ content }: any) {
  const Colors = getColors();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "solution";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  return (
    <div className={`w-full ${Colors.background.primary}`}>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col h-full"
      >
        <TabsList
          className={` w-full ${Colors.border.defaultThin} ${Colors.background.secondary} ${Colors.text.primary} px-4`}
        >
          <TabsTrigger className="cursor-pointer" value="solution">
            Solution
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="general">
            Problem
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="testcases">
            Testcases
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="templates">
            Templates
          </TabsTrigger>
        </TabsList>

        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            //@ts-ignore
            WebkitScrollbar: { display: "none" },
          }}
        >
          <TabsContent value="testcases">
            <AllTestCases />
          </TabsContent>
          <TabsContent value="solution">
            <Solution />
          </TabsContent>
          <TabsContent value="general">
            <Submissions content={content} />
          </TabsContent>
          <TabsContent value="templates">
            <Templates />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default ProblemInfo;


