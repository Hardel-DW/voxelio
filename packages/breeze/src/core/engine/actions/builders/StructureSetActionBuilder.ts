import type { StructureSetAction } from "../domains/structure_set/types";
import { ActionBuilder } from "./ActionBuilder";

export class StructureSetActionBuilder extends ActionBuilder<StructureSetAction> {
    addStructure(structure: string, weight: number): AddStructureBuilder {
        return new AddStructureBuilder(structure, weight);
    }

    removeStructure(structureId: string): RemoveStructureBuilder {
        return new RemoveStructureBuilder(structureId);
    }

    modifyStructure(structureId: string): ModifyStructureBuilder {
        return new ModifyStructureBuilder(structureId);
    }

    setPlacementType(placementType: any): SetPlacementTypeBuilder {
        return new SetPlacementTypeBuilder(placementType);
    }

    configurePlacement(): ConfigurePlacementBuilder {
        return new ConfigurePlacementBuilder();
    }

    build(): StructureSetAction {
        throw new Error("Use specific builder methods to create actions");
    }
}

class AddStructureBuilder extends ActionBuilder<Extract<StructureSetAction, { type: "structure_set.add_structure" }>> {
    private position?: number;

    constructor(
        private structure: string,
        private weight: number
    ) {
        super();
    }

    atPosition(position: number): this {
        this.position = position;
        return this;
    }

    build() {
        return {
            type: "structure_set.add_structure" as const,
            structure: this.structure,
            weight: this.weight,
            ...(this.position !== undefined && { position: this.position })
        };
    }
}

class RemoveStructureBuilder extends ActionBuilder<Extract<StructureSetAction, { type: "structure_set.remove_structure" }>> {
    constructor(private structureId: string) {
        super();
    }

    build() {
        return {
            type: "structure_set.remove_structure" as const,
            structureId: this.structureId
        };
    }
}

class ModifyStructureBuilder extends ActionBuilder<Extract<StructureSetAction, { type: "structure_set.modify_structure" }>> {
    private property?: "structure" | "weight";
    private value?: string | number;

    constructor(private structureId: string) {
        super();
    }

    structure(structure: string): this {
        this.property = "structure";
        this.value = structure;
        return this;
    }

    weight(weight: number): this {
        this.property = "weight";
        this.value = weight;
        return this;
    }

    build() {
        if (!this.property || this.value === undefined) {
            throw new Error("Property and value must be set");
        }

        return {
            type: "structure_set.modify_structure" as const,
            structureId: this.structureId,
            property: this.property,
            value: this.value
        };
    }
}

class SetPlacementTypeBuilder extends ActionBuilder<Extract<StructureSetAction, { type: "structure_set.set_placement_type" }>> {
    constructor(private placementType: any) {
        super();
    }

    build() {
        return {
            type: "structure_set.set_placement_type" as const,
            placementType: this.placementType
        };
    }
}

class ConfigurePlacementBuilder extends ActionBuilder<Extract<StructureSetAction, { type: "structure_set.configure_placement" }>> {
    private config: Partial<{
        salt: number;
        frequencyReductionMethod: any;
        frequency: number;
        locateOffset: [number, number, number];
    }> = {};

    salt(salt: number): this {
        this.config.salt = salt;
        return this;
    }

    frequencyReductionMethod(method: any): this {
        this.config.frequencyReductionMethod = method;
        return this;
    }

    frequency(frequency: number): this {
        this.config.frequency = frequency;
        return this;
    }

    locateOffset(x: number, y: number, z: number): this {
        this.config.locateOffset = [x, y, z];
        return this;
    }

    build() {
        return {
            type: "structure_set.configure_placement" as const,
            ...this.config
        };
    }
}
