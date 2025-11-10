import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseSync, Visitor, type VisitorObject } from 'oxc-parser/src-js/index.js';
import type { CallExpression } from '@oxc-project/types';
import type { Plugin } from 'vite';
import { safeTry, safeTryAsync } from '@/utils';

/**
 * Plugin configuration options
 * @param sourceLocale - The source locale to use (must be in locales array)
 * @param locales - Array of supported locales
 * @param localesDir - The directory to store the locales (optional, defaults to './src/locales')
 * @param include - File extensions to process (optional, defaults to ['jsx', 'tsx'])
 */
interface Options {
	sourceLocale: string;
	locales: string[];
	localesDir?: string;
	include?: string[];
}

interface Replacement {
	start: number;
	end: number;
	key: string;
}
const generateKey = (text: string): string =>
	createHash('sha256').update(text, 'utf8').digest('base64').slice(0, 12);

const extractAndTransform = (code: string, id: string): { messages: Map<string, string>; transformedCode: string } => {
	const messages = new Map<string, string>();
	const replacements: Replacement[] = [];
	const result = parseSync(id, code);
	if (result.errors.length > 0) return { messages, transformedCode: code };

	const visitor = new Visitor({
		CallExpression(node: CallExpression) {
			if (node.callee.type !== 'Identifier') return;
			if (node.callee.name !== 't') return;
			if (node.arguments.length === 0) return;

			const arg = node.arguments[0];
			if (arg.type !== 'Literal') return;
			if (typeof arg.value !== 'string') return;

			const text = arg.value;
			const key = generateKey(text);
			messages.set(key, text);
			replacements.push({ start: arg.start, end: arg.end, key });
		},
	} satisfies VisitorObject);

	visitor.visit(result.program);
	const transformedCode = replacements.length === 0
		? code
		: replacements.reverse().reduce((acc, { start, end, key }) => `${acc.slice(0, start)}'${key}'${acc.slice(end)}`, code);

	return { messages, transformedCode };
};

const syncLocales = async (messages: Map<string, string>, localesDir: string, sourceLocale: string, supportedLocales: string[]): Promise<void> => {
	if (messages.size === 0) return;
	await mkdir(localesDir, { recursive: true });
	const sourceMessages = Object.fromEntries(messages);
	const sourceFile = join(localesDir, `${sourceLocale}.json`);
	await writeFile(sourceFile, JSON.stringify(sourceMessages, null, 2), 'utf-8');

	for (const locale of supportedLocales) {
		if (locale === sourceLocale) continue;
		const filePath = join(localesDir, `${locale}.json`);
		const content = await safeTryAsync(() => readFile(filePath, 'utf-8'));
		const localeMessages = safeTry(() => content ? JSON.parse(content.toString()) : {}) ?? {};
		const updatedMessages = Object.fromEntries(
			Object.entries(sourceMessages).map(([key, sourceText]) => [key, localeMessages[key] ?? sourceText]),
		);
		await writeFile(filePath, JSON.stringify(updatedMessages, null, 2), 'utf-8');
	}
};

