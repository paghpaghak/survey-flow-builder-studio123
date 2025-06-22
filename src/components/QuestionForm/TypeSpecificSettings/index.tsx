import { Control } from "react-hook-form";
import { QuestionFormData } from "@/types/question.types";
import { QuestionType, QUESTION_TYPES } from "@survey-platform/shared-types";
import { PhoneSettings } from "./PhoneSettings";
import { DateSettings } from "./DateSettings";

interface TypeSpecificSettingsProps {
  control: Control<QuestionFormData>;
  questionType: QuestionType;
}

/**
 * <summary>
 * Компонент для отображения настроек, специфичных для конкретного типа вопроса.
 * Автоматически выбирает подходящий компонент настроек на основе типа.
 * </summary>
 */
export function TypeSpecificSettings(props: TypeSpecificSettingsProps) {
  const { control, questionType } = props;

  switch (questionType) {
    case QUESTION_TYPES.Phone:
      return <PhoneSettings control={control} />;
    // case QuestionType.Number:
    // return <NumberSettings control={control} />;
    case QUESTION_TYPES.Date:
      return <DateSettings control={control} />;
    default:
      return null;
  }
}