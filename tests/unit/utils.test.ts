import { cn, parsePlaceholders } from "../../src/lib/utils";
import { describe, it, expect } from 'vitest';

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

describe('parsePlaceholders edge cases', () => {
  it('should return [] for undefined', () => {
    // @ts-expect-error
    expect(parsePlaceholders(undefined)).toEqual([]);
  });
  it('should return [] for null', () => {
    // @ts-expect-error
    expect(parsePlaceholders(null)).toEqual([]);
  });
  it('should return [] for number', () => {
    // @ts-expect-error
    expect(parsePlaceholders(123)).toEqual([]);
  });
  it('should return [] for array', () => {
    // @ts-expect-error
    expect(parsePlaceholders([1,2,3])).toEqual([]);
  });
  it('should return [] for object', () => {
    // @ts-expect-error
    expect(parsePlaceholders({ foo: 'bar' })).toEqual([]);
  });
}); 