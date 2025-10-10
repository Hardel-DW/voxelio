/**
 * Side-effect import that automatically loads .env file.
 *
 * Usage:
 * ```ts
 * import "@voxelio/env/config";
 * ```
 *
 * This will load the .env file from the current working directory
 * and populate process.env with the variables.
 */
import { config } from "./index.js";
config();
