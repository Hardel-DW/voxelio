---
"@voxelio/snbt": minor
---

Read about 1.9x and serialize about 6x faster (string cache, direct UTF-8 encoding, one byte swap per array). Big-endian files use the modified UTF-8 of Java. Malformed input always throws `NbtError` instead of hanging or running out of memory, with the depth limit of Minecraft (512). A string over 65535 bytes throws instead of writing a corrupt file. An empty list takes the type of its items and a list mixing types throws. Byte arrays no longer share memory with the input. The Bedrock header keeps its version, and `LazyNbtFile` keeps the file order.
