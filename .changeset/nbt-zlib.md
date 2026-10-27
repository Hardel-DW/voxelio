---
"@voxelio/snbt": patch
---

Zlib compression now writes and reads real zlib streams (it used raw deflate, so zlib files could not be read back nor read by Minecraft). On Node, compression goes through the built-in `node:zlib`, about three times faster than fflate, which browsers keep using.
