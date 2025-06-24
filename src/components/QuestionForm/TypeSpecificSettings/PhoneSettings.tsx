import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneQuestionSettings } from '@survey-platform/shared-types';
import { DEFAULT_PHONE_SETTINGS } from '@survey-platform/shared-types';

interface PhoneSettingsProps {
  settings?: PhoneQuestionSettings;
  onChange: (settings: PhoneQuestionSettings) => void;
  readOnly?: boolean;
}

/**
 * <summary>
 * Компонент для настройки параметров телефонного поля.
 * Позволяет настроить код страны и маску ввода.
 * </summary>
 */
export function PhoneSettings({ 
  settings = DEFAULT_PHONE_SETTINGS, 
  onChange, 
  readOnly = false 
}: PhoneSettingsProps) {
  
  const handleCountryCodeChange = (countryCode: string) => {
    onChange({
      ...settings,
      countryCode
    });
  };

  const handleMaskChange = (mask: string) => {
    onChange({
      ...settings,
      mask
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone-country-code">Код страны</Label>
        <Input 
          id="phone-country-code"
          value={settings.countryCode}
          onChange={e => handleCountryCodeChange(e.target.value)}
          disabled={readOnly}
          placeholder="+7"
        />
        <p className="text-sm text-gray-500">
          Код страны, который будет отображаться перед полем ввода
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone-mask">Маска ввода</Label>
        <Input 
          id="phone-mask"
          value={settings.mask}
          onChange={e => handleMaskChange(e.target.value)}
          disabled={readOnly}
          placeholder="(###) ###-##-##"
        />
        <p className="text-sm text-gray-500">
          Используйте # для обозначения цифр. Например: (###) ###-##-##
        </p>
      </div>
    </div>
  );
}