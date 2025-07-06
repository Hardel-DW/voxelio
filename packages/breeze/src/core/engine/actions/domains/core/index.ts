import type { ActionRegistry } from "../../registry";
import type { ActionHandler } from "../../types";
import { AlternativeHandler } from "./AlternativeHandler";
import { SequentialHandler } from "./SequentialHandler";
import {
    InvertBooleanHandler,
    SetValueHandler,
    ToggleAllValuesInListHandler,
    ToggleValueHandler,
    ToggleValueInListHandler
} from "./SetValueHandler";
import { UndefinedHandler } from "./UndefinedHandler";
import type { CoreAction } from "./types";
import { createCoreHandlers } from "./types";

export default function register(registry: ActionRegistry): Map<string, ActionHandler<CoreAction>> {
    const handlerDefinitions = createCoreHandlers({
        "core.set_value": new SetValueHandler(),
        "core.toggle_value": new ToggleValueHandler(),
        "core.toggle_value_in_list": new ToggleValueInListHandler(),
        "core.toggle_all_values_in_list": new ToggleAllValuesInListHandler(),
        "core.set_undefined": new UndefinedHandler(),
        "core.invert_boolean": new InvertBooleanHandler(),
        "core.sequential": new SequentialHandler(registry),
        "core.alternative": new AlternativeHandler(registry)
    });

    return new Map(Object.entries(handlerDefinitions));
}
