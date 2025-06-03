import { Handle, Position } from '@xyflow/react';
import { Question, QuestionType } from '@/types/survey';
import { Button } from '@/components/ui/button';
import { Trash, Pencil, Users, GripVertical, Repeat2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuestionNodeProps {
  data: {
    question: Question;
    onDelete: (id: string) => void;
    onEdit: (question: Question) => void;
    onEditClick: (question: Question) => void;
    pages?: { id: string; title: string }[];
    pageName: string;
  };
  selected?: boolean;
}

export default function QuestionNode({ data, selected = false }: QuestionNodeProps) {
  const { question, onDelete, onEditClick, pageName } = data;

  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case QuestionType.Text:
        return 'Текст';
      case QuestionType.Radio:
        return 'Один из списка';
      case QuestionType.Checkbox:
        return 'Несколько из списка';
      case QuestionType.Select:
        return 'Выпадающий список';
      case QuestionType.Date:
        return 'Дата';
      case QuestionType.Email:
        return 'Email';
      case QuestionType.Phone:
        return 'Телефон';
      case QuestionType.Number:
        return 'Число';
      case QuestionType.ParallelGroup:
        return 'Параллельная ветка';
      default:
        return type;
    }
  };

  const isParallelGroup = question.type === QuestionType.ParallelGroup;

  return (
    <div 
      className={cn(
        'rounded-lg shadow-md p-4 bg-white border w-[250px] transition-all',
        selected ? 'border-2 border-blue-500 shadow-lg z-10' : 'border border-gray-200',
        isParallelGroup && 'border-2 border-dashed'
      )}
      role="button"
      tabIndex={0}
      aria-label={`Вопрос: ${question.title}`}
      data-testid="question-node-title"
    >
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        isConnectable={true}
        style={{ background: '#3b82f6', width: '8px', height: '8px' }}
      />
      
      <div className="drag-handle cursor-move">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs max-w-[120px] truncate" title={pageName}>
            {pageName}
          </Badge>
        </div>
        <div 
          className="text-sm font-medium mb-1 truncate flex items-center gap-1" 
          title={question.title}
        >
          {isParallelGroup && <Repeat2 className="w-4 h-4 text-blue-500 flex-shrink-0" />}
          {question.title}
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <div>Тип: {isParallelGroup ? 'Параллельная ветка' : getQuestionTypeLabel(question.type)}</div>
          {question.required && <div>• Обязательный</div>}
        </div>
      </div>

      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onEditClick(question)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onDelete(question.id)}
        >
          <Trash className="h-3 w-3" />
        </Button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        isConnectable={true}
        style={{ background: '#3b82f6', width: '8px', height: '8px' }}
      />
    </div>
  );
}
