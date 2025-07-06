import { describe, test, expect } from "vitest"
import { normalizeMetadata } from "../src/metadata.ts"

const encodedName = new TextEncoder().encode("test.txt")
const encodedFolderName = new TextEncoder().encode("root/folder/")

describe("normalizeMetadata", () => {
    test("normalizeMetadata needs a filename along Responses with insufficient metadata", () => {
        expect(() => normalizeMetadata(new Response("four", {
            headers: { "content-disposition": "attachment" }
        }))).toThrow("The file must have a name.")
    })

    test("normalizeMetadata guesses filename from Content-Disposition", () => {
        const metadata = normalizeMetadata(new Response("four", {
            headers: { "content-disposition": "attachment; filename=test.txt; size=0" }
        }))
        expect(metadata).toEqual({ uncompressedSize: 0n, encodedName, nameIsBuffer: false })
    })

    test("normalizeMetadata guesses filename from non latin Content-Disposition", () => {
        const metadata = normalizeMetadata(new Response("four", {
            headers: { "content-disposition": "attachment; filename* = UTF-8''%CF%8C%CE%BD%CE%BF%CE%BC%CE%B1%20%CE%B1%CF%81%CF%87%CE%B5%CE%AF%CE%BF%CF%85.txt" }
        }))
        expect(metadata).toEqual({ uncompressedSize: 0n, encodedName: new TextEncoder().encode("όνομα αρχείου.txt"), nameIsBuffer: false })
    })


    test("normalizeMetadata guesses filename from a Response URL", () => {
        const response = Object.create(Response.prototype, {
            url: { get() { return "https://example.com/path/test.txt" } },
            headers: { get() { return new Headers() } }
        })
        const metadata = normalizeMetadata(response)
        expect(metadata).toEqual({ uncompressedSize: 0n, encodedName, nameIsBuffer: false })
    })

    test("normalizeMetadata guesses filename from a Response URL with trailing slash", () => {
        const response = Object.create(Response.prototype, {
            url: { get() { return "https://example.com/path/test.txt/" } },
            headers: { get() { return new Headers() } }
        })
        const metadata = normalizeMetadata(response)
        expect(metadata).toEqual({ uncompressedSize: 0n, encodedName, nameIsBuffer: false })
    })

    /**************************************   Files   **************************************/

    test("normalizeMetadata reads filename and size from a File", () => {
        const metadata = normalizeMetadata(new File(["four"], "test.txt"))
        expect(metadata).toEqual({ uncompressedSize: 4n, encodedName, nameIsBuffer: false })
    })

    /**************************************  Folders  **************************************/

    test("normalizeMetadata fixes trailing slashes in folder names", () => {
        const metadata = normalizeMetadata(undefined, new TextEncoder().encode("root/folder"))
        expect(metadata).toEqual({ uncompressedSize: 0n, encodedName: encodedFolderName, nameIsBuffer: true })
    })

    test("normalizeMetadata fixes trailing slashes in file names", () => {
        const metadata = normalizeMetadata(undefined, encodedFolderName, 0n)
        expect(metadata).toEqual({ uncompressedSize: 0n, encodedName: new TextEncoder().encode("root/folder"), nameIsBuffer: true })
    })
})
