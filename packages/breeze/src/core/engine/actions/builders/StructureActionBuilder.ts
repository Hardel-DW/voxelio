import type { StructureAction } from "../domains/structure/types";
import { ActionBuilder } from "./ActionBuilder";

export class StructureActionBuilder extends ActionBuilder<StructureAction> {
    setBiomes(...biomes: string[]): SetBiomesBuilder {
        return new SetBiomesBuilder(biomes);
    }

    addSpawnOverride(mobCategory: string): AddSpawnOverrideBuilder {
        return new AddSpawnOverrideBuilder(mobCategory);
    }

    removeSpawnOverride(mobCategory: string): RemoveSpawnOverrideBuilder {
        return new RemoveSpawnOverrideBuilder(mobCategory);
    }

    setJigsawConfig(): SetJigsawConfigBuilder {
        return new SetJigsawConfigBuilder();
    }

    build(): StructureAction {
        throw new Error("Use specific builder methods to create actions");
    }
}

class SetBiomesBuilder extends ActionBuilder<Extract<StructureAction, { type: "structure.set_biomes" }>> {
    private replace = false;

    constructor(private biomes: string[]) {
        super();
    }

    replaceExisting(): this {
        this.replace = true;
        return this;
    }

    build() {
        return {
            type: "structure.set_biomes" as const,
            biomes: this.biomes,
            ...(this.replace && { replace: this.replace })
        };
    }
}

class AddSpawnOverrideBuilder extends ActionBuilder<Extract<StructureAction, { type: "structure.add_spawn_override" }>> {
    private boundingBox: "piece" | "full" = "piece";
    private spawns: Array<{ type: string; weight: number; minCount: number; maxCount: number }> = [];

    constructor(private mobCategory: string) {
        super();
    }

    boundingBoxType(type: "piece" | "full"): this {
        this.boundingBox = type;
        return this;
    }

    spawn(type: string, weight: number, minCount: number, maxCount: number): this {
        this.spawns.push({ type, weight, minCount, maxCount });
        return this;
    }

    build() {
        return {
            type: "structure.add_spawn_override" as const,
            mobCategory: this.mobCategory,
            boundingBox: this.boundingBox,
            spawns: this.spawns
        };
    }
}

class RemoveSpawnOverrideBuilder extends ActionBuilder<Extract<StructureAction, { type: "structure.remove_spawn_override" }>> {
    constructor(private mobCategory: string) {
        super();
    }

    build() {
        return {
            type: "structure.remove_spawn_override" as const,
            mobCategory: this.mobCategory
        };
    }
}

class SetJigsawConfigBuilder extends ActionBuilder<Extract<StructureAction, { type: "structure.set_jigsaw_config" }>> {
    private config: Partial<{
        startPool: string;
        size: number;
        startHeight: any;
        startJigsawName: string;
        maxDistanceFromCenter: number;
        useExpansionHack: boolean;
    }> = {};

    startPool(pool: string): this {
        this.config.startPool = pool;
        return this;
    }

    size(size: number): this {
        this.config.size = size;
        return this;
    }

    startHeight(height: any): this {
        this.config.startHeight = height;
        return this;
    }

    startJigsawName(name: string): this {
        this.config.startJigsawName = name;
        return this;
    }

    maxDistanceFromCenter(distance: number): this {
        this.config.maxDistanceFromCenter = distance;
        return this;
    }

    useExpansionHack(use: boolean): this {
        this.config.useExpansionHack = use;
        return this;
    }

    build() {
        return {
            type: "structure.set_jigsaw_config" as const,
            ...this.config
        };
    }
}
