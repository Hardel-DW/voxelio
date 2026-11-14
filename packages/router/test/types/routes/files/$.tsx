import { useParams } from "@voxelio/router";

export default function Files() {
	return useParams()["*"];
}
