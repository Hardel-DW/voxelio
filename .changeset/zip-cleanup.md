---
"@voxelio/zip": patch
---

Fix typed array views zipping their whole buffer, empty chunks ending a stream, `new Response(null)` never closing, dates before 1980, unhandled rejections on corrupt deflate data, an entry named `__proto__`, and archives over 65535 entries (ZIP64 entry count). An invalid `lastModified` now throws as intended. Extraction decompresses files in parallel and zipping emits fewer chunks; the polyfills are gone.
