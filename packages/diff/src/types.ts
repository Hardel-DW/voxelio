export interface DiffResult {
	level: number;
	type: "modify" | "add" | "remove" | "equal";
	text: string;
	comma?: boolean;
	lineNumber?: number;
}

export interface DifferOptions {
	detectCircular: true;
	maxDepth: null;
	showModifications: true;
	arrayDiffMethod: "unorder-lcs";
	ignoreCase: false;
	ignoreCaseForKey: false;
	recursiveEqual: true;
	preserveKeyOrder: "before";
	undefinedBehavior: "stringify";
}

export type ArrayDiffFunc = (
	arrLeft: unknown[],
	arrRight: unknown[],
	keyLeft: string,
	keyRight: string,
	level: number,
	options: DifferOptions,
	linesLeft?: DiffResult[],
	linesRight?: DiffResult[]
) => [DiffResult[], DiffResult[]];
