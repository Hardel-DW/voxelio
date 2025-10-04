export interface DiffResult {
	level: number;
	type: "modify" | "add" | "remove" | "equal";
	text: string;
	comma?: boolean;
	lineNumber?: number;
}
