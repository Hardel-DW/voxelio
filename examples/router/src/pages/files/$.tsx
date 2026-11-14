import { useParams } from "@voxelio/router";

export default function File() {
	return <p id="file">File: {useParams()["*"]}</p>;
}
