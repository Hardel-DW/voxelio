import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseSync, Visitor, type VisitorObject } from 'oxc-parser/src-js/index.js';
import type { CallExpression } from '@oxc-project/types';
import type { Plugin, ViteDevServer } from 'vite';
import { safeTry, safeTryAsync, KeyMinifier } from '@/utils';

/**
 * Plugin configuration options
 * @param sourceLocale - The source locale to use (must be in locales array)
 * @param locales - Array of supported locales
 * @param localesDir - The directory to store the locales (optional, defaults to './src/locales')
 * @param include - File extensions to process (optional, defaults to ['jsx', 'tsx'])
 * @param silent - Disable warning logs (optional, defaults to false)
 */
interface Options {
	sourceLocale: string;
	locales: string[];
	localesDir?: string;
	include?: string[];
	silent?: boolean;
}

interface Replacement {
	start: number;
	end: number;
	key: string;
}

interface CacheEntry {
	codeHash: string;
	messages: Map<string, string>;
	transformedCode: string;
}

const generateKey = (text: string): string => {
	const cleaned = text.replace(/[./:]/g, ' ').replace(/[^a-zA-Z0-9 _-]/g, '').toLowerCase();
	const alphaNum = cleaned.replace(/[ _-]+/g, '_').trim().slice(0, 32);
	return alphaNum || createHash('sha256').update(text, 'utf8').digest('base64').slice(0, 12);
};

const transformTCalls = (
	code: string,
	filePath: string,
	onLiteral: (value: string) => string | null,
	options?: { silent?: boolean; filterCallee?: string; onParamKey?: (key: string) => string | null }
): string => {
	const { silent = false, filterCallee, onParamKey } = options ?? {};
	const replacements: Replacement[] = [];
	const result = parseSync(filePath, code);

	if (result.errors.length > 0) {
		if (!silent) {
			console.warn(`[@voxelio/intl] Parse errors in ${filePath}:`, result.errors.map(e => e.message).join(', '));
		}
		return code;
	}

	const visitor = new Visitor({
		CallExpression(node: CallExpression) {
			if (node.callee.type !== 'Identifier' || node.arguments.length === 0) return;
			if (filterCallee && node.callee.name !== filterCallee) return;

			const arg = node.arguments[0];
			if (arg.type !== 'Literal' || typeof arg.value !== 'string') return;

			const transformed = onLiteral(arg.value);
			if (transformed) replacements.push({ start: arg.start, end: arg.end, key: transformed });

			if (onParamKey && node.arguments.length > 1) {
				const paramArg = node.arguments[1];
				if (paramArg.type === 'ObjectExpression') {
					for (const prop of paramArg.properties) {
						if (prop.type !== 'Property' || prop.key.type !== 'Identifier') continue;
						const minified = onParamKey(prop.key.name);
						if (minified) replacements.push({ start: prop.key.start, end: prop.key.end, key: minified });
					}
				}
			}
		},
	} satisfies VisitorObject);

	visitor.visit(result.program);
	return replacements.reverse().reduce((acc, { start, end, key }) =>
		`${acc.slice(0, start)}'${key}'${acc.slice(end)}`, code);
};

const loadJSON = async (path: string) => {
	const content = await safeTryAsync(() => readFile(path, 'utf-8'));
	return safeTry(() => JSON.parse(content?.toString() ?? '{}')) ?? {};
};

const syncLocales = async (messages: Map<string, string>, localesDir: string, sourceLocale: string, supportedLocales: string[]): Promise<void> => {
	if (messages.size === 0) return;
	const cacheDir = join(localesDir, '.cache');
	await Promise.all([mkdir(localesDir, { recursive: true }), mkdir(cacheDir, { recursive: true })]);

	const sourceMessages = Object.fromEntries(messages);
	await writeFile(join(localesDir, `${sourceLocale}.json`), JSON.stringify(sourceMessages, null, 2), 'utf-8');

	await Promise.all(supportedLocales.filter(l => l !== sourceLocale).map(async (locale) => {
		const localePath = join(localesDir, `${locale}.json`);
		const cachePath = join(cacheDir, `${locale}.json`);
		const [current, cache] = await Promise.all([loadJSON(localePath), loadJSON(cachePath)]);
		const sourceKeys = new Set(Object.keys(sourceMessages));

		const active = Object.fromEntries(
			Object.keys(sourceMessages).map(k => {
				if (current[k] !== undefined) return [k, current[k]];
				if (cache[k] !== undefined) return [k, cache[k]];
				return [k, sourceMessages[k]];
			})
		);

		const obsolete = Object.fromEntries([
			...Object.entries(cache).filter(([k]) => !sourceKeys.has(k)),
			...Object.entries(current).filter(([k]) => !sourceKeys.has(k))
		]);

		await Promise.all([
			writeFile(localePath, JSON.stringify(active, null, 2), 'utf-8'),
			Object.keys(obsolete).length > 0 && writeFile(cachePath, JSON.stringify(obsolete, null, 2), 'utf-8')
		].filter(Boolean));
	}));
};

