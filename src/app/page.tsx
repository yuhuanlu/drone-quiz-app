"use client";

import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { Question, Result } from "../types/question";
import "bootstrap/dist/css/bootstrap.min.css";
import { AiOutlineHome } from "react-icons/ai";
import { getQuestionCountByModeAndChapter } from '@/utils/getQuestionCountByModeAndChapter';
import ChapterList from '@/components/ChapterList';

interface QuizHistoryItem {
  timestamp: string;
  score: number;
  results: Result[];
  mode: "normal" | "professional";
  duration: number;
}

const chapterMap: Record<string, string> = {
  "1": "第一章 民用航空法及相關法規",
  "2": "第二章 基礎飛行原理",
  "3": "第三章 氣象",
  "4": "第四章 緊急處置與飛行決策",
};

export default function Home() {
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [results, setResults] = useState<Result[]>([]);
  const [historyVisible, setHistoryVisible] = useState<boolean>(false);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [mode, setMode] = useState<"normal" | "professional" | null>(null);
  const [type, setType] = useState<"test" | "general" | null>(null);
  const [chapter, setChapter] = useState<1 | 2 | 3 | 4 | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem("quizHistory");
    if (savedHistory) {
      setQuizHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (startTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startTime]);

  const startNewQuiz = async (
    selectedMode: "normal" | "professional" | null
  ) => {
    try {
      const res = await fetch(
        selectedMode === "normal"
          ? "/questions-simple.json"
          : "/questions-pro.json"
      );
      const allQuestions: Question[] = await res.json();

      const chapters = Array.from(new Set(allQuestions.map((q) => q.chapter)));
      const selected: Question[] = [];
      const questionsPerChapter = selectedMode === "normal" ? 5 : 10;
      const totalQuestions = selectedMode === "normal" ? 20 : 40;

      chapters.forEach((ch) => {
        const questionsInChapter = allQuestions.filter((q) => q.chapter === ch);
        const shuffled = questionsInChapter.sort(() => 0.5 - Math.random());
        selected.push(...shuffled.slice(0, questionsPerChapter));
      });

      const finalSelected = selected
        .sort(() => 0.5 - Math.random())
        .slice(0, totalQuestions);

      setQuizQuestions(finalSelected);
      setCurrentIndex(0);
      setSelectedOption("");
      setScore(0);
      setResults([]);
      setHistoryVisible(false);
      setElapsedTime(0);
      setStartTime(Date.now());
      setType("test");
    } catch (error) {
      console.error("載入題庫失敗：", error);
    }
  };

  const [questionCounts, setQuestionCounts] = useState<Record<1 | 2 | 3 | 4, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      const counts = await getQuestionCountByModeAndChapter(mode);
      setQuestionCounts(counts);
      setLoading(false);
    };
    fetchCounts();
  }, [mode]);

  const startNewRead = async (
    selectedMode: "normal" | "professional" | null,
    chapter: 1 | 2 | 3 | 4 | null
  ) => {
    try {
      const res = await fetch(
        selectedMode === "normal"
          ? "/questions-simple.json"
          : "/questions-pro.json"
      );
      const allQuestions: Question[] = await res.json();
      const selectedChapter = chapter ?? 1;

      const answeredKey = `answeredQuestions-${selectedMode}-${selectedChapter}`;
      const answeredQuestions: number[] = JSON.parse(
        localStorage.getItem(answeredKey) || "[]"
      );

      const selected: Question[] = allQuestions.filter(
        (q) =>
          q.chapter == selectedChapter &&
          !answeredQuestions.includes(q.id)
      ); // 用 q.id 如果有 id

      setQuizQuestions(selected);
      setCurrentIndex(0);
      setSelectedOption("");
      setScore(0);
      setResults([]);
      setHistoryVisible(false);
      setElapsedTime(0);
      setType("general");
      setChapter(selectedChapter);
    } catch (error) {
      console.error("載入題庫失敗：", error);
    }
  };

  const handleSelect = async(chapter: 1 | 2 | 3 | 4) => {
    startNewRead(mode, chapter)
  };

  const resetQuiz = () => {
    setQuizQuestions([]);
    setCurrentIndex(0);
    setSelectedOption("");
    setScore(0);
    setResults([]);
    setIsAnswered(false);
    setElapsedTime(0);
    setStartTime(null);
    setMode(null);
    setType(null);
    setChapter(null);
  };

  const currentQuestion = quizQuestions[currentIndex];

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
  };

  const confirmAnswer = () => {
    if (!currentQuestion || !selectedOption) return;
    const isCorrect = selectedOption === currentQuestion.answer;
    const pointsPerQuestion = mode === "professional" ? 100 / 40 : 100 / 20;
    if (isCorrect) setScore((prev) => prev + pointsPerQuestion);
    setResults((prev) => [
      ...prev,
      {
        question: currentQuestion,
        selected: selectedOption,
        isCorrect,
      },
    ]);
    setIsAnswered(true);
    if (type === "general") {
      const key = `answeredQuestions-${mode}-${chapter}`;
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      const updated = [...prev, currentQuestion.id];
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  const handleNext = () => {
    setSelectedOption("");
    setIsAnswered(false);
    setCurrentIndex((prev) => prev + 1);
  };

  useEffect(() => {
    if (results.length === quizQuestions.length && results.length > 0) {
      const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");
      const newRecord = {
        timestamp: new Date().toISOString(),
        score: Math.round(score),
        results,
        mode: mode || "normal",
        duration: elapsedTime,
      };
      const updatedHistory = [...history, newRecord];
      localStorage.setItem("quizHistory", JSON.stringify(updatedHistory));
      setQuizHistory(updatedHistory);
    }
  }, [results]);

  const toggleHistory = () => {
    setHistoryVisible(!historyVisible);
  };
  const removeHistory = () => {
    localStorage.removeItem("quizHistory");
    setQuizHistory([]);
  };

  const removeGeneralHistory = (mode: string | null , chapter: number | null) => {
    const answeredKey = `answeredQuestions-${mode}-${chapter}`;
    console.log(answeredKey)
    localStorage.removeItem(answeredKey);
    setCurrentIndex(0);
    setSelectedOption("");
    setScore(0);
    setResults([]);
    setIsAnswered(false);
    setElapsedTime(0);
    setStartTime(null);
    console.log(isAnswered, results, quizHistory, currentIndex)
    // setResults([]);
  };

  if (historyVisible) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">歷史紀錄</h2>
        <Button className="mb-4" onClick={toggleHistory}>
          返回測驗
        </Button>
        {quizHistory.length === 0 ? (
          <p>尚無歷史紀錄。</p>
        ) : (
          [...quizHistory]
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            ) // <-- 排序
            .map((item, index) => (
              <div key={index} className="border p-4 rounded mb-4 shadow-sm">
                <p>
                  <strong>時間：</strong>
                  {new Date(item.timestamp).toLocaleString()}
                </p>
                <p>
                  <strong>得分：</strong>
                  {item.score} 分
                </p>
                <ul className="mt-2 space-y-2">
                  {item.results.map((res, idx) => (
                    <li key={idx} className="border p-2 rounded">
                      <p>
                        <strong>章節：</strong>
                        {chapterMap[res.question.chapter]}
                      </p>
                      <p>
                        <strong>題目：</strong>
                        {res.question.question}
                      </p>
                      <p>
                        <strong>您的答案：</strong>
                        {res.selected}：
                        {typeof res.selected === 'string' && res.selected.length === 1 && res.question.options
                          ? res.question.options[res.selected.charCodeAt(0) - 65]
                          : '（無法辨識選項）'}
                        {res.isCorrect ? "✅" : "❌"}
                      </p>
                      {!res.isCorrect && (<p>
                        <strong>正確答案：</strong>
                        {res.question?.answer}：
                         {typeof res.question.answer === 'string' &&
  res.question.answer.length === 1 && res.question.options
    ? res.question.options[res.question.answer.charCodeAt(0) - 65]
    : '（無法辨識選項）'}{" "}
                      </p>)}

                    </li>
                  ))}
                </ul>
              </div>
            ))
        )}
      </div>
    );
  }

  if (!mode && !type) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-6 border rounded shadow w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">請選擇題庫</h2>
          <div className="flex flex-col gap-4">
            <Button variant="outline-secondary" onClick={() => setMode("normal")}>普通學科</Button>
            <Button variant="outline-secondary" onClick={() => setMode("professional")}>
              專業學科
            </Button>
          </div>
          <div className="flex justify-between gap-4 mt-4">
            <Button variant="outline-info" onClick={toggleHistory}>
              查看測驗紀錄
            </Button>
            <Button variant="outline-danger" onClick={removeHistory}>
              清除測驗紀錄
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!type) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-6 border rounded shadow w-full max-w-md flex flex-col">
          <h2 className="text-2xl font-bold mb-2 text-center">請選擇模式</h2>
        <Button className="btn-sm mb-2 flex justify-center items-center mx-auto" variant="outline-danger" onClick={resetQuiz}>
          <AiOutlineHome className="inline-block" />
        </Button>
          <div className="flex flex-col gap-4">
            <Button variant="outline-secondary" onClick={() => startNewQuiz(mode)}>模擬測驗</Button>
            <Button variant="outline-secondary" onClick={() => setType("general")}>
              逐題練習
            </Button>
          </div>
        </div>
      </div>
    );
  }
  if (type === "general" && !chapter) {
    if (loading || !questionCounts) {
      return <p>載入中...</p>;
    }
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-6 border rounded shadow w-full max-w-md flex flex-col">
          <h2 className="text-2xl font-bold mb-2 text-center">請選擇章節</h2>
          <Button className="btn-sm mb-2 flex justify-center items-center mx-auto" variant="outline-danger" onClick={resetQuiz}>
          <AiOutlineHome className="inline-block" />
        </Button>
          <ChapterList selectedMode={mode || 'normal'} questionCounts={questionCounts} onSelect={handleSelect} />
        </div>

      </div>
    );
  }

  if (quizQuestions.length === 0) return <div className="p-4">載入中...</div>;

  if (currentIndex >= quizQuestions.length) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">測驗完成</h2>
        <p className="mb-2">您的得分：{score} 分</p>
        <p className="mb-2">
          🕒 測驗時間：{Math.floor(elapsedTime / 60)} 分 {elapsedTime % 60} 秒
        </p>
        <p className="mb-4">
          {score >= 80 ? "🎉 恭喜您及格了！" : "😢 很遺憾，請再接再厲。"}
        </p>
        <div className="flex gap-4 mb-6">
          <Button onClick={resetQuiz}>重新開始</Button>
          <Button variant="secondary" onClick={toggleHistory}>
            查看歷史紀錄
          </Button>
        </div>
        <h3 className="text-xl font-semibold mb-2">錯題分析</h3>
        <ul className="space-y-3">
          {results
            .filter((res) => !res.isCorrect)
            .map((res, idx) => (
              <li key={idx} className="border p-3 rounded shadow-sm">
                <p>
                  <strong>題目：</strong>
                  {res.question.question}
                </p>
                <p>
                  <strong>您的答案：</strong>
                  {res.selected}：
                  {res.question.options[res.selected.charCodeAt(0) - 65]}{" "}
                  {res.isCorrect ? "✅" : "❌"}
                </p>
                <p>
                  <strong>正確答案：</strong>
                  {res.question.answer}：
                  {res.question.options[res.question.answer.charCodeAt(0) - 65]}{" "}
                </p>
                <p>
                  <strong>章節：</strong>
                  {chapterMap[res.question.chapter]}
                </p>
              </li>
            ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h4 className="text-sm font-bold">
        第 {currentIndex + 1}
        <span className="text-sm text-gray-600">
          /{quizQuestions.length}
        </span>{" "}
        題{" "}
        <Button className="btn-sm" variant="outline-danger" onClick={resetQuiz}>
          <AiOutlineHome className="inline-block" />
        </Button>
      </h4>
      {type === "test" && (
        <p className="text-sm text-gray-600 mb-4">
          🕒 已經過時間：{Math.floor(elapsedTime / 60)} 分 {elapsedTime % 60} 秒
        </p>
      )}
      <p className="mb-4 text-lg">{currentQuestion.question}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuestion.options.map((opt, idx) => {
          const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
          const isSelected = selectedOption === optionLabel;
          const isCorrect = currentQuestion.answer === optionLabel;

          let variant: "outline-secondary" | "success" | "danger" | "primary" =
            "outline-secondary";
          if (isAnswered) {
            if (isCorrect) variant = "success";
            else if (isSelected && !isCorrect) variant = "danger";
          } else if (isSelected) {
            variant = "primary";
          }

          return (
            <Button
              key={optionLabel}
              variant={variant}
              onClick={() => handleSelectOption(optionLabel)}
              className="d-block my-2"
              disabled={isAnswered}
            >
              {optionLabel}. {opt}
            </Button>
          );
        })}
      </div>
      {selectedOption && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 my-4">
          {selectedOption && !isAnswered && (
            <Button
              className="my-2 "
              onClick={confirmAnswer}
              variant="outline-dark"
            >
              確認答案
            </Button>
          )}

          {isAnswered && (
            <Button
              className="my-2"
              onClick={handleNext}
              variant="outline-dark"
            >
              {currentIndex === quizQuestions.length - 1
                ? "查看結果"
                : "下一題"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
