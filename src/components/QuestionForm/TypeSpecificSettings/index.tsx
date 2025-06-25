import { QuestionFormData, QuestionType } from '@survey-platform/shared-types';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import { PhoneSettings } from "./PhoneSettings";
import { DateSettings } from "./DateSettings";
import { FileUploadSettings } from "./FileUploadSettings";
import { TextSettings } from "./TextSettings";
import { SelectSettings } from "./SelectSettings";

interface TypeSpecificSettingsProps {
  type: QuestionType;
  settings: any;
  onChange: (settings: any) => void;
  readOnly?: boolean;
  question?: QuestionFormData; // Добавляем question для получения опций
}

/**
 * <summary>
 * Компонент для отображения настроек, специфичных для конкретного типа вопроса.
 * Автоматически выбирает подходящий компонент настроек на основе типа.
 * </summary>
 */
export function TypeSpecificSettings(props: TypeSpecificSettingsProps) {
  const { type, settings, onChange, readOnly, question } = props;

  switch (type) {
    case QUESTION_TYPES.Text:
      return <TextSettings settings={settings} onChange={onChange} readOnly={readOnly} />;
    case QUESTION_TYPES.Select:
      return <SelectSettings settings={settings} onChange={onChange} readOnly={readOnly} question={question} />;
    case QUESTION_TYPES.Phone:
      return <PhoneSettings settings={settings} onChange={onChange} readOnly={readOnly} />;
    // case QuestionType.Number:
    // return <NumberSettings control={control} />;
    case QUESTION_TYPES.Date:
      return <DateSettings settings={settings} onChange={onChange} readOnly={readOnly} />;
    case QUESTION_TYPES.FileUpload:
      return <FileUploadSettings settings={settings} onChange={onChange} readOnly={readOnly} />;
    default:
      return null;
  }
}