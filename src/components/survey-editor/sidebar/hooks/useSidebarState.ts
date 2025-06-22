import { useState, useRef } from 'react';

export function useSidebarState() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionTitle, setEditingQuestionTitle] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});
  const [confirmDeleteParallelId, setConfirmDeleteParallelId] = useState<string | null>(null);
  const [editPageId, setEditPageId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState<string>('');
  const [descriptionPosition, setDescriptionPosition] = useState('before');
  const descriptionRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  function handleInsertVariable(questionId: string, pageId: string) {
    const textarea = descriptionRefs.current[pageId];
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = editDescription.slice(0, start);
    const after = editDescription.slice(end);
    const variable = `{{${questionId}}}`;
    setEditDescription(before + variable + after);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 0);
  }

  return {
    activeId,
    setActiveId,
    editingPageId,
    setEditingPageId,
    editingTitle,
    setEditingTitle,
    editingQuestionId,
    setEditingQuestionId,
    editingQuestionTitle,
    setEditingQuestionTitle,
    expandedGroups,
    setExpandedGroups,
    expandedPages,
    setExpandedPages,
    confirmDeleteParallelId,
    setConfirmDeleteParallelId,
    editPageId,
    setEditPageId,
    editDescription,
    setEditDescription,
    descriptionPosition,
    setDescriptionPosition,
    descriptionRefs,
    handleInsertVariable,
  };
} 