import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

type ExplanationCardProps = {
  correctOption: string;
  explanation: string;
  selectedOption: string;
};

export function ExplanationCard({ correctOption, explanation, selectedOption }: ExplanationCardProps) {
  const isCorrect = selectedOption === correctOption;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium text-neutral-800 mb-4">Explanation</h3>
        
        <div className="p-4 bg-[#4CAF50] bg-opacity-10 rounded-lg mb-4 flex items-start">
          <CheckCircle className="text-[#4CAF50] mr-3" />
          <div>
            <p className="font-medium text-[#4CAF50]">Correct Answer: {correctOption}</p>
            <p className="mt-1">
              {isCorrect ? 'You selected the correct answer!' : `You selected ${selectedOption}`}
            </p>
          </div>
        </div>
        
        <div className="text-neutral-600">
          {explanation.split('\n').map((paragraph, i) => (
            <p key={i} className="mb-3">{paragraph}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
