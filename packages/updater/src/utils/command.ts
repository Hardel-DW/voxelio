export function isCommand(line: string, command: string): boolean {
	const trimmed = line.trim().replace(/^\$+/, "");
	return trimmed === command || trimmed.startsWith(`${command} `);
}
