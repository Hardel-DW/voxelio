import { useParams } from "@voxelio/router";

export function Files() {
	return useParams()["*"];
}
