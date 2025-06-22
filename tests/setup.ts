import '@testing-library/jest-dom'
import { vi } from 'vitest'

const originalFetch = global.fetch

global.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url
  
  if (url.startsWith('/')) {
    const newUrl = `http://localhost:3001${url}`
    const newRequest = new Request(newUrl, {
      ...input instanceof Request ? input : {},
      ...init,
    });
    return originalFetch(newRequest);
  }
  
  return originalFetch(input, init);
}

// Мокаем matchMedia, так как он не существует в JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
}); 