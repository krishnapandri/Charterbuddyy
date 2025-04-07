import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuestionOption } from './question-option';
import { ExplanationCard } from './explanation-card';

export type Question = {
  id: number;
  topicId: number;
  subtopic?: string;
  questionText: string;
  context?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
};

type QuestionCardProps = {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string, isCorrect: boolean, timeSpent: number) => void;
  onNext: () => void;
  startTime: number;
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onSubmit,
  onNext,
  startTime,
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  const handleOptionClick = (option: string) => {
    if (!isSubmitted) {
      setSelectedOption(option);
    }
  };

  const handleSubmit = () => {
    if (selectedOption) {
      const endTime = Date.now();
      const timeElapsed = Math.floor((endTime - startTime) / 1000); // in seconds
      setTimeSpent(timeElapsed);
      
      const isCorrect = selectedOption === question.correctOption;
      setIsSubmitted(true);
      onSubmit(selectedOption, isCorrect, timeElapsed);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-6">
            {question.subtopic && (
              <Badge variant="topic" className="mb-3">
                {question.subtopic}
              </Badge>
            )}
            <h3 className="text-lg font-medium text-neutral-800 mb-4">
              {question.questionText}
            </h3>
            {question.context && (
              <p className="text-neutral-600 mb-4">{question.context}</p>
            )}
          </div>

          <div className="space-y-3">
            <QuestionOption
              option="A"
              label="A"
              text={question.optionA}
              isSelected={selectedOption === 'A'}
              isCorrect={question.correctOption === 'A'}
              isSubmitted={isSubmitted}
              onClick={() => handleOptionClick('A')}
            />
            <QuestionOption
              option="B"
              label="B"
              text={question.optionB}
              isSelected={selectedOption === 'B'}
              isCorrect={question.correctOption === 'B'}
              isSubmitted={isSubmitted}
              onClick={() => handleOptionClick('B')}
            />
            <QuestionOption
              option="C"
              label="C"
              text={question.optionC}
              isSelected={selectedOption === 'C'}
              isCorrect={question.correctOption === 'C'}
              isSubmitted={isSubmitted}
              onClick={() => handleOptionClick('C')}
            />
            <QuestionOption
              option="D"
              label="D"
              text={question.optionD}
              isSelected={selectedOption === 'D'}
              isCorrect={question.correctOption === 'D'}
              isSubmitted={isSubmitted}
              onClick={() => handleOptionClick('D')}
            />
          </div>

          <div className="mt-6 flex justify-end">
            {isSubmitted ? (
              <Button onClick={onNext}>
                Next Question
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption}
              >
                Submit Answer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isSubmitted && (
        <ExplanationCard
          correctOption={question.correctOption}
          explanation={question.explanation}
          selectedOption={selectedOption || ''}
        />
      )}
    </>
  );
}
