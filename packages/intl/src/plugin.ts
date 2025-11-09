import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseSync, Visitor, type VisitorObject } from 'oxc-parser/src-js/index.js';
import type { CallExpression } from '@oxc-project/types';
import type { Plugin } from 'vite';
import { safeTry, safeTryAsync } from '@/utils';

/**
 * Plugin configuration options
 * @param sourceLocale - The source locale to use
 * @param localesDir - The directory to store the locales
 */
interface Options {
	sourceLocale?: string;
	localesDir?: string;
}

interface Replacement {
	start: number;
	end: number;
	key: string;
}

const generateKey = (text: string): string =>
	createHash('md5').update(text, 'utf8').digest('hex').slice(0, 8);

const extractMessages = (code: string, id: string): Map<string, string> => {
	const messages = new Map<string, string>();
	const result = parseSync(id, code);
	if (result.errors.length > 0) return messages;

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
		},
	} satisfies VisitorObject);

	visitor.visit(result.program);
	return messages;
};

const transformCode = (code: string, id: string): string => {
	const replacements: Replacement[] = [];
	const result = parseSync(id, code);
	if (result.errors.length > 0) return code;

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
			replacements.push({ start: arg.start, end: arg.end, key, });
		},
	} satisfies VisitorObject);

	visitor.visit(result.program);
	if (replacements.length === 0) return code;

	let transformed = code;
	for (const { start, end, key } of replacements.reverse()) {
		transformed = `${transformed.slice(0, start)}'${key}'${transformed.slice(end)}`;
	}

	return transformed;
};

const syncLocales = async (messages: Map<string, string>, localesDir: string, sourceLocale: string): Promise<void> => {
	if (messages.size === 0) return;
	await mkdir(localesDir, { recursive: true });
	const sourceFile = join(localesDir, `${sourceLocale}.json`);
	const sourceMessages = Object.fromEntries(messages);

	await writeFile(sourceFile, JSON.stringify(sourceMessages, null, 2), 'utf-8');
	const files = await readdir(localesDir).catch(() => []);
	const localeFiles = files.filter((f) => f.endsWith('.json') && f !== `${sourceLocale}.json`);

	for (const file of localeFiles) {
		const filePath = join(localesDir, file);
		const content = await safeTryAsync(() => readFile(filePath, 'utf-8'));
		const localeMessages = safeTry(() => content ? JSON.parse(content.toString()) : {}) ?? {};
		const updatedMessages = Object.fromEntries(
			Object.entries(sourceMessages).map(([key, sourceText]) => [key, localeMessages[key] ?? sourceText]),
		);
		await writeFile(filePath, JSON.stringify(updatedMessages, null, 2), 'utf-8');
	}
};

export default function viteI18nExtract(options: Options = {}): Plugin {
	const { sourceLocale = 'en', localesDir = './src/locales' } = options;
	const fileMessages = new Map<string, Map<string, string>>();
	const virtualModuleId = 'virtual:@voxelio/intl';
	const resolvedVirtualModuleId = `\0${virtualModuleId}`;
	let configFilePath = '';

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

	const generateVirtualModule = async (): Promise<string> => {
		const absoluteLocalesDir = getAbsoluteLocalesDir();
		console.log('[Plugin] Looking for locales in:', absoluteLocalesDir);
		const files = await readdir(absoluteLocalesDir).catch(() => []);
		console.log('[Plugin] Found files:', files);
		const localeFiles = files.filter((f) => f.endsWith('.json'));
		console.log('[Plugin] Found locale files:', localeFiles);

		const configDir = configFilePath ? join(configFilePath, '..') : process.cwd();
		const runtimePath = join(configDir, '../dist/runtime.js').replace(/\\/g, '/');
		const isDevMode = runtimePath.includes('/packages/intl/');
		const runtimeImport = isDevMode ? runtimePath : '@voxelio/intl/runtime';

		if (localeFiles.length === 0) {
			console.warn('[Plugin] No locale files found!');
			return `import { init } from '${runtimeImport}';
init({});`;
		}

		const imports = localeFiles.map((file, idx) => {
			const absolutePath = join(absoluteLocalesDir, file).replace(/\\/g, '/');
			console.log(`[Plugin] Import ${idx}: ${absolutePath}`);
			return `import locale_${idx} from '${absolutePath}';`;
		}).join('\n');

		const localesObject = localeFiles.map((file, idx) => {
			const locale = file.replace('.json', '');
			return `  '${locale}': locale_${idx}`;
		}).join(',\n');

		const code = `${imports}
import { init } from '${runtimeImport}';

const locales = {
${localesObject}
};

console.log('[Virtual Module] Locales object:', locales);
init(locales);
`;
		return code;
	};

	return {
		name: '@voxelio/intl',
		configResolved(config) {
			configFilePath = config.configFile ?? '';
		},

		buildStart() {
			fileMessages.clear();
		},

		resolveId(id: string) {
			if (id === virtualModuleId) return resolvedVirtualModuleId;
		},

		async load(id: string) {
			if (id === resolvedVirtualModuleId) {
				return generateVirtualModule();
			}
		},

		async transform(code: string, id: string) {
			if (!/\.(jsx|tsx)$/.test(id)) return null;
			if (!code.includes("t('") && !code.includes('t("') && !code.includes('t(`'))
				return null;

			const messages = extractMessages(code, id);
			fileMessages.set(id, messages);

			const transformedCode = transformCode(code, id);
			await syncLocales(getAllMessages(), getAbsoluteLocalesDir(), sourceLocale);
			return { code: transformedCode, map: null };
		},

		async handleHotUpdate({ file, read, server }) {
			if (!/\.(jsx|tsx)$/.test(file)) return;

			const code = await read();
			const messages = extractMessages(code, file);
			fileMessages.set(file, messages);

			await syncLocales(getAllMessages(), getAbsoluteLocalesDir(), sourceLocale);

			const virtualModule = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
			if (virtualModule) {
				server.moduleGraph.invalidateModule(virtualModule);
			}
		},

		async buildEnd() {
			await syncLocales(getAllMessages(), getAbsoluteLocalesDir(), sourceLocale);
		},
	};
}