import { test, expect } from '@playwright/test';

const surveyTitle = `E2E Опрос ${Date.now()}`;

// Удалить все тестовые опросы до и после теста
async function deleteTestSurveys(page) {
  await page.goto('/');
  // Найти все строки с E2E Опрос
  const rows = await page.locator('tr').filter({ hasText: 'E2E Опрос' }).all();
  for (const row of rows) {
    const deleteBtn = row.locator('[title="Удалить"]');
    if (await deleteBtn.count()) {
      await deleteBtn.click();
      // Подтвердить удаление, если появилось модальное окно
      const confirmBtn = page.locator('button', { hasText: 'Удалить' });
      if (await confirmBtn.count()) {
        await confirmBtn.click();
        await page.waitForTimeout(300); // дождаться обновления
      }
    }
  }
}

test.beforeEach(async ({ page }) => {
  // Авторизация перед каждым тестом
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Пароль').fill('admin');
  await page.getByRole('button', { name: /войти/i }).click();
  // Дождаться перехода на главную страницу
  await expect(page).toHaveURL('/');
  await deleteTestSurveys(page);
});

test.afterEach(async ({ page }) => {
  await deleteTestSurveys(page);
});

test('Создание опроса, добавление страницы и вопроса, предпросмотр', async ({ page }) => {
  await page.goto('/');

  // Клик по кнопке создания опроса
  await page.getByTestId('create-survey-btn').click();

  // Вводим уникальное название опроса
  await page.getByTestId('survey-title-input').fill(surveyTitle);
  await page.getByTestId('survey-create-confirm').click();

  // Дождаться закрытия модального окна создания опроса
  await expect(page.getByTestId('survey-create-confirm')).toBeHidden();
  // Дождаться появления строки с новым опросом
  await expect(page.getByRole('row', { name: new RegExp(surveyTitle, 'i') })).toBeVisible();
  // Клик по кнопке "Редактировать" у нужного опроса
  const row = page.getByRole('row', { name: new RegExp(surveyTitle, 'i') });
  await row.getByTestId('edit-survey-btn').click();

  // Дождаться появления кнопки "Добавить страницу"
  await page.getByTestId('add-page-btn').waitFor({ state: 'visible' });
  await page.getByTestId('add-page-btn').click();

  // Дождаться появления второй страницы в сайдбаре
  await expect(page.getByText('Страница 2')).toBeVisible();
  // Выбрать страницу 2
  await page.getByText('Страница 2').click();
  // Добавить вопрос на страницу 2
  await page.getByTestId('add-question-btn').click();
  await expect(page.getByTestId('question-node-title')).toHaveText(/Новый вопрос/i);

  // Открыть предпросмотр (откроется страница 1)
  await page.getByTestId('preview-btn').click();

  const previewModal = page.getByTestId('survey-preview-modal');

  // Проверить, что индикатор страниц отображает "Страница 1 из 2"
  await expect(previewModal.getByText(/Страница 1 из 2/i)).toBeVisible({ timeout: 10000 });

  // Проверить, что на первой странице нет вопроса "Новый вопрос 1"
  await expect(previewModal.getByText(/Новый вопрос 1/i)).not.toBeVisible({ timeout: 1000 });

  // Дождаться появления и активации кнопки "Далее"
  const nextBtn = previewModal.getByRole('button', { name: /Далее/i });
  await nextBtn.click({ force: true });

  // Сделать скриншот после клика по "Далее"
  await page.screenshot({ path: 'after-next.png' });

  // Явно дождаться появления индикатора второй страницы и вопроса с увеличенным таймаутом
  await expect(previewModal.getByText(/Страница 2 из 2/i)).toBeVisible({ timeout: 15000 });
  await expect(previewModal.getByText(/Новый вопрос 1/i)).toBeVisible({ timeout: 15000 });
}); 