export interface Question {
  id: number;
  chapter: number;
  question: string;
  options: string[];
  answer: string;
}

export interface Result {
  question: Question;
  selected: string;
  isCorrect: boolean;
}