import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { DateQuestionSettings } from '@survey-platform/shared-types';
import { DATE_FORMAT_OPTIONS, DEFAULT_DATE_SETTINGS } from '@survey-platform/shared-types';

interface DateSettingsProps {
  settings?: DateQuestionSettings;
  onChange: (settings: DateQuestionSettings) => void;
  readOnly?: boolean;
}

/**
 * <summary>
 * Компонент для настройки параметров поля даты.
 * Позволяет выбрать формат отображения даты.
 * </summary>
 */
export function DateSettings({ 
  settings = DEFAULT_DATE_SETTINGS, 
  onChange, 
  readOnly = false 
}: DateSettingsProps) {
  
  const handleFormatChange = (format: string) => {
    onChange({
      ...settings,
      format
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date-format">Формат даты</Label>
        <Select 
          value={settings.format}
          onValueChange={handleFormatChange}
          disabled={readOnly}
        >
          <SelectTrigger id="date-format">
            <SelectValue placeholder="Выберите формат даты" />
          </SelectTrigger>
          <SelectContent>
            {DATE_FORMAT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          Формат, в котором будет отображаться выбранная дата
        </p>
      </div>
    </div>
  );
}