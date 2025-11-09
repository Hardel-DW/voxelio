import { defineConfig, type UserConfig } from 'tsdown'

export default defineConfig({
    workspace: true,
    entry: ['./src'],
    format: ['esm'],
    dts: true,
    clean: true,
    minify: true,
    sourcemap: false
}) as UserConfig