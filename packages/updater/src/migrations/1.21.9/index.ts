import type { Migration } from "@/types";
import { packFormatVersioning } from "@/migrations/1.21.9/pack-format-versioning";
import { updatePackFormat } from "@/migrations/1.21.9/update-pack-format";

const migrations: Migration[] = [
	packFormatVersioning,
	updatePackFormat,
];

export default migrations;