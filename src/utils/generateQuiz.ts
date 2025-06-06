import { Question } from '../types/question';
import allQuestions from '../data/questions';

export function generateQuizSet(count = 20): Question[] {
  const chapters = [1, 2, 3, 4];
  const selected: Question[] = [];

  chapters.forEach(chapter => {
    const chapterQuestions = allQuestions.filter(q => q.chapter === chapter);
    const randomQuestion = chapterQuestions[Math.floor(Math.random() * chapterQuestions.length)];
    selected.push(randomQuestion);
  });

  const remainingQuestions = allQuestions.filter(q => !selected.includes(q));
  while (selected.length < count) {
    const random = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
    if (!selected.includes(random)) {
      selected.push(random);
    }
  }

  return selected;
}