import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, FileIcon, Upload } from 'lucide-react';
import { FileUploadSettings, UploadedFile, FileUploadAnswer } from '@survey-platform/shared-types';

interface FileUploadInputProps {
  settings: FileUploadSettings;
  value?: FileUploadAnswer;
  onChange: (value: FileUploadAnswer) => void;
  disabled?: boolean;
  surveyId?: string;
  questionId?: string;
}

/**
 * <summary>
 * Компонент для загрузки файлов (MVP версия).
 * Позволяет выбирать файлы, валидирует их и отображает список выбранных файлов.
 * В MVP файлы только выбираются, реальная загрузка на сервер не происходит.
 * </summary>
 */
export function FileUploadInput({ 
  settings, 
  value = { files: [] }, 
  onChange, 
  disabled = false,
  surveyId,
  questionId
}: FileUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Валидация файла
  const validateFile = (file: File): string | null => {
    // Проверяем размер
    if (file.size > settings.maxFileSize) {
      const sizeMB = Math.round(settings.maxFileSize / (1024 * 1024));
      return `Файл "${file.name}" слишком большой. Максимальный размер: ${sizeMB} МБ`;
    }

    // Проверяем тип файла (базовая проверка)
    if (settings.allowedTypes.length > 0 && !settings.allowedTypes.includes('*')) {
      const allowedType = settings.allowedTypes[0];
      
      if (allowedType.includes('*')) {
        // Проверка по категории (например, image/*)
        const category = allowedType.split('/')[0];
        if (!file.type.startsWith(category + '/')) {
          return `Недопустимый тип файла "${file.name}". Разрешены только: ${allowedType}`;
        }
      } else if (allowedType.startsWith('.')) {
        // Проверка по расширению (.doc, .pdf и т.д.)
        const extensions = allowedType.split(',');
        const fileName = file.name.toLowerCase();
        const hasValidExtension = extensions.some(ext => 
          fileName.endsWith(ext.trim().toLowerCase())
        );
        if (!hasValidExtension) {
          return `Недопустимый тип файла "${file.name}". Разрешены только: ${allowedType}`;
        }
      } else {
        // Проверка по MIME типу
        if (file.type !== allowedType) {
          return `Недопустимый тип файла "${file.name}". Разрешен только: ${allowedType}`;
        }
      }
    }

    return null;
  };

  // Загрузка файла на сервер
  const uploadFileToServer = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (surveyId) formData.append('surveyId', surveyId);
    if (questionId) formData.append('questionId', questionId);

    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка загрузки файла');
    }

    const result = await response.json();
    
    return {
      id: result.fileId,
      name: result.filename,
      size: result.size,
      type: result.mimetype,
      uploadedAt: new Date().toISOString(),
      serverFileId: result.fileId, // Добавляем ID файла на сервере
    };
  };

  // Обработка выбора файлов
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setError('');

    if (selectedFiles.length === 0) return;

    // Проверяем общее количество файлов
    const totalFiles = value.files.length + selectedFiles.length;
    if (totalFiles > settings.maxFiles) {
      setError(`Можно выбрать максимум ${settings.maxFiles} файлов`);
      return;
    }

    // Валидируем каждый файл
    for (const file of selectedFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Загружаем файлы на сервер
    setIsUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (const file of selectedFiles) {
        const uploadedFile = await uploadFileToServer(file);
        uploadedFiles.push(uploadedFile);
      }

      // Добавляем файлы к существующим
      const newValue: FileUploadAnswer = {
        files: [...value.files, ...uploadedFiles]
      };

      onChange(newValue);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка загрузки файлов');
    } finally {
      setIsUploading(false);
    }

    // Очищаем input для возможности повторного выбора тех же файлов
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Удаление файла
  const removeFile = (fileId: string) => {
    const newValue: FileUploadAnswer = {
      files: value.files.filter(f => f.id !== fileId)
    };
    onChange(newValue);
    setError('');
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Создаем строку accept для input
  const getAcceptString = (): string => {
    if (settings.allowedTypes.includes('*')) return '*/*';
    return settings.allowedTypes.join(',');
  };

  return (
    <div className="space-y-3">
      {/* Кнопка выбора файлов */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || value.files.length >= settings.maxFiles || isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Загрузка...' : (settings.buttonText || 'Выберите файлы')}
        </Button>
        
        {value.files.length > 0 && (
          <span className="text-sm text-gray-500">
            {value.files.length} из {settings.maxFiles} файлов
          </span>
        )}
      </div>

      {/* Скрытый input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={settings.maxFiles > 1}
        accept={getAcceptString()}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Подсказка */}
      {settings.helpText && (
        <p className="text-sm text-gray-500">{settings.helpText}</p>
      )}

      {/* Ошибка */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Список выбранных файлов */}
      {value.files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Выбранные файлы:</p>
          <div className="space-y-2">
            {value.files.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.type || 'Неизвестный тип'}
                    </p>
                  </div>
                </div>
                
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 