import React from 'react';
import { cn } from '@/lib/utils';

type QuestionOptionProps = {
  option: string;
  label: string;
  text: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isSubmitted?: boolean;
  onClick: () => void;
};

export function QuestionOption({
  option,
  label,
  text,
  isSelected,
  isCorrect,
  isSubmitted = false,
  onClick
}: QuestionOptionProps) {
  const getOptionClasses = (): string => {
    if (!isSubmitted) {
      return cn(
        "border rounded-lg p-4 cursor-pointer transition-colors",
        isSelected ? "border-primary" : "option-hover border-neutral-200 hover:border-primary hover:bg-primary/5"
      );
    }

    if (isCorrect) {
      return "border border-[#4CAF50] rounded-lg p-4 bg-[#4CAF50]/5";
    }

    if (isSelected && !isCorrect) {
      return "border border-[#F44336] rounded-lg p-4 bg-[#F44336]/5";
    }

    return "border border-neutral-200 rounded-lg p-4 opacity-70";
  };

  const getLabelClasses = (): string => {
    if (isSelected && !isSubmitted) {
      return "w-6 h-6 rounded-full border-2 border-primary bg-primary text-white flex-shrink-0 flex items-center justify-center mr-3";
    }

    if (isSubmitted && isCorrect) {
      return "w-6 h-6 rounded-full border-2 border-[#4CAF50] bg-[#4CAF50] text-white flex-shrink-0 flex items-center justify-center mr-3";
    }

    if (isSubmitted && isSelected && !isCorrect) {
      return "w-6 h-6 rounded-full border-2 border-[#F44336] bg-[#F44336] text-white flex-shrink-0 flex items-center justify-center mr-3";
    }

    return "w-6 h-6 rounded-full border-2 border-neutral-300 flex-shrink-0 flex items-center justify-center mr-3";
  };

  return (
    <div 
      className={getOptionClasses()}
      onClick={!isSubmitted ? onClick : undefined}
      data-option={option}
    >
      <div className="flex items-start">
        <div className={getLabelClasses()}>
          {label}
        </div>
        <div>
          <p className="text-neutral-800">{text}</p>
        </div>
      </div>
    </div>
  );
}
