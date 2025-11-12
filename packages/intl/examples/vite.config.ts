import { defineConfig, type UserConfig } from 'vite';
import viteIntl from "@voxelio/intl/plugin";

export default defineConfig({
    plugins: [viteIntl({ sourceLocale: 'en', locales: ['en', 'fr'] })]
}) as UserConfig; 