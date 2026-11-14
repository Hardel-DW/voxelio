import { defineRoute } from "@voxelio/router";
import { Files } from "../../views";

export default defineRoute("/files/$", { component: Files });
