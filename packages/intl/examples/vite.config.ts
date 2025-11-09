import { defineConfig, type UserConfig } from 'vite';
import viteIntl from "../dist/plugin";

export default defineConfig({
    plugins: [viteIntl({ localesDir: './src/locales' })]
}) as UserConfig;