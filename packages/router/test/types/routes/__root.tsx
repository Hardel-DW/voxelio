import { defineRoute, type ErrorProps, Outlet } from "@voxelio/router";

export default defineRoute("__root", { component: Root, notFound: Missing, error: Crashed });

function Root() {
	return <Outlet />;
}

function Missing() {
	return "nothing here";
}

function Crashed({ error }: ErrorProps) {
	return error.message;
}
