import { defineRoute } from "@voxelio/router";
import { File } from "../../views";

export default defineRoute("/files/$", { component: File });
