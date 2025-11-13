# How @voxelio/intl works:
The package is separated into two modules:
- The plugin module (Dev Only), and the runtime module included in the build.

## For the plugin module:
The vite plugin is named "@voxelio/intl".

### When we want to create the .json files
- Create a Map<string, string>, key being the file name, and the value of t("key") as value.
- For each file containing "@voxelio/intl".
- We will read the file with AST and find all calls to t("key") and add the file as well as the keys to the Map.
- During an HMR on a file, we just need to edit the key and value to get all keys in an optimized way.

### At Vite startup:
- We will clear the Maps and caches.
- We will also ensure that the .json files exist and if not create the files with the values.

### When deleting a locale file:
- We check which file was deleted, if it's a locale file, we will re-synchronize it and therefore recreate it with the values.
- Trigger an HMR.

## Algorithm Overview:
### 1. Key Generation Algorithm
Takes a translation text string as input, cleans the text by removing special characters and converting to lowercase, then truncates to 32 characters maximum, if the result is empty, generates a hash-based fallback key

### 2. AST Traversal Algorithm (transformTCalls)
- Parses the source code into an AST using oxc-parser and traverses all CallExpression nodes in the AST, for filters, function calls matching the target callee (e.g., `t()`)
- For each matching call, we extract the string argument, change it to a key, collect params
- Rebuilds the code by replacing original strings with generated keys in reverse order (to preserve offsets)
- Returns the transformed code

### 3. Locale Synchronization Algorithm
- Creates locale directory and cache directory if they don't exist, and writes the source locale file with all collected messages.
- Prioritizes existing translations from current file, after use cached keys in .cache folder, and finally fallback to source locale file.

### 4. Key Minification Algorithm *(Build Only)*
- Cretes a bidirectional mapping between original keys and minified versions. "hello_word" -> "a" and "a" -> "hello_word".
- Assigns sequential short keys ("a", "b", "c", ..., "aa", "ab", ...) for each unique translation key and parameters.

### 5.1 Virtual Module Generation Algorithm *(Development Mode)*
Generates static imports for all locale JSON files, Creates an initialization call with all locales pre-loaded and returns synchronous module code

### 5.2 Virtual Module Generation Algorithm *(Build Mode)*
- Generates dynamic imports for all locale, each locale has its own chunk file, for changing the locale, we lazy load the chunk file.
- Dynamic import allow sync load for the first locale, and then lazy load the other locales.

### 6. Hot Module Replacement (HMR) Algorithm
Listens for file changes via Vite's watcher
- *When a source file changes (tsx, jsx, etc.)*: Re-processes the file to extract new messages, compares with cached version, and if different, invalidates cache and syncs locales
- *When a locale file changes (json)*: Invalidates the virtual module, Triggers a full reload
- *When a file is deleted*: If it's a locale file we re-syncs the locale, if it's a source file we remove it.

> If a key is removed, it will be added to .cache folder, if user add it back, it will be taken from the cache.

### 7. Build Bundle Generation Algorithm
- For each locale, load the json file, minify the keys and parameters, generate the javascript module.
- Generates the virtual module code with dynamic import paths

### Vite Hook Documentation:
- name: identify the plugin
- configResolved(config): access the final config after it is resolved
- transformIndexHtml: modify the HTML before it is sent
- configureServer: configure the dev server to add middlewares, intercept requests, listen to websocket
- renderChunk: transform each chunk of code for the vite build `npx vite build`
- buildStart: execute at the beginning of the build only once
- resolveId: resolve/redirect module imports e.g `@/ -> src/`
- load: Intercept the content of a module, you can modify it with a return string, or null to skip it
- transform: Take a file, and edit the content (build and dev). Null doesn't edit the file
- handleHotUpdate: customize the behavior of HMR when a file changes, you can block or invalidate
- buildEnd: execute at the end of the build (success or error)
- generateBundle: Just before the bundle is written to the dist folder, you can modify the bundle. We can add, delete or edit existing files