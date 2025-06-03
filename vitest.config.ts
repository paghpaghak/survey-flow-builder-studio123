import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // для тестов React-компонентов и DOM-утилит
    globals: true,        // чтобы не писать import { describe, it, expect } в каждом файле
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
  },
}); 