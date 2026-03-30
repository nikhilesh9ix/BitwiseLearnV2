import { createTopic } from "@/api/problems/create-topic";
import { updateDescription } from "@/api/problems/update-problem";
import { useTheme } from "@/component/general/(Color Manager)/ThemeController";
import { getColors } from "@/component/general/(Color Manager)/useColors";
import MarkdownEditor from "@/component/ui/MarkDownEditor";
import { X } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type SubmissionsProps = {
  content: any;
};

function Submissions({ content }: SubmissionsProps) {
  if (!content) return null;
  const param = useParams();
  const Colors = getColors();
  /* ---------------- STATE ---------------- */
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(content.name);
  const [description, setDescription] = useState<string>(content.description);
  const [difficulty, setDifficulty] = useState(content.difficulty);
  const [hints, setHints] = useState<string[]>(content.hints || []);
  const [topics, setTopics] = useState<string[]>(
    content.problemTopics?.[0]?.tagName || [],
  );
  const [newTopic, setNewTopic] = useState("");

  /* ---------------- HELPERS ---------------- */
  const resetChanges = () => {
    setName(content.name);
    setDescription(content.description);
    setDifficulty(content.difficulty);
    setHints(content.hints || []);
    setTopics(content.problemTopics?.[0]?.tagName || []);
  };

  const updateHint = (index: number, value: string) => {
    const updated = [...hints];
    updated[index] = value;
    setHints(updated);
  };

  const addHint = () => setHints([...hints, ""]);
  const removeHint = (index: number) =>
    setHints(hints.filter((_, i) => i !== index));

  const addTopic = () => {
    if (!newTopic.trim() || topics.includes(newTopic.trim())) return;
    setTopics([...topics, newTopic.trim()]);
    setNewTopic("");
  };

  const removeTopic = (tag: string) =>
    setTopics(topics.filter((t) => t !== tag));

  const handleSave = async () => {
    setIsSaving(true);

    for (let i = 0; i < hints.length; i++) {
      if (hints[i].trim().length === 0) {
        toast.error("dont add an empty hint");
        return;
      }
    }

    const updatedData = {
      name,
      description,
      difficulty,
      hints,
      problemTopics: [
        {
          ...content.problemTopics?.[0],
          tagName: topics,
        },
      ],
    };
    console.log(content);
    await updateDescription(content.id as string, updatedData);

    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 500);
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${Colors.text.primary} space-y-6`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        {isEditing ? (
          <input
            className={`text-3xl font-bold ${Colors.background.secondary} rounded-md px-3 py-2 focus:outline-none`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          <h1 className="text-3xl font-bold">{name}</h1>
        )}

        <div className="flex gap-3 items-center">
          {isEditing ? (
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={` px-3 py-1 rounded-md ${Colors.background.secondary} ${Colors.text.primary} cursor-pointer`}
            >
              <option className="cursor-pointer" value="EASY">
                EASY
              </option>
              <option className="cursor-pointer" value="MEDIUM">
                MEDIUM
              </option>
              <option className="cursor-pointer" value="HARD">
                HARD
              </option>
            </select>
          ) : (
            <span
              className={`${Colors.background.secondary} ${Colors.text.primary} px-3 py-1 rounded-full text-sm`}
            >
              {difficulty}
            </span>
          )}

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className={` px-4 py-1 rounded-lg ${Colors.border.specialThick} ${Colors.text.special} ${Colors.hover.special} cursor-pointer active:scale-95 transition-all`}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        {isEditing ? (
          //@ts-ignore
          <MarkdownEditor
            value={description}
            setValue={setDescription}
            mode={"edit"}
            hideToolbar={false}
            theme={"light"}
          />
        ) : (
          //@ts-ignore
          <MarkdownEditor
            value={description}
            mode={"preview"}
            setValue={setDescription}
            theme={useTheme().theme === "Dark" ? "dark" : "light"}
          />
        )}
      </section>

      {/* Topics */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Topics</h2>

        {topics.length === 0 && (
          <div>
            <div className="flex gap-2">
              <input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Add topic"
                className={`${Colors.background.secondary} ${Colors.text.primary} px-3 py-1 rounded-md flex-1`}
              />
              <button
                onClick={() =>
                  createTopic(param.id as string, { tagName: [newTopic] })
                }
                className={`${Colors.background.special} ${Colors.text.primary} px-4 py-1 rounded-md`}
              >
                Add
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-3">
          {topics.length > 0 &&
            topics.map((tag) => (
              <span
                key={tag}
                className={`${Colors.background.secondary} ${Colors.text.primary} px-3 py-1 rounded-full text-sm flex items-center gap-2`}
              >
                {tag}
                {isEditing && (
                  <button
                    onClick={() => removeTopic(tag)}
                    className={`text-red-500 hover:text-red-700 cursor-pointer`}
                  >
                    <X size={14} />
                  </button>
                )}
              </span>
            ))}
        </div>

        {isEditing && (
          <div className="flex gap-2">
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Add topic"
              className={`${Colors.background.secondary} ${Colors.text.primary} placeholder:text-neutral-500 px-3 py-1 rounded-md flex-1`}
            />
            <button
              onClick={addTopic}
              className={`${Colors.hover.special} ${Colors.text.special} ${Colors.border.specialThick} px-4 py-1 rounded-md cursor-pointer active:scale-95 transition-all`}
            >
              Add
            </button>
          </div>
        )}
      </section>

      {/* Hints */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Hints</h2>

        {isEditing ? (
          <>
            {hints.map((hint, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  value={hint}
                  onChange={(e) => updateHint(index, e.target.value)}
                  className={`${Colors.background.secondary} ${Colors.text.primary} placeholder:text-neutral-500 px-3 py-1 rounded-md flex-1`}
                />
                <button
                  onClick={() => removeHint(index)}
                  className={`text-red-500 hover:text-red-700 cursor-pointer`}
                >
                  <X size={20} />
                </button>
              </div>
            ))}

            <button
              onClick={addHint}
              className={`${Colors.text.special} hover:underline cursor-pointer active:scale-95 transition-all`}
            >
              + Add Hint
            </button>
          </>
        ) : (
          <ul
            className={`list-disc list-inside ${Colors.text.secondary} space-y-1`}
          >
            {hints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Footer */}
      <footer
        className={`pt-4 ${Colors.border.default} flex justify-between items-center`}
      >
        <div className={`text-sm ${Colors.text.secondary} space-y-1`}>
          <p>Created: {new Date(content.createdAt).toLocaleString()}</p>
          <p>Last Updated: {new Date(content.updatedAt).toLocaleString()}</p>
        </div>

        {isEditing && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                resetChanges();
                setIsEditing(false);
              }}
              className={`${Colors.text.special} hover:underline px-4 py-2 cursor-pointer active:scale-95 transition-all`}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`${Colors.hover.special} ${Colors.text.special} ${Colors.border.specialThick} px-6 py-2 rounded-md cursor-pointer active:scale-95 transition-all`}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

export default Submissions;


