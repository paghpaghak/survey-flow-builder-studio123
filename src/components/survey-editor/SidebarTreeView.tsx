import React from 'react';
import { Tree, TreeApi } from 'react-arborist';
import { Page, Question } from '@/types/survey';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SidebarTreeViewProps {
  pages: Page[];
  questions: Question[];
  selectedPageId?: string;
  selectedQuestionId?: string;
  onSelectPage: (pageId: string) => void;
  onSelectQuestion: (questionId: string | undefined) => void;
}

type TreeNodeData = {
  id: string;
  type: 'page' | 'question';
  title: string;
  parentId?: string;
};

function buildTreeData(pages: Page[], questions: Question[]): TreeNodeData[] {
  const nodes: TreeNodeData[] = [];
  for (const page of pages) {
    nodes.push({ id: page.id, type: 'page', title: page.title });
    for (const q of questions.filter(q => q.pageId === page.id)) {
      nodes.push({ id: q.id, type: 'question', title: q.title || 'Без названия', parentId: page.id });
    }
  }
  return nodes;
}

export const SidebarTreeView: React.FC<SidebarTreeViewProps> = ({
  pages,
  questions,
  selectedPageId,
  selectedQuestionId,
  onSelectPage,
  onSelectQuestion,
}) => {
  const treeData = buildTreeData(pages, questions);

  return (
    <div className="p-2">
      <Tree
        data={treeData}
        openByDefault={true}
        rowHeight={48}
        width={320}
        height={400}
        indent={28}
        disableMultiSelection
        selection={selectedQuestionId || selectedPageId || null}
        onSelect={(node) => {
          if (!node || !node.data) return;
          if (node.data.type === 'page') {
            onSelectPage(node.data.id);
            onSelectQuestion(undefined);
          }
          if (node.data.type === 'question') onSelectQuestion(node.data.id);
        }}
        renderRow={({ node, style, select }) => {
          const isPage = node.data.type === 'page';
          const isSelected =
            (isPage && node.data.id === selectedPageId) ||
            (!isPage && node.data.id === selectedQuestionId);
          return (
            <div
              style={style}
              onClick={() => {
                console.log('Клик по странице/вопросу', node.data);
                if (select) select();
              }}
              className={cn(
                'transition-all cursor-pointer select-none w-full',
                isPage
                  ? 'mb-3 px-3 py-2 rounded font-medium'
                  : 'px-3 py-1 rounded text-sm flex items-center gap-2 bg-gray-50 border-l-4 pl-6',
                isSelected
                  ? isPage
                    ? 'border-2 border-primary bg-blue-100 shadow-lg'
                    : 'border-primary bg-primary/10 shadow border-l-blue-400'
                  : isPage
                    ? 'hover:border-primary/50'
                    : 'hover:border-primary/30 border-l-blue-100',
              )}
            >
              <span className={cn('truncate block', isPage ? '' : 'text-gray-700')}>{node.data.title}</span>
            </div>
          );
        }}
        parentIdAccessor={(node) => node.parentId}
        idAccessor={(node) => node.id}
      />
    </div>
  );
}; 