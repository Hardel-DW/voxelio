import type { StructureProps } from "@/core/schema/structure/types";
import type { ActionHandler } from "../../types";
import type { StructureAction } from "./types";

export class SetJigsawConfigHandler implements ActionHandler<StructureAction> {
	execute(
		action: Extract<StructureAction, { type: "structure.set_jigsaw_config" }>,
		element: Record<string, unknown>
	): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		const updates: Record<string, unknown> = {};

		if (action.startPool !== undefined) updates.startPool = action.startPool;
		if (action.size !== undefined) updates.size = action.size;
		if (action.startHeight !== undefined) updates.startHeight = action.startHeight;
		if (action.startJigsawName !== undefined) updates.startJigsawName = action.startJigsawName;
		if (action.maxDistanceFromCenter !== undefined) updates.maxDistanceFromCenter = action.maxDistanceFromCenter;
		if (action.useExpansionHack !== undefined) updates.useExpansionHack = action.useExpansionHack;

		return { structure, ...updates };
	}
}
