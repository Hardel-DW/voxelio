import type { VanillaMcdocSymbols } from "@voxelio/parser";
import { useQuery } from "@tanstack/react-query";

const SYMBOLS_URL = "https://api.spyglassmc.com/vanilla-mcdoc/symbols";

async function fetchSymbols(): Promise<VanillaMcdocSymbols> {
    const response = await fetch(SYMBOLS_URL);
    if (!response.ok) throw new Error(`Failed to fetch symbols: ${response.status}`);
    return response.json();
}

export function useSymbols() {
    return useQuery({
        queryKey: ["mcdoc-symbols"],
        queryFn: fetchSymbols,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
