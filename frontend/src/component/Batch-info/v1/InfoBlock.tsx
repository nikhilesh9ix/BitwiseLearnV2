import { getColors } from "@/component/general/(Color Manager)/useColors";

const Colors = getColors();
const InfoBlock = ({ label, value }: any) => (
  <div>
    <p className="text-yellow-400 text-sm mb-1">{label}</p>
    <p className={` break-words ${Colors.text.secondary}`}>{value}</p>
  </div>
);
export default InfoBlock;


