import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { downloadZip } from "@/index";
import { resolve } from "node:path";

const zipSpec = readFileSync(resolve(__dirname, "APPNOTE.TXT"));
const specName = new TextEncoder().encode("APPNOTE.TXT");
const specDate = new Date("2019-04-26T02:00");

describe("downloadZip", () => {
	test("downloadZip propagates pulling and cancellation", async () => {
		const thrown: unknown[] = [];
		let pulled = 0;
		const input: IterableIterator<{ input: Uint8Array; name: Uint8Array; lastModified: Date }> = {
			next() {
				if (pulled++) return { done: true, value: undefined };
				return {
					done: false,
					value: { input: zipSpec, name: specName, lastModified: specDate }
				};
			},
			throw(err: unknown) {
				thrown.push(err);
				return { done: true, value: undefined };
			},
			[Symbol.iterator]() {
				return this;
			}
		};
		const response = downloadZip(input);
		// Check if body exists before getting reader
		if (!response.body) {
			throw new Error("Response body is null or undefined");
		}
		const reader = response.body.getReader();

		// it does not pull from its input until someone reads the output
		expect(pulled).toBe(0);

		// it pulls lazily from the input iterable
		for (let i = 0; i < 2; i++) await reader.read();
		expect(pulled).toBe(1);
		for (let i = 0; i < 4; i++) await reader.read();
		expect(pulled).toBe(2);
		expect(thrown.length).toBe(0);

		// it cancels the input iterable when its output is cancelled
		const error = new Error("I don't want to ZIP anymore !");
		await reader.cancel(error);
		expect(thrown.length).toBe(1);
		expect(thrown[0]).toBe(error);
	});
});
