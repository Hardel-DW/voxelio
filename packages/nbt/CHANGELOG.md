# @voxelio/nbt

## 1.1.0

### Minor Changes

- 1723e19: Read about 1.9x and serialize about 6x faster (string cache, direct UTF-8 encoding, one byte swap per array). Big-endian files use the modified UTF-8 of Java. Malformed input always throws `NbtError` instead of hanging or running out of memory, with the depth limit of Minecraft (512). A string over 65535 bytes throws instead of writing a corrupt file. An empty list takes the type of its items and a list mixing types throws. Byte arrays no longer share memory with the input. The Bedrock header keeps its version, and `LazyNbtFile` keeps the file order.

### Patch Changes

- ec9aa9b: Zlib compression now writes and reads real zlib streams (it used raw deflate, so zlib files could not be read back nor read by Minecraft). On Node, compression goes through the built-in `node:zlib`, about three times faster than fflate, which browsers keep using.

## 1.0.3

### Patch Changes

- 43dfda4: Update dependencies

## 1.0.2

### Patch Changes

- 3c620e4: Speed up +30% nbt parsing

## 1.0.1

### Patch Changes

- 6018558: Initial Commit

## 1.0.1

### Patch Changes

- 89b7546: Added Nbt libs
