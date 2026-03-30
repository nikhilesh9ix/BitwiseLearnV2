import AssessmentBuilderV1 from "@/component/AssessmentBuilder/v1/AssessmentBuilderV1";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import SideBar from "@/component/general/SideBar";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const page = async ({ params }: PageProps) => {
  const { id } = await params;
  const Colors = getColors();

  return (
    <div className={`flex h-screen ${Colors.background.primary} overflow-hidden`}>
      <SideBar />
      <main className="flex-1 overflow-y-auto px-10 py-10">
        <AssessmentBuilderV1 assessmentId={id} />
      </main>
    </div>
  );
};

export default page;


