import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { TextSettings, INPUT_MASK_OPTIONS, DEFAULT_TEXT_SETTINGS } from '@survey-platform/shared-types';

interface TextSettingsProps {
  settings?: TextSettings;
  onChange: (settings: TextSettings) => void;
  readOnly?: boolean;
}

export function TextSettings({ settings = DEFAULT_TEXT_SETTINGS, onChange, readOnly }: TextSettingsProps) {
  const handleMaskChange = (mask: string) => {
    onChange({
      ...settings,
      inputMask: mask === 'custom' ? settings.inputMask || '' : (mask || undefined)
    });
  };

  const handleCustomMaskChange = (customMask: string) => {
    onChange({
      ...settings,
      inputMask: customMask || undefined
    });
  };

  const handleShowTitleInsideChange = (checked: boolean) => {
    onChange({
      ...settings,
      showTitleInside: checked
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="input-mask">Маска ввода</Label>
        <Select
          value={
            settings.inputMask && 
            !INPUT_MASK_OPTIONS.find(opt => opt.value === settings.inputMask) 
              ? 'custom' 
              : settings.inputMask || 'none'
          }
          onValueChange={(value) => handleMaskChange(value === 'none' ? '' : value)}
          disabled={readOnly}
        >
          <SelectTrigger id="input-mask">
            <SelectValue placeholder="Выберите маску ввода" />
          </SelectTrigger>
          <SelectContent>
            {INPUT_MASK_OPTIONS.map((option) => (
              <SelectItem key={option.value || 'none'} value={option.value || 'none'}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Поле для кастомной маски */}
        {(settings.inputMask && !INPUT_MASK_OPTIONS.find(opt => opt.value === settings.inputMask)) && (
          <div className="mt-3">
            <Label htmlFor="custom-mask">Своя маска</Label>
            <Input
              id="custom-mask"
              type="text"
              value={settings.inputMask || ''}
              onChange={(e) => handleCustomMaskChange(e.target.value)}
              placeholder="Например: 00:00:0000000:000"
              disabled={readOnly}
            />
            <div className="mt-2 text-xs text-gray-500">
              <p className="mb-1">
                <strong>Символы маски:</strong> <span className="font-mono">0</span> - цифра, <span className="font-mono">A</span> - заглавная буква, <span className="font-mono">a</span> - строчная буква
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-700">💡 Примеры масок</summary>
                <div className="mt-2 space-y-1 text-xs bg-white p-2 rounded border">
                  <div><span className="font-mono">AA 000000</span> - Серия и номер паспорта</div>
                  <div><span className="font-mono">000-00-00</span> - Короткий телефон</div>
                  <div><span className="font-mono">aaaa@aaaa.aa</span> - Email шаблон</div>
                  <div><span className="font-mono">00/00/00</span> - Дата (ДД/ММ/ГГ)</div>
                  <div><span className="font-mono">AAA000AAA</span> - Номер автомобиля</div>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Предпросмотр маски */}
        {settings.inputMask && settings.inputMask !== 'none' && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <p className="text-gray-600 mb-1">Пример маски:</p>
            <p className="font-mono bg-white px-2 py-1 rounded border">
              {settings.inputMask}
            </p>
            <p className="text-gray-500 mt-1">
              Где: <span className="font-mono">0</span> - цифра, <span className="font-mono">A</span> - заглавная буква, <span className="font-mono">a</span> - строчная буква, <span className="font-mono">_</span> - заполнитель
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="showTitleInside"
          checked={settings.showTitleInside || false}
          onCheckedChange={handleShowTitleInsideChange}
          disabled={readOnly}
        />
        <Label htmlFor="showTitleInside" className="text-sm font-normal">
          Показывать заголовок вопроса внутри поля ввода
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                При включении этой опции заголовок вопроса будет отображаться как placeholder внутри поля ввода, а сам заголовок над полем будет скрыт
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
} 