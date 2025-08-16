import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Repeat2, ChevronDown, ChevronRight } from 'lucide-react';
import { Question } from '@survey-platform/shared-types';
import type { ParallelBranchSettings } from '@/types/question.types';
import { calcContainerSize } from '@/utils/parallelGroupUtils';
import { cn } from '@/lib/utils';

interface ParallelGroupContainerNodeProps {
	data: {
		group: Question;
		children: Question[];
		settings?: Partial<ParallelBranchSettings>;
		expanded: boolean;
		onToggleExpand: (groupId: string) => void;
		layout?: { cols?: number; childWidth?: number; childHeight?: number; gapX?: number; gapY?: number; paddingX?: number; paddingY?: number };
		pageName?: string;
	};
	selected?: boolean;
}

export default function ParallelGroupContainerNode({ data, selected = false }: ParallelGroupContainerNodeProps) {
	const { group, children, settings, expanded, onToggleExpand, layout, pageName } = data;
	const { width, height } = calcContainerSize(children?.length || 0, {
		cols: layout?.cols ?? 2,
		childWidth: layout?.childWidth ?? 250,
		childHeight: layout?.childHeight ?? 110,
		gapX: layout?.gapX ?? 16,
		gapY: layout?.gapY ?? 12,
		paddingX: layout?.paddingX ?? 12,
		paddingY: layout?.paddingY ?? 12,
	});

	return (
		<div
			className={cn(
				'rounded-lg bg-blue-50 border-2 border-dashed border-blue-300 shadow-sm',
				'overflow-hidden relative',
				selected && 'ring-2 ring-blue-500'
			)}
			style={{ width, height: expanded ? height : 64 }}
			role="group"
		>
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2 bg-blue-100 border-b border-blue-200">
				<div className="flex items-center gap-2">
					<button
						className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-blue-200"
						onClick={() => onToggleExpand(group.id)}
						aria-label={expanded ? 'Свернуть' : 'Развернуть'}
					>
						{expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
					</button>
					<Repeat2 className="w-4 h-4 text-blue-600" />
					<div className="font-medium text-sm truncate max-w-[200px]" title={group.title}>{group.title}</div>
					{pageName && (
						<Badge variant="outline" className="text-xs ml-2 max-w-[120px] truncate" title={pageName}>
							{pageName}
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2 text-xs">
					{settings?.itemLabel && <span className="text-blue-700">{settings.itemLabel}</span>}
					{typeof (settings as any)?.minItems === 'number' && typeof (settings as any)?.maxItems === 'number' && (
						<span className="text-blue-700">({(settings as any).minItems}–{(settings as any).maxItems})</span>
					)}
					<Badge variant="secondary">{children?.length || 0}</Badge>
				</div>
			</div>

			{/* Handles for external edges */}
			<Handle type="target" position={Position.Top} id="target" style={{ background: '#3b82f6', width: 8, height: 8 }} />
			<Handle type="source" position={Position.Bottom} id="source" style={{ background: '#3b82f6', width: 8, height: 8 }} />

			{/* Body placeholder (children will be separate nodes with parentNode) */}
			{expanded && (
				<div className="absolute inset-0" aria-hidden="true" />
			)}
		</div>
	);
}


