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
import { Label } from '@/components/ui/label';
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Отказване от абонамент</DialogTitle>
          <DialogDescription>
            Съжаляваме, че искате да се откажете. Моля, споделете защо напускате и как можем да подобрим услугата.
          </DialogDescription>
        </DialogHeader>
        
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <p className="text-center text-lg">Благодарим за обратната връзка!</p>
            <p className="text-center text-muted-foreground">
              Вашият абонамент ще бъде прекратен в края на текущия период.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label htmlFor="reason">Защо се отказвате от абонамента?</Label>
                <RadioGroup 
                  id="reason" 
                  value={reason} 
                  onValueChange={setReason}
                  className="space-y-2"
                >
                  {reasons.map((r) => (
                    <div key={r.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={r.value} id={r.value} />
                      <Label htmlFor={r.value}>{r.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="feedback">
                  Вашето мнение е важно за нас. Как можем да подобрим услугата?
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Споделете вашите мисли..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex items-center bg-amber-50 p-3 rounded-md text-amber-800">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <p className="text-sm">
                  Вашият абонамент ще остане активен до края на платения период, след което няма да бъде подновен.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Отказ
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSubmitSurvey} 
                disabled={isLoading || !reason}
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