import Assessments from "@/component/Assessments/Assessments";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import SideBar from "@/component/general/SideBar";

const page = () => {
  const Colors = getColors();
  return (
    <div className="flex h-screen overflow-hidden ">
      <SideBar />
      <main className={`flex-1 overflow-y-auto px-10 py-10 ${Colors.background.primary}`}>
        <Assessments />
      </main>
    </div>
  );
};

export default page;


