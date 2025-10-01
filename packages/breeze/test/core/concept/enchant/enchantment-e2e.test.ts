import { describe, it, expect } from "vitest";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";
import { updateData } from "@/core/engine/actions/index";
import { compileDatapack } from "@/core/engine/Compiler";
import { parseDatapack } from "@/core/engine/Parser";
import type { EnchantmentProps } from "@/core/schema/enchant/types";
import { createFilesFromElements, createZipFile } from "@test/mock/utils";
import { simpleEnchantment } from "@test/mock/enchant/DataDriven";

describe("Enchantment Tags E2E", () => {
    it("should remove enchantment from tag when removing tag from enchantment.tags", async () => {
        const files = createFilesFromElements([
            {
                identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/attack_speed" },
                data: simpleEnchantment
            },
            {
                identifier: { namespace: "enchantplus", registry: "tags/enchantment", resource: "exclusive_set/sword_attribute" },
                data: { values: ["enchantplus:sword/attack_speed"] }
            },
            {
                identifier: { namespace: "enchantplus", registry: "tags/enchantment", resource: "foo" },
                data: { values: ["enchantplus:sword/attack_speed"] }
            }
        ]);
        const zipFile = await createZipFile(files);
        const parsed = await parseDatapack(zipFile);
        const parsedEnchantment = Array.from(parsed.elements.values()).find(
            (el) => el.identifier.resource === "sword/attack_speed"
        ) as EnchantmentProps | undefined;

        expect(parsedEnchantment).toBeDefined();

        if (!parsedEnchantment) throw new Error("Enchantment not found");

        const action = CoreAction.removeTags(["#enchantplus:exclusive_set/sword_attribute"]);
        const updated = parsed.logger.trackChanges(parsedEnchantment, (el) => updateData<EnchantmentProps>(action, el));
        expect(updated?.tags).not.toContain("#enchantplus:exclusive_set/sword_attribute");

        if (!updated) throw new Error("Updated enchantment not found");
        const compiled = compileDatapack({
            elements: [updated as EnchantmentProps],
            files: parsed.files,
            logger: parsed.logger
        });

        console.log("[COMPILED] Compiled:", compiled);
        expect(compiled).toBeDefined();
        expect(compiled.length).toBeGreaterThan(0);
        const tagCompiled = compiled.find(
            (el) =>
                el.type !== "deleted" &&
                el.element.identifier.namespace === "enchantplus" &&
                el.element.identifier.registry === "tags/enchantment" &&
                el.element.identifier.resource === "exclusive_set/sword_attribute"
        );

        console.log("[TAG COMPILED] Tag compiled:", tagCompiled);
        expect(tagCompiled).toBeDefined();
        expect(tagCompiled?.type).not.toBe("deleted");

        if (tagCompiled && tagCompiled.type !== "deleted") {
            const tagData = tagCompiled.element.data;
            expect(tagData.values).toBeDefined();
            expect(tagData.values).not.toContain("enchantplus:sword/attack_speed");
        }
    });
});