import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ResumeSurveyDialogProps {
  open: boolean;
  onResume: () => void;
  onStartOver: () => void;
}

export function ResumeSurveyDialog({ open, onResume, onStartOver }: ResumeSurveyDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Продолжить заполнение?</AlertDialogTitle>
          <AlertDialogDescription>
            У вас есть сохраненный прогресс заполнения этого опроса. Хотите продолжить с того места, где остановились?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStartOver}>
            Начать заново
          </AlertDialogCancel>
          <AlertDialogAction onClick={onResume}>
            Продолжить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 