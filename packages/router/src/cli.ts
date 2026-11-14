#!/usr/bin/env node
import { scan, writeTypes } from "./manifest";

// `voxelio-router [pages directory]` writes the route types without starting Vite, ahead of `tsc` on a fresh clone.
const root = process.cwd();
writeTypes(root, scan(root, process.argv[2]));
