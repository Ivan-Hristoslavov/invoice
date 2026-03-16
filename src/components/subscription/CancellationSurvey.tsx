"use client";

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';

interface CancellationSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onSubmit: (reason: string, feedback: string) => Promise<void>;
  isLoading?: boolean;
}

export function CancellationSurvey({ 
  isOpen, 
  onClose, 
  onConfirm,
  onSubmit,
  isLoading = false
}: CancellationSurveyProps) {
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const reasons = [
    { value: 'price', label: 'Цената е твърде висока' },
    { value: 'features', label: 'Липсват функционалности, които са ми необходими' },
    { value: 'usability', label: 'Трудно е за използване' },
    { value: 'alternative', label: 'Намерих алтернативно решение' },
    { value: 'temporary', label: 'Временно не се нуждая от услугата' },
    { value: 'other', label: 'Друга причина' }
  ];

  const handleSubmitSurvey = async () => {
    if (!reason) return;
    
    try {
      setIsSubmitting(true);
      
      // Изпращаме данните чрез onSubmit функцията
      await onSubmit(reason, feedback);
      
      // Отбелязваме, че анкетата е изпратена
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting survey:', error);
      // Ако има грешка, все пак продължаваме с отказването
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Отказване от абонамент</DialogTitle>
          <DialogDescription>
            Съжаляваме, че искате да се откажете. Моля, споделете защо напускате и как можем да подобрим услугата.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2 text-center">
            <p className="text-base font-semibold">Благодарим за обратната връзка!</p>
            <p className="text-sm text-muted-foreground">
              Вашият абонамент ще бъде прекратен в края на текущия период.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-5 py-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Защо се отказвате от абонамента?</p>
                <RadioGroup
                  value={reason}
                  onValueChange={setReason}
                  className="space-y-0"
                >
                  {reasons.map((r) => (
                    <label
                      key={r.value}
                      htmlFor={r.value}
                      className={`flex cursor-pointer items-center gap-3 py-2.5 pr-2 transition-colors border-b border-border/40 last:border-0 hover:bg-muted/30 ${reason === r.value ? 'bg-muted/25' : ''}`}
                    >
                      <RadioGroupItem value={r.value} id={r.value} />
                      <span className="text-sm">{r.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">
                  Как можем да подобрим услугата?
                </p>
                <Textarea
                  id="feedback"
                  placeholder="Споделете вашите мисли..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="resize-none border-border/50 bg-transparent rounded-lg focus-visible:ring-2"
                />
              </div>

              <p className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                Вашият абонамент ще остане активен до края на платения период, след което няма да бъде подновен.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-full border border-border/60"
              >
                Отказ
              </Button>
              <Button
                onClick={handleSubmitSurvey}
                disabled={isLoading || !reason}
                className="rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 shadow-sm shadow-red-600/20"
              >
                {isLoading ? 'Обработка...' : 'Потвърди отказване'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 