import { describe, it, expect } from "vitest";
import { generateFabricMod } from "@/fabric";
import { createTestMetadata } from "./mock";

describe("generateFabricMod", () => {
    it("should generate valid fabric.mod.json structure", () => {
        const testMetadata = createTestMetadata({
            authors: ["TestAuthor"],
            icon: "icon.png",
            homepage: "https://example.com",
            issues: "https://example.com/issues",
            sources: "https://example.com/source",
        });

        const result = generateFabricMod(testMetadata);
        const parsed = JSON.parse(result);
        expect(parsed).toHaveProperty("schemaVersion", 1);
        expect(parsed).toHaveProperty("id", "test_mod");
        expect(parsed).toHaveProperty("version", "1.0.0");
        expect(parsed).toHaveProperty("name", "Test Mod");
        expect(parsed).toHaveProperty("description", "A test mod for unit testing");
        expect(parsed).toHaveProperty("license", "LicenseRef-Datapack");
        expect(parsed).toHaveProperty("environment", "*");
        expect(parsed).toHaveProperty("depends");
        expect(parsed.depends).toHaveProperty("fabric-resource-loader-v0", "*");
        expect(parsed).toHaveProperty("authors");
        expect(parsed.authors).toEqual(["TestAuthor"]);
        expect(parsed).toHaveProperty("icon", "icon.png");
        expect(parsed).toHaveProperty("contact");
        expect(parsed.contact).toHaveProperty("homepage", "https://example.com");
        expect(parsed.contact).toHaveProperty("issues", "https://example.com/issues");
        expect(parsed.contact).toHaveProperty("sources", "https://example.com/source");
    });

    it("should omit optional fields when not provided", () => {
        const minimalMetadata = createTestMetadata({ id: "minimal_mod", name: "Minimal Mod", description: "Minimal description" });
        const result = generateFabricMod(minimalMetadata);
        const parsed = JSON.parse(result);
        expect(parsed).not.toHaveProperty("authors");
        expect(parsed).not.toHaveProperty("icon");
        expect(parsed).not.toHaveProperty("contact");
    });
});
