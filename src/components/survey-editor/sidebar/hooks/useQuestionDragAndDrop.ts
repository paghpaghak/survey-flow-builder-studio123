import { DragEndEvent } from '@dnd-kit/core';
import { Question, QUESTION_TYPES } from '@survey-platform/shared-types';

interface useQuestionDragAndDropProps {
  questions: Question[];
  setActiveId: (id: string | null) => void;
  onQuestionOrderChange?: (questions: Question[]) => void;
}

/**
 * НОВАЯ АРХИТЕКТУРА ОПРЕДЕЛЕНИЯ ПОРЯДКА ВОПРОСОВ
 * ================================================
 * 
 * С этого момента sidebar является ТОЛЬКО навигационным интерфейсом.
 * Реальный порядок прохождения вопросов определяется:
 * 
 * 1. ПОЗИЦИЯ В ВИЗУАЛЬНОМ РЕДАКТОРЕ (position.y) - основной критерий
 * 2. TRANSITION RULES - кастомные правила переходов между вопросами
 * 3. УСЛОВНАЯ ЛОГИКА - правила видимости вопросов
 * 
 * Sidebar НЕ влияет на реальный порядок, но сохраняет drag-and-drop
 * для удобства визуальной организации и навигации.
 * 
 * Это решает проблему конфликтов между порядком в sidebar'е и
 * логикой переходов в визуальном редакторе.
 */
export function useQuestionDragAndDrop({
  questions,
  setActiveId,
  onQuestionOrderChange,
}: useQuestionDragAndDropProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // ВАЖНО: Sidebar теперь только для навигации, не влияет на реальный порядок
    // Drag and drop остается для удобства визуальной организации, но не изменяет данные
    
    // Показываем уведомление пользователю о том, что порядок определяется визуальным редактором
    console.log('[Sidebar] Drag and drop в sidebar используется только для навигации. Реальный порядок вопросов определяется визуальным редактором и правилами переходов.');
    
    // Не вызываем onQuestionOrderChange - порядок не изменяется
  };

  return { handleDragEnd };
} 