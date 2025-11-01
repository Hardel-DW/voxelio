import { describe, it, expect } from "vitest";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";
import { updateData } from "@/core/engine/actions/index";
import { compileDatapack } from "@/core/engine/Compiler";
import { Datapack } from "@/core/Datapack";
import type { EnchantmentProps } from "@/core/schema/enchant/types";
import { createZipFile } from "@test/mock/utils";
import { attackSpeed } from "@test/mock/enchant/DataDriven";
import { Differ } from "@voxelio/diff";
import { extractZip } from "@voxelio/zip";

describe("Indentation Preservation E2E", () => {
	it("should preserve original file indentation (2 spaces)", async () => {
		const files: Record<string, Uint8Array> = {};
		files["pack.mcmeta"] = new TextEncoder().encode(JSON.stringify({ pack: { pack_format: 61, description: "test" } }, null, 2));
		files["data/enchantplus/enchantment/sword/attack_speed.json"] = new TextEncoder().encode(
			JSON.stringify(attackSpeed.data, null, 2)
		);

		const zipFile = await createZipFile(files);
		const datapack = await Datapack.from(zipFile);
		const parsed = datapack.parse();
		const parsedEnchantment = Array.from(parsed.elements.values()).find((el) => el.identifier.resource === "sword/attack_speed") as
			| EnchantmentProps
			| undefined;

		if (!parsedEnchantment) throw new Error("Enchantment not found");
		const action = CoreAction.setValue("maxLevel", 5);
		const updated = parsed.logger.trackChanges(parsedEnchantment, (el) => updateData<EnchantmentProps>(action, el));

		const compiled = compileDatapack({
			elements: [updated as EnchantmentProps],
			files: parsed.files
		});

		const downloaded = await compiled.generate(parsed.logger);
		const downloadedFiles = await extractZip(new Uint8Array(await downloaded.arrayBuffer()));
		const originalFile = new TextDecoder().decode(files["data/enchantplus/enchantment/sword/attack_speed.json"]);
		const compiledFile = new TextDecoder().decode(downloadedFiles["data/enchantplus/enchantment/sword/attack_speed.json"]);
		const originalIndent = Differ.detectIndentation(originalFile);
		const compiledIndent = Differ.detectIndentation(compiledFile);
		expect(originalIndent).toBe(compiledIndent);
		expect(compiledIndent).toBe(2);
	});

	it("should preserve original file indentation (4 spaces)", async () => {
		const files: Record<string, Uint8Array> = {};
		files["pack.mcmeta"] = new TextEncoder().encode(JSON.stringify({ pack: { pack_format: 61, description: "test" } }, null, 4));
		files["data/enchantplus/enchantment/sword/attack_speed.json"] = new TextEncoder().encode(
			JSON.stringify(attackSpeed.data, null, 4)
		);

		const zipFile = await createZipFile(files);
		const datapack = await Datapack.from(zipFile);
		const parsed = datapack.parse();
		const parsedEnchantment = Array.from(parsed.elements.values()).find((el) => el.identifier.resource === "sword/attack_speed") as
			| EnchantmentProps
			| undefined;

		if (!parsedEnchantment) throw new Error("Enchantment not found");

		const action = CoreAction.setValue("maxLevel", 5);
		const updated = parsed.logger.trackChanges(parsedEnchantment, (el) => updateData<EnchantmentProps>(action, el));
		const compiled = compileDatapack({
			elements: [updated as EnchantmentProps],
			files: parsed.files
		});

		const downloaded = await compiled.generate(parsed.logger);
		const downloadedFiles = await extractZip(new Uint8Array(await downloaded.arrayBuffer()));
		const originalFile = new TextDecoder().decode(files["data/enchantplus/enchantment/sword/attack_speed.json"]);
		const compiledFile = new TextDecoder().decode(downloadedFiles["data/enchantplus/enchantment/sword/attack_speed.json"]);
		const originalIndent = Differ.detectIndentation(originalFile);
		const compiledIndent = Differ.detectIndentation(compiledFile);
		expect(originalIndent).toBe(compiledIndent);
		expect(compiledIndent).toBe(4);
	});

	it("should preserve original file indentation (tabs)", async () => {
		const files: Record<string, Uint8Array> = {};
		files["pack.mcmeta"] = new TextEncoder().encode(JSON.stringify({ pack: { pack_format: 61, description: "test" } }, null, "\t"));
		files["data/enchantplus/enchantment/sword/attack_speed.json"] = new TextEncoder().encode(
			JSON.stringify(attackSpeed.data, null, "\t")
		);

		const zipFile = await createZipFile(files);
		const datapack = await Datapack.from(zipFile);
		const parsed = datapack.parse();
		const parsedEnchantment = Array.from(parsed.elements.values()).find((el) => el.identifier.resource === "sword/attack_speed") as
			| EnchantmentProps
			| undefined;

		if (!parsedEnchantment) throw new Error("Enchantment not found");

		const action = CoreAction.setValue("maxLevel", 5);
		const updated = parsed.logger.trackChanges(parsedEnchantment, (el) => updateData<EnchantmentProps>(action, el));
		const compiled = compileDatapack({
			elements: [updated as EnchantmentProps],
			files: parsed.files
		});

		const downloaded = await compiled.generate(parsed.logger);
		const downloadedFiles = await extractZip(new Uint8Array(await downloaded.arrayBuffer()));
		const originalFile = new TextDecoder().decode(files["data/enchantplus/enchantment/sword/attack_speed.json"]);
		const compiledFile = new TextDecoder().decode(downloadedFiles["data/enchantplus/enchantment/sword/attack_speed.json"]);
		const originalIndent = Differ.detectIndentation(originalFile);
		const compiledIndent = Differ.detectIndentation(compiledFile);
		expect(originalIndent).toBe(compiledIndent);
		expect(compiledIndent).toBe("\t");
	});
});
