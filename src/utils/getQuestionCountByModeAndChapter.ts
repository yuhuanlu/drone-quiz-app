import { Question } from "@/types/question";

export const getQuestionCountByModeAndChapter = async (
    mode: 'normal' | 'professional'
  ): Promise<Record<1 | 2 | 3 | 4, number>> => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<1 | 2 | 3 | 4, number>;
    const res = await fetch(
      mode === "normal"
        ? "/questions-simple.json"
        : "/questions-pro.json"
    );
    const allQuestions: Question[] = await res.json();
    allQuestions.forEach((q) => {
      if ([1, 2, 3, 4].includes(q.chapter)) {
        counts[q.chapter as 1 | 2 | 3 | 4]++;
      }
    });
    return counts;
  };