import { spawn } from "node:child_process";

export interface ExecResult {
	code: number;
	stdout: string;
	stderr: string;
}

/** On Windows, npm and pnpm are `.cmd` shims that only start through a shell. Arguments are package names and versions. */
export function exec(command: string, args: string[], cwd: string, inherit = false): Promise<ExecResult> {
	const shell = process.platform === "win32" && command !== "git";
	return new Promise((resolve, reject) => {
		const child = spawn(shell ? [command, ...args].join(" ") : command, shell ? [] : args, {
			cwd,
			shell,
			stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"]
		});

		let stdout = "";
		let stderr = "";
		child.stdout?.setEncoding("utf-8").on("data", (chunk: string) => {
			stdout += chunk;
		});
		child.stderr?.setEncoding("utf-8").on("data", (chunk: string) => {
			stderr += chunk;
		});
		child.on("error", reject);
		child.on("close", (code) => resolve({ code: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() }));
	});
}
