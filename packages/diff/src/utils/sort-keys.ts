import { cmp } from "./cmp";

export const sortKeys = (arr: string[]): string[] => {
	return arr.toSorted((a, b) => cmp(a, b, { ignoreCase: false }));
};
