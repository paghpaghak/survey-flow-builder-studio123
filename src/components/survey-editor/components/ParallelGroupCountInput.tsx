import React from 'react';
import { ParallelBranchSettings } from '@survey-platform/shared-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ParallelGroupCountInputProps {
  settings: ParallelBranchSettings;
  countKey: string;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

export function ParallelGroupCountInput({
  settings,
  countKey,
  answers,
  onAnswerChange,
  activeTab,
  setActiveTab,
}: ParallelGroupCountInputProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingValue, setPendingValue] = React.useState<string | null>(null);

  const currentCount = Number(answers[countKey]) || 0;

  return (
    <div className="space-y-2">
      <Label>{settings.countLabel || 'Сколько повторений?'}</Label>
      {settings.countDescription && (
        <p className="text-sm text-gray-500">{settings.countDescription}</p>
      )}
      <Input
        type="number"
        min={settings.minItems || 1}
        max={settings.maxItems || 30}
        value={answers[countKey] || ''}
        onChange={(e) => {
          const newCount = parseInt(e.target.value) || 0;
          // Если количество уменьшается и уже есть ответы — спрашиваем подтверждение
          if (newCount < currentCount && currentCount > 0) {
            setPendingValue(e.target.value);
            setConfirmOpen(true);
            return;
          }
          onAnswerChange(countKey, e.target.value);
          if (newCount > 0 && activeTab >= newCount) setActiveTab(0);
        }}
        required={!!settings.countRequired}
        placeholder="Введите число"
      />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Уменьшение количества повторов</AlertDialogTitle>
            <AlertDialogDescription>
              При уменьшении количества повторов часть введённых данных будет удалена. Продолжить?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingValue(null); }}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingValue != null) {
                onAnswerChange(countKey, pendingValue);
                const newCount = parseInt(pendingValue) || 0;
                if (newCount > 0 && activeTab >= newCount) setActiveTab(0);
                setPendingValue(null);
              }
              setConfirmOpen(false);
            }}>Продолжить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 