import { defineRoute, useParams } from "@voxelio/router";

export default defineRoute("/$lang/", { component: LangHome });

function LangHome() {
	return useParams().lang;
}