export default function viteI18nExtract(options: Options): Plugin {
	const { sourceLocale, locales, localesDir = './src/locales', include = ['jsx', 'tsx'] } = options;
	if (!locales.includes(sourceLocale)) {
		throw new Error(`sourceLocale "${sourceLocale}" must be included in locales array: [${locales.join(', ')}]`);
	}

	const filePattern = new RegExp(`\\.(${include.join('|')})$`);
	const fileMessages = new Map<string, Map<string, string>>();
	const virtualModuleId = 'virtual:@voxelio/intl';
	const resolvedVirtualModuleId = `\0${virtualModuleId}`;
	let configFilePath = '';
	let initialSyncPromise: Promise<void> | null = null;

	const getAbsoluteLocalesDir = (): string => {
		const configDir = configFilePath ? join(configFilePath, '..') : process.cwd();
		return join(configDir, localesDir);
	};

	const getAllMessages = (): Map<string, string> => {
		const allMessages = new Map<string, string>();
		for (const messages of fileMessages.values()) {
			for (const [key, text] of messages) {
				allMessages.set(key, text);
			}
		}
		return allMessages;
	};

	const resolveRuntimeImport = (): string => {
		if (!configFilePath) return '@voxelio/intl/runtime';
		const configDir = join(configFilePath, '..');
		const potentialDevPath = join(configDir, '../dist/runtime.js');
		const isDevelopment = potentialDevPath.includes('packages/intl');
		return isDevelopment ? potentialDevPath.replace(/\\/g, '/') : '@voxelio/intl/runtime';
	};

	const generateVirtualModule = (): string => {
		const absoluteLocalesDir = getAbsoluteLocalesDir();
		const runtimeImport = resolveRuntimeImport();

		if (locales.length === 0) {
			return `import{init}from'${runtimeImport}';init({});`;
		}

		const modules = locales.map((locale) => {
			const varName = locale.replace(/[^a-zA-Z0-9]/g, '_');
			const importPath = join(absoluteLocalesDir, `${locale}.json`).replace(/\\/g, '/');
			return { locale, varName, importPath };
		});

		const imports = modules.map(({ varName, importPath }) => `import ${varName} from'${importPath}';`).join('');
		const entries = modules.map(({ locale, varName }) => `'${locale}':${varName}`).join(',');
		return `${imports}import{init}from'${runtimeImport}';init({${entries}},{fallbackLocale:'${sourceLocale}'});`;
	};

	return {
		name: '@voxelio/intl',
		configResolved(config) {
			configFilePath = config.configFile ?? '';
		},
		configureServer(server) {
			server.watcher.on('unlink', async (path) => {
				const absoluteLocalesDir = getAbsoluteLocalesDir();
				if (path.startsWith(absoluteLocalesDir) && path.endsWith('.json')) {
					const fileName = path.split(/[\\/]/).pop()?.replace('.json', '');
					if (fileName && locales.includes(fileName)) {
						await syncLocales(getAllMessages(), absoluteLocalesDir, sourceLocale, locales);
						const virtualModule = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
						if (virtualModule) {
							server.moduleGraph.invalidateModule(virtualModule);
						}
					}
				}
			});
		},
		async buildStart() {
			fileMessages.clear();
			initialSyncPromise = null;
		},
		resolveId(id: string) {
			if (id === virtualModuleId) return resolvedVirtualModuleId;
		},
		async load(id: string) {
			if (id === resolvedVirtualModuleId) return generateVirtualModule();
		},
		async transform(code: string, id: string) {
			if (!filePattern.test(id)) return null;
			if (!code.includes("t('") && !code.includes('t("') && !code.includes('t(`'))
				return null;

			const { messages, transformedCode } = extractAndTransform(code, id);
			fileMessages.set(id, messages);
			if (!initialSyncPromise && fileMessages.size > 0) {
				initialSyncPromise = syncLocales(getAllMessages(), getAbsoluteLocalesDir(), sourceLocale, locales).catch((error) => {
					console.error('[voxelio/intl] Failed to sync locales:', error);
					initialSyncPromise = null;
				});
			}

			if (initialSyncPromise) await initialSyncPromise;
			return { code: transformedCode, map: null };
		},
		async handleHotUpdate({ file, read, server }) {
			if (!filePattern.test(file)) return;
			const code = await read();
			const { messages } = extractAndTransform(code, file);
			fileMessages.set(file, messages);

			await syncLocales(getAllMessages(), getAbsoluteLocalesDir(), sourceLocale, locales);
			const virtualModule = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
			if (virtualModule) {
				server.moduleGraph.invalidateModule(virtualModule);
			}
		},
		async buildEnd() {
			await syncLocales(getAllMessages(), getAbsoluteLocalesDir(), sourceLocale, locales);
		},
	};
}