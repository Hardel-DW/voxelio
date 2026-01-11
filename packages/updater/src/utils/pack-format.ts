import type { MigrationContext } from "@/types";

interface LegacyPackMcmeta {
	pack?: {
		pack_format?: number;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

interface ModernPackMcmeta {
	pack?: {
		min_format?: number;
		max_format?: number;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export function updateLegacyPackFormat(ctx: MigrationContext, version: number): void {
	ctx.transform(/^pack\.mcmeta$/, (content) => {
		const data = JSON.parse(content) as LegacyPackMcmeta;
		if (!data.pack?.pack_format) return undefined;

		data.pack.pack_format = version;
		return JSON.stringify(data, null, 2);
	});
}

export function updateModernPackFormat(ctx: MigrationContext, version: number): void {
	ctx.transform(/^pack\.mcmeta$/, (content) => {
		const data = JSON.parse(content) as ModernPackMcmeta;
		if (!data.pack) return undefined;

		data.pack.max_format = version;
		return JSON.stringify(data, null, 2);
	});
}
