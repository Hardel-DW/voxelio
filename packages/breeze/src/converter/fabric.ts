import type { ModMetadata } from "@/converter/types";
import { DEFAULT_MOD_METADATA } from "@/converter/types";

/**
 * Generates Fabric mod JSON content from common metadata
 * @param commonData - Metadata to include in configuration
 * @returns Formatted JSON for fabric.mod.json
 */
interface FabricModJson {
    schemaVersion: number;
    id: string;
    version: string;
    name: string;
    description: string;
    authors?: string[];
    contact?: Record<string, string>;
    license: string;
    icon?: string;
    environment: "*";
    depends: {
        "fabric-resource-loader-v0": "*";
    };
}

export function generateFabricMod(commonData: ModMetadata) {
    const config: FabricModJson = {
        schemaVersion: 1,
        id: commonData.id,
        version: commonData.version,
        name: commonData.name,
        description: commonData.description,
        license: "LicenseRef-Datapack",
        environment: "*",
        depends: {
            "fabric-resource-loader-v0": "*"
        }
    };

    if (commonData.authors.length > 0) {
        config.authors = commonData.authors;
    }

    if (commonData.icon) {
        config.icon = commonData.icon;
    }

    const contact: Record<string, string> = {};
    if (commonData.homepage && commonData.homepage !== DEFAULT_MOD_METADATA.homepage) {
        contact.homepage = commonData.homepage;
    }
    if (commonData.sources && commonData.sources !== DEFAULT_MOD_METADATA.sources) {
        contact.sources = commonData.sources;
    }
    if (commonData.issues && commonData.issues !== DEFAULT_MOD_METADATA.issues) {
        contact.issues = commonData.issues;
    }

    if (Object.keys(contact).length > 0) {
        config.contact = contact;
    }

    return JSON.stringify(config, null, 2);
}
