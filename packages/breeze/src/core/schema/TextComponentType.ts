export type TextComponentType = string | TextComponentObject | TextComponentType[];

type TextComponentPlainText = {
	text: string;
	type?: "text";
};

type TextComponentTranslate = {
	translate: string;
	fallback?: string;
	with?: TextComponentType[];
	type?: "translatable";
};

type TextComponentScore = {
	score: {
		name: string;
		objective: string;
	};
	type?: "score";
};

type TextComponentSelector = {
	selector: string;
	separator?: TextComponentType;
	type?: "selector";
};

type TextComponentKeybind = {
	keybind: string;
	type?: "keybind";
};

type TextComponentBlockNbt = {
	block: string;
	nbt: string;
	source?: "block";
	type?: "nbt";
	interpret?: boolean;
	separator?: TextComponentType;
};

type TextComponentEntityNbt = {
	entity: string;
	nbt: string;
	source?: "entity";
	type?: "nbt";
	interpret?: boolean;
	separator?: TextComponentType;
};

type TextComponentStorageNbt = {
	storage: string;
	nbt: string;
	source?: "storage";
	type?: "nbt";
	interpret?: boolean;
	separator?: TextComponentType;
};

type TextComponentSprite = {
	atlas?: string;
	sprite: string;
	object?: "atlas";
	type?: "object";
};

type TextComponentPlayerHead = {
	player: {
		name?: string;
		id?: string;
	};
	hat?: boolean;
	object?: "player";
	type?: "object";
};

type TextComponentBase = {
	color?: string;
	shadow_color?: string;
	font?: string;
	bold?: boolean;
	italic?: boolean;
	underlined?: boolean;
	strikethrough?: boolean;
	obfuscated?: boolean;
	insertion?: string;
	extra?: TextComponentType[];
	click_event?: {
		action: "open_url" | "run_command" | "suggest_command" | "change_page" | "copy_to_clipboard" | "show_dialog" | "custom";
		url?: string;
		command?: string;
		page?: number;
		value?: string;
		dialog?: string | Record<string, unknown>;
		id?: string;
		payload?: unknown;
	};
	hover_event?: {
		action: "show_text" | "show_item" | "show_entity";
		value?:
		| TextComponentType
		| {
			id?: string;
			count?: number;
			components?: Record<string, unknown>;
		}
		| {
			id: string;
			uuid: string | number[];
			name?: TextComponentType;
		};
	};
};

type TextComponentObject = TextComponentBase &
	(
		| TextComponentPlainText
		| TextComponentTranslate
		| TextComponentScore
		| TextComponentSelector
		| TextComponentKeybind
		| TextComponentBlockNbt
		| TextComponentEntityNbt
		| TextComponentStorageNbt
		| TextComponentSprite
		| TextComponentPlayerHead
	);

/**
 * Converts a TextComponent to a plain string, extracting all text content
 * @param component - The text component to convert
 * @returns A plain string representation
 */
export function textComponentToString(component: TextComponentType): string {
	if (typeof component === "string") {
		return component;
	}

	if (Array.isArray(component)) {
		return component.map(textComponentToString).join("");
	}

	const text = "text" in component
		? component.text
		: ("translate" in component && component.fallback)
			? component.fallback
			: "";

	const extra = component.extra
		? textComponentToString(component.extra)
		: "";

	return text + extra;
}
