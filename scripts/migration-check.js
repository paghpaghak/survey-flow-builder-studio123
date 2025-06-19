const fs = require('fs');
const path = require('path');

console.log("🔍 Проверка совместимости миграции...");

// Читаем конфиг миграции для определения текущего этапа
let currentStep = 'infrastructure'; // значение по умолчанию
try {
  const migrationConfig = JSON.parse(fs.readFileSync('./migration.config.json', 'utf8'));
  currentStep = migrationConfig.currentStep;
  console.log(`📊 Текущий этап: ${currentStep}`);
} catch (error) {
  console.log("⚠️ migration.config.json не найден, используем этап по умолчанию: infrastructure");
}

// Структуры для проверки в зависимости от этапа
const structures = {
  infrastructure: {
    required: ['./src', './package.json'],
    optional: ['./packages', './apps'], // На этапе infrastructure эти папки ещё не нужны
    files: ['package.json', 'vite.config.ts', 'tsconfig.json']
  },
  'shared-types': {
    required: ['./src', './package.json', './packages'],
    optional: ['./apps'],
    files: ['package.json', 'packages/shared-types/package.json']
  },
  'ui-components': {
    required: ['./src', './package.json', './packages', './packages/shared-types', './packages/ui-components'],
    optional: ['./apps'],
    files: ['package.json', 'packages/ui-components/package.json']
  },
  'survey-widget': {
    required: ['./src', './package.json', './packages', './apps'],
    optional: [],
    files: ['package.json', 'apps/survey-widget/package.json']
  }
};

const currentStructure = structures[currentStep] || structures.infrastructure;

// Проверяем обязательные директории
let hasErrors = false;
currentStructure.required.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(` Найден: ${dir}`);
  } else {
    console.log(` Не найден: ${dir}`);
    hasErrors = true;
  }
});

// Проверяем опциональные директории (только предупреждения)
currentStructure.optional.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(` Найден: ${dir}`);
  } else {
    console.log(` Опционально: ${dir} (появится на следующих этапах)`);
  }
});

// Проверяем файлы конфигурации
currentStructure.files.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      // Проверяем только JSON файлы
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(file, 'utf8');
        // Удаляем BOM если есть
        const cleanContent = content.replace(/^\uFEFF/, '');
        JSON.parse(cleanContent);
      }
      console.log(` Файл корректен: ${file}`);
    } catch (error) {
      console.log(` Ошибка чтения ${file}: ${error.message}`);
      hasErrors = true;
    }
  } else {
    console.log(` Не найден файл: ${file}`);
    hasErrors = true;
  }
});

// Проверяем package.json на workspaces (только для этапов после infrastructure)
if (currentStep !== 'infrastructure' && fs.existsSync('./package.json')) {
  try {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8').replace(/^\uFEFF/, ''));
    if (!pkg.workspaces && currentStep !== 'infrastructure') {
      console.log(" package.json не содержит workspaces configuration");
    }
  } catch (error) {
    console.log(` Ошибка проверки workspaces: ${error.message}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.log(" Найдены проблемы в структуре проекта");
  process.exit(1);
} else {
  console.log(" Структура проекта соответствует текущему этапу");
  process.exit(0);
}
