import { defineConfig } from 'tsdown'

export default defineConfig({
    workspace: true,
    entry: ['./src'],
    format: ['esm'],
    dts: true
})