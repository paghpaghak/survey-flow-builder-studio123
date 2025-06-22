import { QuestionFormData, QuestionType } from '@survey-platform/shared-types';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import { PhoneSettings } from "./PhoneSettings";
import { DateSettings } from "./DateSettings";

interface TypeSpecificSettingsProps {
  type: QuestionType;
  settings: any;
  onChange: (settings: any) => void;
  readOnly?: boolean;
}

/**
 * <summary>
 * Компонент для отображения настроек, специфичных для конкретного типа вопроса.
 * Автоматически выбирает подходящий компонент настроек на основе типа.
 * </summary>
 */
export function TypeSpecificSettings(props: TypeSpecificSettingsProps) {
  const { type, settings, onChange, readOnly } = props;

  switch (type) {
    case QUESTION_TYPES.Phone:
      return <PhoneSettings settings={settings} onChange={onChange} readOnly={readOnly} />;
    // case QuestionType.Number:
    // return <NumberSettings control={control} />;
    case QUESTION_TYPES.Date:
      return <DateSettings settings={settings} onChange={onChange} readOnly={readOnly} />;
    default:
      return null;
  }
}