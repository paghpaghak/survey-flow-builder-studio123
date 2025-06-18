import { QuestionType } from '@/types/survey';
import { PhoneSettings } from './PhoneSettings';
import { DateSettings } from './DateSettings';

interface TypeSpecificSettingsProps {
  type: QuestionType;
  settings?: any;
  onChange: (settings: any) => void;
  readOnly?: boolean;
}

/**
 * <summary>
 * Компонент для отображения настроек, специфичных для конкретного типа вопроса.
 * Автоматически выбирает подходящий компонент настроек на основе типа.
 * </summary>
 */
export function TypeSpecificSettings({ 
  type, 
  settings, 
  onChange, 
  readOnly = false 
}: TypeSpecificSettingsProps) {
  
  switch (type) {
    case QuestionType.Phone:
      return (
        <PhoneSettings
          settings={settings}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case QuestionType.Date:
      return (
        <DateSettings
          settings={settings}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    default:
      return null;
  }
}