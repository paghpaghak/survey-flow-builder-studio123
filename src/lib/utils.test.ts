import { cn } from './utils';

describe('cn', () => {
  it('объединяет простые классы', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('игнорирует falsy значения', () => {
    expect(cn('a', false && 'b', null, undefined, '')).toBe('a');
  });

  it('объединяет классы с условиями', () => {
    const isActive = true;
    expect(cn('btn', isActive && 'btn-active')).toBe('btn btn-active');
  });

  it('объединяет классы с массивами', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('оставляет дублирующиеся классы, если они не конфликтуют по Tailwind', () => {
    expect(cn('a', 'a', 'b')).toBe('a a b');
  });

  it('оставляет только последний конфликтующий Tailwind-класс', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
}); 