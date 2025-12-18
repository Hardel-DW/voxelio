import { describe, it, beforeAll } from "vitest";
import type { VanillaMcdocSymbols } from "@/index";
import { getTestSymbols } from "@test/mock/setup";

describe("debug schema structure", () => {
	let symbols: VanillaMcdocSymbols;

	beforeAll(async () => {
		symbols = await getTestSymbols();
	});

	it("should have resource dispatcher with recipe and loot_table", () => {
		const resourceDispatcher = symbols["mcdoc/dispatcher"]["minecraft:resource"];
		console.log("Resource dispatcher keys:", resourceDispatcher ? Object.keys(resourceDispatcher).slice(0, 30) : "NOT FOUND");
	});
});
