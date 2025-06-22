import {
  Mail,
  Type,
  CheckSquare,
  List,
  ChevronDownSquare,
  Calendar,
  Phone,
  Hash,
  Combine,
  GitCommitVertical,
} from 'lucide-react';
import { Handle, Position } from '@xyflow/react';
import { Question, QuestionType, QUESTION_TYPES } from '@survey-platform/shared-types';
import { Button } from '@/components/ui/button';
import { Trash, Pencil, Users, GripVertical, Repeat2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSurveyStore } from '@/store/survey-store';
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

const getIcon = (type: QuestionType) => {
  switch (type) {
    case QUESTION_TYPES.Text:
      return <Type size={16} />;
    case QUESTION_TYPES.Radio:
      return <List size={16} />;
    case QUESTION_TYPES.Checkbox:
      return <CheckSquare size={16} />;
    case QUESTION_TYPES.Select:
      return <ChevronDownSquare size={16} />;
    case QUESTION_TYPES.Date:
      return <Calendar size={16} />;
    case QUESTION_TYPES.Email:
      return <Mail size={16} />;
    case QUESTION_TYPES.Phone:
      return <Phone size={16} />;
    case QUESTION_TYPES.Number:
      return <Hash size={16} />;
    case QUESTION_TYPES.ParallelGroup:
      return <Combine size={16} />;
    default:
      return <Type size={16} />;
  }
};

export default function QuestionNode({ data, selected = false }: QuestionNodeProps) {
  const { question, onDelete, onEditClick, pageName } = data;

  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case QUESTION_TYPES.Text:
        return 'Текст';
      case QUESTION_TYPES.Radio:
        return 'Один из списка';
      case QUESTION_TYPES.Checkbox:
        return 'Несколько из списка';
      case QUESTION_TYPES.Select:
        return 'Выпадающий список';
      case QUESTION_TYPES.Date:
        return 'Дата';
      case QUESTION_TYPES.Email:
        return 'Email';
      case QUESTION_TYPES.Phone:
        return 'Телефон';
      case QUESTION_TYPES.Number:
        return 'Число';
      case QUESTION_TYPES.ParallelGroup:
        return 'Параллельная ветка';
      default:
        return 'Неизвестный тип';
    }
  };

  const isParallelGroup = question.type === QUESTION_TYPES.ParallelGroup;
  const isResolution = question.type === 'resolution';

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
