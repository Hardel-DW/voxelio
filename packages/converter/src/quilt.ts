import type { ModMetadata } from "@/types";
import { DEFAULT_MOD_METADATA } from "@/types";

/**
 * Generates Quilt mod JSON content from common metadata
 * @param commonData - Metadata to include in configuration
 * @returns Formatted JSON for quilt.mod.json
 */
interface QuiltModJson {
	schema_version: number;
	quilt_loader: {
		group: string;
		id: string;
		version: string;
		metadata: {
			name: string;
			description: string;
			contributors?: Record<string, string>;
			icon?: string;
			contact?: Record<string, string>;
		};
		intermediate_mappings: string;
		depends: {
			id: string;
			versions: string;
			unless?: string;
		}[];
	};
}

export function generateQuiltMod(commonData: ModMetadata) {
	const config: QuiltModJson = {
		schema_version: 1,
		quilt_loader: {
			group: "com.modrinth",
			id: commonData.id,
			version: commonData.version,
			metadata: {
				name: commonData.name,
				description: commonData.description
			},
			intermediate_mappings: "net.fabricmc:intermediary",
			depends: [
				{
					id: "quilt_resource_loader",
					versions: "*",
					unless: "fabric-resource-loader-v0"
				}
			]
		}
	};

	// Add optional fields only if they exist and aren't default values
	if (commonData.authors.length > 0) {
		config.quilt_loader.metadata.contributors = Object.fromEntries(commonData.authors.map((author) => [author, "Author"]));
	}

	if (commonData.icon) {
		config.quilt_loader.metadata.icon = commonData.icon;
	}

	// Add contact info only if any of the fields are non-default
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
		config.quilt_loader.metadata.contact = contact;
	}

	return JSON.stringify(config, null, 2);
}
