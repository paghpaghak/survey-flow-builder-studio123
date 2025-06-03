import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Scale } from 'lucide-react';

export default function ResolutionNode({ data, selected = false }) {
  return (
    <div
      className={cn(
        'rounded-lg p-4 bg-white border-2 w-[260px] flex flex-col items-center justify-center shadow-md transition-all',
        selected ? 'border-blue-600 shadow-lg z-10' : 'border-blue-400',
        'relative'
      )}
      style={{ minHeight: 90 }}
      tabIndex={0}
      aria-label="Резолюция"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl text-blue-600"><Scale className="w-6 h-6" /></span>
        <span className="font-bold text-lg text-blue-700">Резолюция</span>
      </div>
      <div className="text-xs text-gray-500 text-center">
        Итоговый блок. Здесь отображается результат на основании введённых ответов.
      </div>
      {/* Нет Handle для edges: нельзя соединять */}
    </div>
  );
} 