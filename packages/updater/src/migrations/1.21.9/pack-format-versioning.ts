import type { Migration } from "@/types";

type FormatRange = number | [number, number] | { min_inclusive: number; max_inclusive: number };

interface PackMcmeta {
	pack?: {
		pack_format?: number;
		supported_formats?: FormatRange;
		min_format?: number;
		max_format?: number;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export const packFormatVersioning: Migration = {
	id: "1.21.9/pack-format-versioning",
	description: "Convert pack.mcmeta to new min_format/max_format versioning system",
	migrate(ctx) {
		ctx.transform(/^pack\.mcmeta$/, (content) => {
			const data = JSON.parse(content) as PackMcmeta;
			if (!data.pack) return undefined;

			const { min, max } = extractRange(data.pack.supported_formats, data.pack.pack_format);
			if (min === undefined || max === undefined) return undefined;

			data.pack.min_format = min;
			data.pack.max_format = max;
			delete data.pack.pack_format;
			delete data.pack.supported_formats;

			return JSON.stringify(data, null, 2);
		});
	},
};

function extractRange(
	formats: FormatRange | undefined,
	packFormat: number | undefined
): { min: number | undefined; max: number | undefined } {
	if (formats === undefined) {
		if (packFormat === undefined) return { min: undefined, max: undefined };
		return { min: packFormat, max: packFormat };
	}

	if (typeof formats === "number") {
		return { min: formats, max: formats };
	}

	if (Array.isArray(formats)) {
		return { min: formats[0], max: formats[1] };
	}

	return { min: formats.min_inclusive, max: formats.max_inclusive };
}
