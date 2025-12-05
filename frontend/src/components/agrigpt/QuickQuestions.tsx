
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles } from 'lucide-react';

interface QuickQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export function QuickQuestions({ questions, onQuestionClick }: QuickQuestionsProps) {
  return (
    <Card className="shadow-soft hover:shadow-strong transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Quick Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full text-left h-auto p-4 text-sm justify-start hover:bg-muted/70 transition-all duration-300 group"
            onClick={() => onQuestionClick(question)}
          >
            <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
            <span className="truncate group-hover:text-primary transition-colors">{question}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
