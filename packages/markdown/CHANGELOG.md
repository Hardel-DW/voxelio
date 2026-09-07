# @voxelio/markdown

## 0.2.0

### Minor Changes

- 63a6813: Rewrite the block lexer on a line cursor: nested containers close in order, a line that looks like a block but is not becomes a paragraph instead of spinning until the iteration cap, the cap is gone. Inline directives start at a word boundary so `10:30` stays text, link urls keep balanced parentheses, an indented first list item is no longer dropped, unknown directives named after `Object.prototype` members render nothing. Code fences carry `meta` props after the language, headings hand their plain text to custom components, `pre` receives the raw code. Export `tokenize`, `render`, `plainText`, `parseFrontmatter` and the token types. Directive components receive `{ props, children }`.

## 0.1.2

### Patch Changes

- 43dfda4: Update dependencies

## 0.1.1

### Patch Changes

- f3d4938: Initial Version Beta
