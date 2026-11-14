import type { Head } from "./types";

export type Tag = { name: "meta" | "link"; attributes: Record<string, string> };

/** Marks the tags owned by the router, in the prerendered pages as in the live document. */
export const HEAD_MARK = "data-head";

const metaKey = (key: string): string => (key.includes(":") && !key.startsWith("twitter:") ? "property" : "name");

/** The deepest route wins, key by key. */
export function mergeHead(heads: Head[]): Head {
	return {
		title: heads.findLast((head) => head.title !== undefined)?.title,
		meta: Object.assign({}, ...heads.map((head) => head.meta)),
		link: Object.assign({}, ...heads.map((head) => head.link))
	};
}

export function headTags(head: Head): Tag[] {
	const metas = Object.entries(head.meta ?? {}).map(
		([key, content]): Tag => ({ name: "meta", attributes: { [metaKey(key)]: key, content } })
	);
	const links = Object.entries(head.link ?? {}).map(([rel, href]): Tag => ({ name: "link", attributes: { rel, href } }));

	return [...metas, ...links];
}

export function applyHead(head: Head, title: string): void {
	for (const stale of document.head.querySelectorAll(`[${HEAD_MARK}]`)) stale.remove();
	document.title = head.title ?? title;

	for (const { name, attributes } of headTags(head)) {
		const element = document.createElement(name);
		for (const [attribute, value] of Object.entries(attributes)) element.setAttribute(attribute, value);
		element.setAttribute(HEAD_MARK, "");
		document.head.append(element);
	}
}
