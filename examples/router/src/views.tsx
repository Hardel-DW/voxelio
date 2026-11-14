import { useParams } from "@voxelio/router";

export function File() {
	return <p id="file">File: {useParams()["*"]}</p>;
}
