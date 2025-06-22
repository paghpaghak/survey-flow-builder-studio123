import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Question, ResolutionRule, QuestionType } from '@survey-platform/shared-types';
import { Trash, Plus } from 'lucide-react';

interface ResolutionEditDialogProps {
  resolutionQuestion: Question;
  questions: Question[];
  open: boolean;
  onSave: (updated: Question) => void;
  onClose: () => void;
}

const OPERATORS = [
  { value: '==', label: 'равно' },
  { value: '!=', label: 'не равно' },
  { value: '>', label: 'больше' },
  { value: '<', label: 'меньше' },
  { value: 'includes', label: 'содержит' },
];

export default function ResolutionEditDialog({ resolutionQuestion, questions, open, onSave, onClose }: ResolutionEditDialogProps) {
  const [rules, setRules] = useState<ResolutionRule[]>(resolutionQuestion.resolutionRules || []);
  const [defaultResult, setDefaultResult] = useState(resolutionQuestion.defaultResolution || '');

  function handleAddRule() {
    setRules([...rules, {
      id: crypto.randomUUID(),
      conditions: [{ questionId: '', operator: '==', value: '' }],
      logic: 'AND',
      resultText: '',
    }]);
  }

  function handleSave() {
    onSave({ ...resolutionQuestion, resolutionRules: rules, defaultResolution: defaultResult });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Настройка резолюции</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 min-h-0 max-h-[60vh] pr-1">
          <div>
            <label className="font-medium">Правила (первое сработавшее):</label>
            <div className="space-y-4 mt-2">
              {rules.map((rule, idx) => (
                <div key={rule.id} className="border rounded p-3 bg-gray-50 relative">
                  <div className="absolute top-2 right-2">
                    <Button size="icon" variant="ghost" onClick={() => setRules(rules.filter(r => r.id !== rule.id))}><Trash className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">Условия:</span>
                    <Select value={rule.logic} onValueChange={logic => setRules(rules.map(r => r.id === rule.id ? { ...r, logic: logic as 'AND' | 'OR' } : r))}>
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">И</SelectItem>
                        <SelectItem value="OR">ИЛИ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {rule.conditions.map((cond, cidx) => (
                    <div key={cidx} className="flex items-center gap-2 mb-1">
                      <Select value={cond.questionId} onValueChange={qid => setRules(rules.map(r => r.id === rule.id ? { ...r, conditions: r.conditions.map((c, i) => i === cidx ? { ...c, questionId: qid } : c) } : r))}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Вопрос" /></SelectTrigger>
                        <SelectContent>
                          {Array.from(new Map(questions.filter(q => q.type !== QUESTION_TYPES.Resolution).map(q => [q.title, q])).values()).map(q => (
                            <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={cond.operator} onValueChange={op => setRules(rules.map(r => r.id === rule.id ? { ...r, conditions: r.conditions.map((c, i) => i === cidx ? { ...c, operator: op } : c) } : r))}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map(op => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={cond.value}
                        onChange={e => setRules(rules.map(r => r.id === rule.id ? { ...r, conditions: r.conditions.map((c, i) => i === cidx ? { ...c, value: e.target.value } : c) } : r))}
                        className="w-32"
                        placeholder="Значение"
                      />
                      <Button size="icon" variant="ghost" onClick={() => setRules(rules.map(r => r.id === rule.id ? { ...r, conditions: r.conditions.filter((_, i) => i !== cidx) } : r))}><Trash className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setRules(rules.map(r => r.id === rule.id ? { ...r, conditions: [...r.conditions, { questionId: '', operator: '==', value: '' }] } : r))}>
                    <Plus className="w-4 h-4 mr-1" /> Добавить условие
                  </Button>
                  <div className="mt-3">
                    <label className="text-xs text-gray-500">Текст результата:</label>
                    <Input
                      value={rule.resultText}
                      onChange={e => setRules(rules.map(r => r.id === rule.id ? { ...r, resultText: e.target.value } : r))}
                      className="mt-1"
                      placeholder="Текст, который увидит пользователь, если правило выполнено"
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={handleAddRule}><Plus className="w-4 h-4 mr-1" />Добавить правило</Button>
            </div>
          </div>
          <div>
            <label className="font-medium">Результат по умолчанию:</label>
            <Input
              value={defaultResult}
              onChange={e => setDefaultResult(e.target.value)}
              className="mt-1 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-primary focus:border-primary z-10"
              placeholder="Текст, если ни одно правило не выполнено"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 