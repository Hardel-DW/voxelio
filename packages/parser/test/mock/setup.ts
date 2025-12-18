import type { VanillaMcdocSymbols } from "@/types";
const SYMBOLS_URL = "https://api.spyglassmc.com/vanilla-mcdoc/symbols";

let cachedSymbols: VanillaMcdocSymbols | undefined;
export async function getTestSymbols(): Promise<VanillaMcdocSymbols> {
	if (cachedSymbols) return cachedSymbols;

	const response = await fetch(SYMBOLS_URL);
	if (!response.ok) throw new Error(`Failed to fetch symbols: ${response.status}`);

	const json = await response.json();
	cachedSymbols = json as VanillaMcdocSymbols;
	return cachedSymbols;
}