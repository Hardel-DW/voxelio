import { defineRoute } from "@voxelio/router";

export default defineRoute("/docs/", { component: DocsIndex });

function DocsIndex() {
	return <p id="docs-index">Pick a page.</p>;
}
