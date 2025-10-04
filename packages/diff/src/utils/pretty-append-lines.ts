import type { DiffResult } from "../types";
import { cmp } from "./cmp";
import { formatValue } from "./format-value";

interface Options {
	ignoreCase?: boolean;
	showModifications?: boolean;
	maxDepth?: number | null;
}

export const prettyAppendLines = (
	linesLeft: DiffResult[],
	linesRight: DiffResult[],
	keyLeft: string,
	keyRight: string,
	valueLeft: unknown,
	valueRight: unknown,
	level: number,
	options: Options
): void => {
	const valueCmpOptions = { ignoreCase: options.ignoreCase };
	const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;
	const _resultLeft = formatValue(valueLeft, maxDepth, true).split("\n");
	const _resultRight = formatValue(valueRight, maxDepth, true).split("\n");

	if (cmp(valueLeft, valueRight, valueCmpOptions) !== 0) {
		if (options.showModifications) {
			const maxLines = Math.max(_resultLeft.length, _resultRight.length);
			for (let i = _resultLeft.length; i < maxLines; i++) {
				_resultLeft.push("");
			}
			for (let i = _resultRight.length; i < maxLines; i++) {
				_resultRight.push("");
			}
			linesLeft.push({
				level,
				type: "modify",
				text: keyLeft ? `"${keyLeft}": ${_resultLeft[0]}` : _resultLeft[0]
			});
			for (let i = 1; i < _resultLeft.length; i++) {
				linesLeft.push({
					level: level + (_resultLeft[i].match(/^\s+/)?.[0]?.length ?? 0),
					type: "modify",
					text: _resultLeft[i].replace(/^\s+/, "").replace(/,$/g, "")
				});
			}
			for (let i = _resultLeft.length; i < maxLines; i++) {
				linesLeft.push({ level, type: "equal", text: "" });
			}
			linesRight.push({
				level,
				type: "modify",
				text: keyRight ? `"${keyRight}": ${_resultRight[0]}` : _resultRight[0]
			});
			for (let i = 1; i < _resultRight.length; i++) {
				linesRight.push({
					level: level + (_resultRight[i].match(/^\s+/)?.[0]?.length ?? 0),
					type: "modify",
					text: _resultRight[i].replace(/^\s+/, "").replace(/,$/g, "")
				});
			}
			for (let i = _resultRight.length; i < maxLines; i++) {
				linesRight.push({ level, type: "equal", text: "" });
			}
		} else {
			linesLeft.push({
				level,
				type: "remove",
				text: keyLeft ? `"${keyLeft}": ${_resultLeft[0]}` : _resultLeft[0]
			});
			for (let i = 1; i < _resultLeft.length; i++) {
				linesLeft.push({
					level: level + (_resultLeft[i].match(/^\s+/)?.[0]?.length ?? 0),
					type: "remove",
					text: _resultLeft[i].replace(/^\s+/, "").replace(/,$/g, "")
				});
			}
			for (let i = 0; i < _resultRight.length; i++) {
				linesLeft.push({ level, type: "equal", text: "" });
			}
			for (let i = 0; i < _resultLeft.length; i++) {
				linesRight.push({ level, type: "equal", text: "" });
			}
			linesRight.push({
				level,
				type: "add",
				text: keyRight ? `"${keyRight}": ${_resultRight[0]}` : _resultRight[0]
			});
			for (let i = 1; i < _resultRight.length; i++) {
				linesRight.push({
					level: level + (_resultRight[i].match(/^\s+/)?.[0]?.length ?? 0),
					type: "add",
					text: _resultRight[i].replace(/^\s+/, "").replace(/,$/g, "")
				});
			}
		}
	} else {
		const maxLines = Math.max(_resultLeft.length, _resultRight.length);
		for (let i = _resultLeft.length; i < maxLines; i++) {
			_resultLeft.push("");
		}
		for (let i = _resultRight.length; i < maxLines; i++) {
			_resultRight.push("");
		}
		linesLeft.push({
			level,
			type: "equal",
			text: keyLeft ? `"${keyLeft}": ${_resultLeft[0]}` : _resultLeft[0]
		});
		for (let i = 1; i < _resultLeft.length; i++) {
			linesLeft.push({
				level: level + (_resultLeft[i].match(/^\s+/)?.[0]?.length ?? 0),
				type: "equal",
				text: _resultLeft[i].replace(/^\s+/, "").replace(/,$/g, "")
			});
		}
		linesRight.push({
			level,
			type: "equal",
			text: keyRight ? `"${keyRight}": ${_resultRight[0]}` : _resultRight[0]
		});
		for (let i = 1; i < _resultRight.length; i++) {
			linesRight.push({
				level: level + (_resultRight[i].match(/^\s+/)?.[0]?.length ?? 0),
				type: "equal",
				text: _resultRight[i].replace(/^\s+/, "").replace(/,$/g, "")
			});
		}
	}
};