export default function viteI18nExtract(options: Options): Plugin {
	const { sourceLocale, locales, localesDir = './src/locales', include = ['jsx', 'tsx'], silent = false } = options;
	if (!locales.includes(sourceLocale)) {
		throw new Error(`sourceLocale "${sourceLocale}" must be included in locales array: [${locales.join(', ')}]`);
	}

	const filePattern = new RegExp(`\\.(${include.join('|')})$`);
	const fileMessages = new Map<string, Map<string, string>>();
	const parseCache = new Map<string, CacheEntry>();
	const virtualModuleId = 'virtual:@voxelio/intl';
	const resolvedVirtualModuleId = `\0${virtualModuleId}`;
	const localeModulePrefix = `${virtualModuleId}/locale-`;
	let configFilePath = '';
	let initialSyncPromise: Promise<void> | null = null;
	const keyMinifier = new KeyMinifier();
	let isBuild = false;

	const getAbsoluteLocalesDir = (): string => {
		const configDir = configFilePath ? join(configFilePath, '..') : process.cwd();
		return join(configDir, localesDir);
	};

	const processFile = (code: string, id: string, silent: boolean): { messages: Map<string, string>; transformedCode: string; isCached: boolean } => {
		const codeHash = createHash('sha256').update(code, 'utf8').digest('hex');
		const cached = parseCache.get(id);
		if (cached && cached.codeHash === codeHash) {
			return { messages: cached.messages, transformedCode: cached.transformedCode, isCached: true };
		}

		const messages = new Map<string, string>();
		const transformedCode = transformTCalls(code, id, (text) => {
			const key = generateKey(text);
			messages.set(key, text);
			return key;
		}, { silent, filterCallee: 't' });
		parseCache.set(id, { codeHash, messages, transformedCode });
		return { messages, transformedCode, isCached: false };
	};

	const getAllMessages = (): Map<string, string> => new Map(Array.from(fileMessages.values()).flatMap(messages => Array.from(messages)));

	const resolveRuntimeImport = (): string => {
		if (!configFilePath) return '@voxelio/intl/runtime';
		const configDir = join(configFilePath, '..');
		const potentialDevPath = join(configDir, '../dist/runtime.js');
		const isDevelopment = potentialDevPath.includes('packages/intl');
		return isDevelopment ? potentialDevPath.replace(/\\/g, '/') : '@voxelio/intl/runtime';
	};

	const generateVirtualModule = (): string => {
		const runtimeImport = resolveRuntimeImport();

		if (locales.length === 0) {
			return `import{init}from'${runtimeImport}';init({});`;
		}

		if (!isBuild) {
			const absoluteLocalesDir = getAbsoluteLocalesDir();
			const modules = locales.map((locale) => {
				const varName = locale.replace(/[^a-zA-Z0-9]/g, '_');
				const importPath = join(absoluteLocalesDir, `${locale}.json`).replace(/\\/g, '/');
				return { locale, varName, importPath };
			});

			const imports = modules.map(({ varName, importPath }) => `import ${varName} from'${importPath}';`).join('');
			const entries = modules.map(({ locale, varName }) => `'${locale}':${varName}`).join(',');
			return `${imports}import{init}from'${runtimeImport}';init({${entries}},{fallbackLocale:'${sourceLocale}'});`;
		}

		const loaderImport = resolveRuntimeImport().replace('/runtime', '/loader');
		const loaders = locales.map(l => `'${l}':()=>import('${localeModulePrefix}${l}')`).join(',');
		const supportedLocales = locales.map(l => `'${l}'`).join(',');

		return `import{initDynamic,setLanguage}from'${loaderImport}';import{detectLanguage,getLanguage}from'${runtimeImport}';const locale=detectLanguage('${sourceLocale}',[${supportedLocales}]);await initDynamic({${loaders}},locale,{fallbackLocale:'${sourceLocale}',supportedLocales:[${supportedLocales}]});export{setLanguage,getLanguage};`;
	};

	const handleLocaleFileChange = async (path: string, server: ViteDevServer): Promise<void> => {
		const absoluteLocalesDir = getAbsoluteLocalesDir();
		if (!path.startsWith(absoluteLocalesDir) || !path.endsWith('.json')) return;
		if (path.includes('.cache')) return;

		const fileName = path.split(/[\\/]/).pop()?.replace('.json', '');
		if (!fileName || !locales.includes(fileName)) return;

		await syncLocales(getAllMessages(), absoluteLocalesDir, sourceLocale, locales);

		const virtualModule = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
		if (virtualModule) {
			server.moduleGraph.invalidateModule(virtualModule);
			server.ws.send({ type: 'full-reload' });
		}
	};

	return {
		name: '@voxelio/intl',
		configResolved(config) {
			configFilePath = config.configFile ?? '';
			isBuild = config.command === 'build';
		},
		configureServer(server) {
			server.watcher.on('change', (path) => handleLocaleFileChange(path, server));
			server.watcher.on('unlink', (path) => {
				handleLocaleFileChange(path, server);
				if (filePattern.test(path)) {
					fileMessages.delete(path);
					parseCache.delete(path);
				}
			});
		},
		renderChunk(code) {
			const allMessages = getAllMessages();
			const minifiedCode = transformTCalls(code, 'chunk.js',
				(key) => allMessages.has(key) ? keyMinifier.minifyKey(key) : null,
				{ onParamKey: (param) => keyMinifier.minifyParam(param) }
			);
			return {
				code: minifiedCode,
				map: null
			};
		},
		async buildStart() {
			fileMessages.clear();
			parseCache.clear();
			initialSyncPromise = null;
		},
		resolveId(id: string) {
			if (id === virtualModuleId) return resolvedVirtualModuleId;
			if (id.startsWith(localeModulePrefix)) {
				return `\0${id}`;
			}
		},
		async load(id: string) {
			if (id === resolvedVirtualModuleId) return generateVirtualModule();

			if (id.startsWith(`\0${localeModulePrefix}`)) {
				const locale = id.replace(`\0${localeModulePrefix}`, '');
				const absoluteLocalesDir = getAbsoluteLocalesDir();
				const localePath = join(absoluteLocalesDir, `${locale}.json`);
				const content = await safeTryAsync(() => readFile(localePath, 'utf-8'));
				const translations = safeTry(() => JSON.parse(content?.toString() ?? '{}')) ?? {};
				const minified = keyMinifier.minifyTranslations(translations);
				return `export default ${JSON.stringify(minified)}`;
			}
		},
		async transform(code: string, id: string) {
			if (!filePattern.test(id)) return null;
			if (!code.includes("@voxelio/intl")) return null;

			const { messages, transformedCode } = processFile(code, id, silent);
			fileMessages.set(id, messages);

			if (!initialSyncPromise && fileMessages.size > 0) {
				initialSyncPromise = syncLocales(getAllMessages(), getAbsoluteLocalesDir(), sourceLocale, locales).catch((error) => {
					console.error('[voxelio/intl] Failed to sync locales:', error);
					initialSyncPromise = null;
				});
				await initialSyncPromise;
			}

			return { code: transformedCode, map: null };
		},
		async handleHotUpdate({ file, read, server }) {
			if (!filePattern.test(file)) return;
			const code = await read();
			const { messages, isCached } = processFile(code, file, silent);

			if (isCached) return;
			parseCache.delete(file);
			fileMessages.set(file, messages);
			await syncLocales(getAllMessages(), getAbsoluteLocalesDir(), sourceLocale, locales);
			const virtualModule = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
			if (virtualModule) {
				server.moduleGraph.invalidateModule(virtualModule);
			}
		},
		async buildEnd() {
			await syncLocales(getAllMessages(), getAbsoluteLocalesDir(), sourceLocale, locales);
		}
	};
}