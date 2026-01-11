import type { Migration } from "@/types";
import { isCommand } from "@/utils/command";

export const worldborderTime: Migration = {
	id: "1.21.11/worldborder-time",
	description: "Convert worldborder time arguments from seconds to ticks (add 's' suffix)",
	migrate(ctx) {
		ctx.transform(/\.mcfunction$/, (content) => {
			const lines = content.split("\n");
			let changed = false;

			const newLines = lines.map((line) => {
				const result = processLine(line);
				if (result !== line) changed = true;
				return result;
			});

			return changed ? newLines.join("\n") : undefined;
		});
	},
};

function processLine(line: string): string {
	if (!isCommand(line, "worldborder")) return line;

	return line.replace(
		/^(\s*\$*worldborder\s+(?:set|add)\s+\S+\s+|\s*\$*worldborder\s+warning\s+time\s+)(\d+)(\s*)$/,
		"$1$2s$3"
	);
}
