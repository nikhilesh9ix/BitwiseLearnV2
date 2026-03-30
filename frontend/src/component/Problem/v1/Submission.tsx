import { getAllProblemSubmission } from "@/api/problems/get-all-submission";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Code2, Clock, MemoryStick } from "lucide-react";
import { getColors } from "@/component/general/(Color Manager)/useColors";

interface Submission {
  id: string;
  status: "SUCCESS" | "FAILED";
  runtime: string;
  memory: string;
  failedTestCase?: string;
  code: string;
}

interface SubmissionProps {
  id: string;
}

function Submission({ id }: SubmissionProps) {
  const Colors = getColors();

  const [content, setContent] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!id) return;
    console.log(id);
    getAllProblemSubmission((data: Submission[]) => {
      setContent(data || []);
      setSelected(data.length > 0 ? 0 : null);
      setLoading(false);
    }, id);
  }, [id]);

  if (loading) {
    return (
      <div
        className={`h-full w-full flex items-center justify-center ${Colors.text.secondary}`}
      >
        Loading submissions…
      </div>
    );
  }

  const parseFailedCase = (raw?: string) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  if (content.length === 0) {
    return (
      <div
        className={`h-full w-full rounded-2xl ${Colors.border.fadedThin}
        ${Colors.background.secondary}
        flex flex-col items-center justify-center gap-2 p-5`}
      >
        <Code2 size={28} className={`${Colors.text.special} opacity-60`} />
        <p className={`text-lg font-semibold ${Colors.text.primary}`}>
          No submissions yet
        </p>
        <p className={`text-sm ${Colors.text.secondary}`}>
          Run or submit your code to see results here.
        </p>
      </div>
    );
  }

  const selectedSubmission = selected !== null ? content[selected] : null;

  return (
    <div
      className={`h-full w-full rounded-2xl ${Colors.border.fadedThin}
      bg-linear-to-b from-neutral-900 to-neutral-950 flex overflow-hidden`}
    >
      {/* Submission List */}
      <div className={`w-[35%] ${Colors.border.fadedRight}`}>
        <div
          className={`px-4 py-3 ${Colors.border.faded}
          text-sm font-semibold ${Colors.text.primary}`}
        >
          Submissions
        </div>

        <ul className="max-h-full overflow-y-auto">
          {content.map((item, index) => {
            const isSelected = selected === index;

            return (
              <li
                key={item.id}
                onClick={() => setSelected(index)}
                className={`
  px-4 py-3 cursor-pointer
  border-b ${Colors.border.faded}
  transition-all
  ${
    isSelected
      ? "bg-neutral-800/60 border-l-2 border-neutral-500"
      : "hover:bg-neutral-800/40"
  }
`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`
                      inline-flex items-center gap-1.5 text-xs px-2.5 py-1
                      rounded-full font-semibold
                      ${
                        item.status === "SUCCESS"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }
                    `}
                  >
                    {item.status === "SUCCESS" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {item.status}
                  </span>

                  <span className={`text-xs ${Colors.text.secondary}`}>
                    #{content.length - index}
                  </span>
                </div>

                <div
                  className={`flex justify-between text-xs ${Colors.text.secondary} mt-2`}
                >
                  <span>{item.runtime || "--"}</span>
                  <span>{item.memory.replace("MB", "KB") || "--"}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Submission Details */}
      <div className="w-[65%] flex flex-col">
        {selectedSubmission ? (
          <>
            {/* Header */}
            <div
              className={`
    px-4 py-3 flex items-center gap-6 text-sm
    ${Colors.background.primary}
    ${Colors.border.faded}
    backdrop-blur
  `}
            >
              <span
                className={`inline-flex items-center gap-2 font-semibold ${
                  selectedSubmission.status === "SUCCESS"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {selectedSubmission.status === "SUCCESS" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                {selectedSubmission.status}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 ${Colors.text.secondary}`}
              >
                <Clock size={14} />
                {selectedSubmission.runtime ?? "--"}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 ${Colors.text.secondary}`}
              >
                <MemoryStick size={14} />
                {selectedSubmission.memory.replace("MB", "KB") ?? "--"}
              </span>
            </div>

            {/* Failed test case */}
            {/* Failed test case */}
            {selectedSubmission.status === "FAILED" &&
              (() => {
                const failed = parseFailedCase(
                  selectedSubmission.failedTestCase,
                );

                return (
                  <div
                    className={`
          mx-4 mt-4 rounded-xl p-4 space-y-4
          border border-red-500/30
          bg-red-500/5
        `}
                  >
                    <div className="flex items-center gap-2 text-red-400 font-semibold">
                      <XCircle size={16} />
                      Failed Test Case
                    </div>

                    {failed?.input && (
                      <div>
                        <p className="text-xs text-red-300 mb-1">Input</p>
                        <pre className="rounded-md bg-black/30 p-2 text-xs font-mono text-red-200 whitespace-pre-wrap">
                          {failed.input}
                        </pre>
                      </div>
                    )}

                    {failed?.output && (
                      <div>
                        <p className="text-xs text-red-300 mb-1">
                          Expected Output
                        </p>
                        <pre className="rounded-md bg-black/30 p-2 text-xs font-mono text-green-300 whitespace-pre-wrap">
                          {failed.output}
                        </pre>
                      </div>
                    )}

                    {failed?.yourOutput && (
                      <div>
                        <p className="text-xs text-red-300 mb-1">Your Output</p>
                        <pre className="rounded-md bg-black/30 p-2 text-xs font-mono text-red-300 whitespace-pre-wrap">
                          {failed.yourOutput}
                        </pre>
                      </div>
                    )}

                    {failed?.stderr && (
                      <div>
                        <p className="text-xs text-red-400 mb-1">Error</p>
                        <pre className="rounded-md bg-red-950/40 p-2 text-xs font-mono text-red-400 whitespace-pre-wrap">
                          {failed.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Code */}
            <div
              className={`
    flex-1 mt-4 mx-4 mb-4 rounded-xl
    border border-neutral-700
    bg-black/60
    overflow-auto
  `}
            >
              <pre
                className={`
      p-4 text-sm font-mono
      text-neutral-200
      leading-relaxed
      whitespace-pre-wrap
    `}
              >
                {selectedSubmission.code}
              </pre>
            </div>
          </>
        ) : (
          <div
            className={`flex items-center justify-center h-full ${Colors.text.secondary}`}
          >
            Select a submission
          </div>
        )}
      </div>
    </div>
  );
}

export default Submission;


