import { readFileSync } from "node:fs"
import { describe, test, expect } from "vitest"
import { crc32, CRC_TABLE } from "../src/crc32.ts"

const table = readFileSync("./test/table.array")

describe("CRC32", () => {
    test("the CRC32 module precomputes CRCs for each byte using the polynomial 0xEDB88320", () => {
        const actual = new Uint8Array(CRC_TABLE.buffer)
        const expected = table.slice(0, 0x400)
        expect(actual).toEqual(expected)
    })

    test("the CRC32 for an empty file", () => {
        expect(crc32(new Uint8Array(0), 0)).toBe(0)
    })

    test("the CRC32 for short files", () => {
        expect(crc32(new TextEncoder().encode("Hello world!"), 0)).toBe(0x1b851995)
        expect(crc32(new TextEncoder().encode("WebAssmebly is fun. Also 10x faster than JavaScript for this."), 0)).toBe(0x8a89a52a)
        expect(crc32(new Uint8Array(table), 0)).toBe(0x1a76768f)
    })

    test("the CRC32 for files larger than 64kB", () => {
        const zipSpec = readFileSync("./test/APPNOTE.TXT")
        expect(crc32(new Uint8Array(zipSpec), 0)).toBe(0xbb3afe3f)
    })
})
