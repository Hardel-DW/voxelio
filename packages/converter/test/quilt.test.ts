import { describe, it, expect } from "vitest";
import { generateQuiltMod } from "@/quilt";
import { createTestMetadata } from "./mock";

describe("generateQuiltMod", () => {
	it("should generate valid quilt.mod.json structure", () => {
		const testMetadata = createTestMetadata({
			authors: ["TestAuthor", "AnotherAuthor"],
			icon: "icon.png",
			homepage: "https://example.com",
			issues: "https://example.com/issues",
			sources: "https://example.com/source"
		});

		const result = generateQuiltMod(testMetadata);
		const parsed = JSON.parse(result);
		expect(parsed).toHaveProperty("schema_version", 1);
		expect(parsed).toHaveProperty("quilt_loader");
		expect(parsed.quilt_loader).toHaveProperty("group", "com.modrinth");
		expect(parsed.quilt_loader).toHaveProperty("id", "test_mod");
		expect(parsed.quilt_loader).toHaveProperty("version", "1.0.0");
		expect(parsed.quilt_loader).toHaveProperty("intermediate_mappings", "net.fabricmc:intermediary");
		expect(parsed.quilt_loader).toHaveProperty("metadata");
		expect(parsed.quilt_loader.metadata).toHaveProperty("name", "Test Mod");
		expect(parsed.quilt_loader.metadata).toHaveProperty("description", "A test mod for unit testing");
		expect(parsed.quilt_loader.metadata).toHaveProperty("icon", "icon.png");
		expect(parsed.quilt_loader.metadata).toHaveProperty("contributors");
		expect(parsed.quilt_loader.metadata.contributors).toEqual({ TestAuthor: "Author", AnotherAuthor: "Author" });
		expect(parsed.quilt_loader.metadata).toHaveProperty("contact");
		expect(parsed.quilt_loader.metadata.contact).toHaveProperty("homepage", "https://example.com");
		expect(parsed.quilt_loader.metadata.contact).toHaveProperty("issues", "https://example.com/issues");
		expect(parsed.quilt_loader.metadata.contact).toHaveProperty("sources", "https://example.com/source");
		expect(parsed.quilt_loader).toHaveProperty("depends");
		expect(parsed.quilt_loader.depends).toBeInstanceOf(Array);
		expect(parsed.quilt_loader.depends).toHaveLength(1);
		expect(parsed.quilt_loader.depends[0]).toEqual({
			id: "quilt_resource_loader",
			versions: "*",
			unless: "fabric-resource-loader-v0"
		});
	});

	it("should omit optional fields when not provided", () => {
		const minimalMetadata = createTestMetadata({ id: "minimal_mod", name: "Minimal Mod", description: "Minimal description" });
		const result = generateQuiltMod(minimalMetadata);
		const parsed = JSON.parse(result);
		expect(parsed.quilt_loader.metadata).not.toHaveProperty("contributors");
		expect(parsed.quilt_loader.metadata).not.toHaveProperty("icon");
		expect(parsed.quilt_loader.metadata).not.toHaveProperty("contact");
		expect(parsed.quilt_loader.metadata).toHaveProperty("name", "Minimal Mod");
		expect(parsed.quilt_loader.metadata).toHaveProperty("description", "Minimal description");
	});

	it("should convert authors to contributors object correctly", () => {
		const metadataWithMultipleAuthors = createTestMetadata({ authors: ["Author1", "Author2", "Author3"] });
		const result = generateQuiltMod(metadataWithMultipleAuthors);
		const parsed = JSON.parse(result);
		expect(parsed.quilt_loader.metadata.contributors).toEqual({
			Author1: "Author",
			Author2: "Author",
			Author3: "Author"
		});
	});
});
