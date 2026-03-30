import SideBar from "@/component/general/SideBar";
import AllListedQuestions from "./AllListedQuestions";
import OnGoingingCourses from "./OnGoingingCourses";
import QuestionInforSidebar from "./QuestionInforSidebar";
import StudentSideBar from "@/component/general/StudentSidebar";
import { getColors } from "@/component/general/(Color Manager)/useColors";


function V1AllComponents() {
  const Colors = getColors();

  return (
    <div className={`flex h-screen ${Colors.background.primary}`}>
      <StudentSideBar />
      <div className="w-full">
        <div className="flex gap-4">
          <OnGoingingCourses />
          <QuestionInforSidebar />
        </div>
        <AllListedQuestions />
      </div>
    </div>
  );
}

export default V1AllComponents;


