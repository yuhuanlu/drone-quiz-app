'use client';

import { useEffect, useState } from 'react';

type Mode = 'normal' | 'professional';
type Chapter = 1 | 2 | 3 | 4;

const chapterMap: Record<Chapter, string> = {
  1: "第一章 民用航空法及相關法規",
  2: "第二章 基礎飛行原理",
  3: "第三章 氣象",
  4: "第四章 緊急處置與飛行決策",
};

// 假設你有一個題庫是依章節與模式分類的
const questionBank: Record<Mode, Record<Chapter, any[]>> = {
  normal: {
    1: new Array(10).fill(null),  // 假設每章有 10 題
    2: new Array(8).fill(null),
    3: new Array(12).fill(null),
    4: new Array(9).fill(null),
  },
  professional: {
    1: new Array(15).fill(null),
    2: new Array(10).fill(null),
    3: new Array(14).fill(null),
    4: new Array(13).fill(null),
  },
};

interface ChapterListProps {
  selectedMode: Mode;
  questionCounts: Record<1 | 2 | 3 | 4, number>;
  onSelect: (chapter: Chapter) => void;
}

export default function ChapterList({ selectedMode, questionCounts, onSelect }: ChapterListProps) {
  const [answeredCounts, setAnsweredCounts] = useState<Record<Chapter, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  // 初始化讀取每個章節的已答題數
  useEffect(() => {
    const newCounts: Record<Chapter, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    (Object.keys(chapterMap) as unknown as Chapter[]).forEach((chapter) => {
      const key = `answeredQuestions-${selectedMode}-${chapter}`;
      const raw = localStorage.getItem(key);
      try {
        newCounts[chapter] = raw ? JSON.parse(raw).length : 0;
      } catch {
        newCounts[chapter] = 0;
      }
    });
    setAnsweredCounts(newCounts);
  }, [selectedMode]);

  const resetChapter = (chapter: Chapter) => {
    const key = `answeredQuestions-${selectedMode}-${chapter}`;
    localStorage.removeItem(key);
    setAnsweredCounts((prev) => ({ ...prev, [chapter]: 0 }));
  };

  return (
    <div className="space-y-4">
      {(Object.keys(chapterMap) as unknown as Chapter[]).map((chapter) => {
        const total = questionCounts[chapter] || 0;
        const answered = answeredCounts[chapter];

        return (
          <div key={chapter} className="p-4 border rounded shadow-sm">
            <h5 className="font-bold text-lg">{chapterMap[chapter]}</h5>
            <p className="text-sm">已答題數：{answered} 總題數：{total} </p>
            <div className="mt-2 flex justify-between gap-2">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                onClick={() => onSelect(chapter)}
              >
                開始練習
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-1 rounded"
                onClick={() => resetChapter(chapter)}
              >
                重置已答
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
