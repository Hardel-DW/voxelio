# @voxelio/zip

## 3.2.0

### Minor Changes

- 6c3dbc7: Minor refactoring and improvements
- Remove unused `@ts-expect-error` directives that are no longer needed
- Replace `@ts-ignore` with proper type handling in metadata.ts
- Fix null safety when parsing Content-Length headers using Number() instead of unary +
- Fix type compatibility by wrapping Uint8Array creation in unzip.ts to ensure proper ArrayBuffer type