import { defineConfig, type UserConfig } from 'vite';
import viteIntl from "../dist/index";

export default defineConfig({
    plugins: [viteIntl({ localesDir: './examples/src/locales' })],
    optimizeDeps: {
        exclude: ['oxc-parser', '@oxc-project/types']
    }
}) as UserConfig;