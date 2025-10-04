import { cmp } from "./cmp";

interface Options {
	ignoreCaseForKey?: boolean;
}

export const sortKeys = (arr: string[], options: Options): string[] => {
	return arr.toSorted((a, b) => cmp(a, b, { ignoreCase: options.ignoreCaseForKey }));
};
