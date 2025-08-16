import { QUESTION_TYPES, type Question } from '@survey-platform/shared-types';

/**
 * Find a parent ParallelGroup question for the provided child question id
 */
export function findParentGroup(questionId: string, allQuestions: Question[]): Question | null {
	return (
		allQuestions.find(
			(q) => q.type === QUESTION_TYPES.ParallelGroup && (q.parallelQuestions || []).includes(questionId)
		) || null
	);
}

/**
 * Resolve nested questions for a ParallelGroup question id
 */
export function getNestedQuestions(groupId: string, allQuestions: Question[]): Question[] {
	const group = allQuestions.find((q) => q.id === groupId);
	if (!group || !Array.isArray(group.parallelQuestions)) return [];
	return group.parallelQuestions
		.map((id) => allQuestions.find((q) => q.id === id))
		.filter((q): q is Question => Boolean(q));
}

/**
 * Whether a question is nested under a ParallelGroup
 */
export function isNested(questionId: string, allQuestions: Question[]): boolean {
	return findParentGroup(questionId, allQuestions) !== null;
}

/**
 * Build quick lookup maps for groups and nested membership
 */
export function buildParallelIndexes(allQuestions: Question[]): {
	groupIdToChildren: Map<string, Question[]>;
	childIdToParentId: Map<string, string>;
} {
	const groupIdToChildren = new Map<string, Question[]>();
	const childIdToParentId = new Map<string, string>();

	allQuestions.forEach((q) => {
		if (q.type === QUESTION_TYPES.ParallelGroup && Array.isArray(q.parallelQuestions)) {
			const children = q.parallelQuestions
				.map((id) => allQuestions.find((x) => x.id === id))
				.filter((x): x is Question => Boolean(x));
			groupIdToChildren.set(q.id, children);
			children.forEach((child) => childIdToParentId.set(child.id, q.id));
		}
	});

	return { groupIdToChildren, childIdToParentId };
}

/**
 * Calculate a simple grid position for a child inside its parent container
 */
export function calcChildGridPosition(index: number, options?: { cols?: number; gapX?: number; gapY?: number; childWidth?: number; childHeight?: number; paddingX?: number; paddingY?: number; headerHeight?: number; }): { x: number; y: number } {
	const cols = options?.cols ?? 2;
	const gapX = options?.gapX ?? 16;
	const gapY = options?.gapY ?? 12;
	const childWidth = options?.childWidth ?? 250;
	const childHeight = options?.childHeight ?? 110;
	const paddingX = options?.paddingX ?? 12;
	const paddingY = options?.paddingY ?? 12;
	const headerHeight = options?.headerHeight ?? 48;

	const col = index % cols;
	const row = Math.floor(index / cols);

	const x = paddingX + col * (childWidth + gapX);
	const y = headerHeight + paddingY + row * (childHeight + gapY);
	return { x, y };
}

/**
 * Calculate container size to fit N children with a grid
 */
export function calcContainerSize(childrenCount: number, options?: { cols?: number; gapX?: number; gapY?: number; childWidth?: number; childHeight?: number; paddingX?: number; paddingY?: number; headerHeight?: number; minWidth?: number; }): { width: number; height: number } {
	const cols = options?.cols ?? Math.min(3, Math.max(1, Math.ceil(Math.sqrt(childrenCount || 1))));
	const gapX = options?.gapX ?? 16;
	const gapY = options?.gapY ?? 12;
	const childWidth = options?.childWidth ?? 250;
	const childHeight = options?.childHeight ?? 110;
	const paddingX = options?.paddingX ?? 12;
	const paddingY = options?.paddingY ?? 12;
	const headerHeight = options?.headerHeight ?? 48;
	const minWidth = options?.minWidth ?? 280;

	const rows = Math.ceil((childrenCount || 1) / cols);
	const width = Math.max(minWidth, paddingX * 2 + cols * childWidth + (cols - 1) * gapX);
	const height = headerHeight + paddingY * 2 + rows * childHeight + (rows - 1) * gapY;
	return { width, height };
}


