import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileUploadSettings, 
  FILE_TYPE_OPTIONS, 
  FILE_SIZE_OPTIONS,
  DEFAULT_FILE_UPLOAD_SETTINGS
} from '@survey-platform/shared-types';

interface FileUploadSettingsProps {
  settings: FileUploadSettings;
  onChange: (settings: FileUploadSettings) => void;
  readOnly?: boolean;
}

/**
 * <summary>
 * Компонент для настройки параметров загрузки файлов.
 * Позволяет настроить типы файлов, размер, количество и текст интерфейса.
 * </summary>
 */
export function FileUploadSettings({ 
  settings = DEFAULT_FILE_UPLOAD_SETTINGS, 
  onChange, 
  readOnly = false 
}: FileUploadSettingsProps) {
  
  const handleChange = (field: keyof FileUploadSettings, value: any) => {
    onChange({
      ...settings,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Допустимые типы файлов */}
      <div className="space-y-2">
        <Label htmlFor="file-allowed-types">Допустимые типы файлов</Label>
        <Select 
          value={settings.allowedTypes[0] || '*'}
          onValueChange={(value) => handleChange('allowedTypes', [value])}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите тип файлов" />
          </SelectTrigger>
                  <SelectContent side="bottom" align="start">
          {FILE_TYPE_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          Какие типы файлов могут загружать пользователи
        </p>
      </div>

      {/* Максимальный размер файла */}
      <div className="space-y-2">
        <Label htmlFor="file-max-size">Максимальный размер файла</Label>
        <Select 
          value={settings.maxFileSize.toString()}
          onValueChange={(value) => handleChange('maxFileSize', parseInt(value))}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите размер" />
          </SelectTrigger>
          <SelectContent side="bottom" align="start">
            {FILE_SIZE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          Максимальный размер одного файла
        </p>
      </div>

      {/* Максимальное количество файлов */}
      <div className="space-y-2">
        <Label htmlFor="file-max-count">Максимальное количество файлов</Label>
        <Input 
          id="file-max-count"
          type="number"
          min={1}
          max={20}
          value={settings.maxFiles}
          onChange={(e) => handleChange('maxFiles', parseInt(e.target.value) || 1)}
          disabled={readOnly}
          placeholder="Количество файлов"
        />
        <p className="text-sm text-gray-500">
          Сколько файлов может загрузить пользователь
        </p>
      </div>

      {/* Текст кнопки */}
      <div className="space-y-2">
        <Label htmlFor="file-button-text">Текст кнопки</Label>
        <Input 
          id="file-button-text"
          value={settings.buttonText || ''}
          onChange={(e) => handleChange('buttonText', e.target.value)}
          disabled={readOnly}
          placeholder="Выберите файлы"
        />
        <p className="text-sm text-gray-500">
          Текст на кнопке выбора файлов
        </p>
      </div>

      {/* Подсказка */}
      <div className="space-y-2">
        <Label htmlFor="file-help-text">Подсказка пользователю</Label>
        <Input 
          id="file-help-text"
          value={settings.helpText || ''}
          onChange={(e) => handleChange('helpText', e.target.value)}
          disabled={readOnly}
          placeholder="Поддерживаются файлы до 10 МБ"
        />
        <p className="text-sm text-gray-500">
          Текст с подсказкой под кнопкой
        </p>
      </div>
    </div>
  );
} 