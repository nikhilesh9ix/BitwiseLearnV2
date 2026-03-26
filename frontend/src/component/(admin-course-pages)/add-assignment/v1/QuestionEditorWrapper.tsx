"use client";

import { useState, useEffect } from "react";
import QuestionEditor from "./QuestionEditor";
import { v4 as uuid } from "uuid";
import { getAssignmentById } from "@/api/courses/assignment/get-assignment-by-id";
import toast from "react-hot-toast";
import { addAssignmentQuestion } from "@/api/courses/assignment-questions/add-question";
import { updateAssignmentQuestion } from "@/api/courses/assignment-questions/update-question";

const emptyQuestion = () => ({
  id: null,
  isNew: true,
  text: "",
  options: [
    { id: uuid(), text: "", isCorrect: false },
    { id: uuid(), text: "", isCorrect: false },
  ],
});

export default function QuestionEditorWrapper({
  assignmentId,
  onClose,
}: {
  assignmentId: string;
  onClose: () => void;
}) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [hasExistingQuestions, setHasExistingQuestions] = useState(false);
  const locked = hasExistingQuestions && !editMode;

  useEffect(() => {
    if (!assignmentId) return;

    const fetchAssignment = async () => {
      try {
        const res = await getAssignmentById(assignmentId);

        const assignment = res.data;
        const backendQuestions =
          assignment?.questions ||
          assignment?.courseAssignmentQuestions ||
          assignment?.courseAssignemntQuestions ||
          [];

        if (backendQuestions.length === 0) {
          setQuestions([emptyQuestion()]);
          setHasExistingQuestions(false);
          setEditMode(true);
          setLoading(false);
          return;
        }

        setHasExistingQuestions(true);
        setEditMode(false);
        const mappedQuestions = backendQuestions.map((q: any) => ({
          id: q.id,
          isNew: false,
          text: q.question || "",
          options: (q.options || []).map((opt: any) => {
            const text = typeof opt === "string" ? opt : opt.text;
            const correctAnswers = Array.isArray(q.correctAnswer)
              ? q.correctAnswer
              : q.correctAnswer
                ? [q.correctAnswer]
                : [];

            return {
              id: uuid(),
              text,
              isCorrect: correctAnswers.includes(text),
            };
          }),
        }));

        setQuestions(mappedQuestions);
      } catch (error) {
        // console.error("Failed to fetch assignment questions", error);
        setQuestions([emptyQuestion()]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const saveQuestion = (updated: any) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  };

  const handleSaveAllQuestions = async () => {
    const toastId = toast.loading(
      editMode ? "Updating questions..." : "Saving questions...",
    );

    try {
      for (const q of questions) {
        if (!q.text.trim()) continue;

        const correctOptions = q.options.filter((o: any) => o.isCorrect);
        if (correctOptions.length === 0) continue;

        const payload = {
          question: q.text.trim(),
          options: q.options.map((o: any) => o.text.trim()).filter(Boolean),
          correctAnswer: correctOptions.map((o: any) => o.text.trim()),
        };

        if (!q.isNew) {
          await updateAssignmentQuestion(q.id, payload);
        } else {
          await addAssignmentQuestion(assignmentId, {
            assignmentId,
            ...payload,
          });
        }
      }

      toast.success(editMode ? "Questions updated" : "Questions saved", {
        id: toastId,
      });
      setEditMode(false);
      onClose();
    } catch (err) {
      // console.error(err);
      toast.error("Failed to save questions", { id: toastId });
    }
  };

  if (loading) return null;

  return (
    <QuestionEditor
      assignmentId={assignmentId}
      question={questions[index]}
      index={index}
      total={questions.length}
      saveQuestion={saveQuestion}
      locked={locked}
      onEdit={() => setEditMode(true)}
      onPrev={() => setIndex((i) => Math.max(i - 1, 0))}
      onNext={() => setIndex((i) => Math.min(i + 1, questions.length - 1))}
      onNew={() => {
        setQuestions((prev) => {
          const next = [...prev, emptyQuestion()];
          setIndex(next.length - 1);
          return next;
        });
      }}
      onSubmit={handleSaveAllQuestions}
      onClose={onClose}
    />
  );
}
