import type { Migration } from "@/types";
import { gameRulesRename } from "@/migrations/1.21.11/game-rules-rename";
import { worldborderTime } from "@/migrations/1.21.11/worldborder-time";
import { enchantableTagRename } from "@/migrations/1.21.11/enchantable-tag-rename";
import { removedUiSprites } from "@/migrations/1.21.11/removed-ui-sprites";
import { removedSounds } from "@/migrations/1.21.11/removed-sounds";
import { skyTexturesMove } from "@/migrations/1.21.11/sky-textures-move";
import { environmentAttributes } from "@/migrations/1.21.11/environment-attributes";
import { biomeColors } from "@/migrations/1.21.11/biome-colors";
import { itemAtlasSplit } from "@/migrations/1.21.11/item-atlas-split";
import { updatePackFormat } from "@/migrations/1.21.11/update-pack-format";

const migrations: Migration[] = [
	gameRulesRename,
	worldborderTime,
	enchantableTagRename,
	removedUiSprites,
	removedSounds,
	skyTexturesMove,
	environmentAttributes,
	biomeColors,
	itemAtlasSplit,
	updatePackFormat,
];

export default migrations;
