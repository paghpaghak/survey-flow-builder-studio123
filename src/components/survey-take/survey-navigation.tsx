import { Button } from '@/components/ui/button';

interface SurveyNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export function SurveyNavigation({
  onPrevious,
  onNext,
  isSubmitting,
  isFirstPage,
  isLastPage,
}: SurveyNavigationProps) {
  return (
    <div className="flex justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstPage || isSubmitting}
      >
        Назад
      </Button>
      {isLastPage ? (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </Button>
      ) : (
        <Button type="button" onClick={onNext} disabled={isSubmitting}>
          Далее
        </Button>
      )}
    </div>
  );
} 