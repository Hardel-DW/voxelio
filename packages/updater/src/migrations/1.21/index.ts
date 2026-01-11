import type { Migration } from "@/types";
import { updatePackFormat } from "@/migrations/1.21/update-pack-format";

const migrations: Migration[] = [
	updatePackFormat,
];

export default migrations;