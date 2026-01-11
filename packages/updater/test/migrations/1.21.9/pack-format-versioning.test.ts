import { describe, expect, it } from "vitest";
import { createContext } from "@/context";
import { packFormatVersioning } from "@/migrations/1.21.9/pack-format-versioning";

function applyMigration(content: string): string {
	const files: Record<string, Uint8Array> = {
		"pack.mcmeta": new TextEncoder().encode(content),
	};
	const ctx = createContext(files, []);
	packFormatVersioning.migrate(ctx);
	return new TextDecoder().decode(files["pack.mcmeta"]);
}

describe("packFormatVersioning", () => {
	it("should convert pack_format only to min_format and max_format", () => {
		const input = JSON.stringify({ pack: { pack_format: 48, description: "Test" } });
		const result = JSON.parse(applyMigration(input));

		expect(result.pack.min_format).toBe(48);
		expect(result.pack.max_format).toBe(48);
		expect(result.pack.pack_format).toBeUndefined();
		expect(result.pack.description).toBe("Test");
	});

	it("should convert supported_formats object with min_inclusive/max_inclusive", () => {
		const input = JSON.stringify({ pack: { pack_format: 48, supported_formats: { min_inclusive: 40, max_inclusive: 60 } } });
		const result = JSON.parse(applyMigration(input));

		expect(result.pack.min_format).toBe(40);
		expect(result.pack.max_format).toBe(60);
		expect(result.pack.supported_formats).toBeUndefined();
	});

	it("should preserve overlays without modification", () => {
		const input = JSON.stringify({
			pack: { pack_format: 48 },
			overlays: {
				entries: [{ directory: "overlay_1", formats: [50, 55] }],
			},
		});
		const result = JSON.parse(applyMigration(input));

		expect(result.overlays.entries[0].formats).toEqual([50, 55]);
		expect(result.overlays.entries[0].directory).toBe("overlay_1");
	});
});
