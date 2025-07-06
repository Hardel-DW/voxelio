import { describe, test, expect } from "vitest"
import { formatDOSDateTime } from "../src/datetime.ts"
import { makeBuffer } from "../src/utils.ts"

describe("formatDOSDateTime", () => {
    test("the datetime encoding to local 32-bit DOS format", () => {
        const date = new Date("2020-02-15T11:24:18")
        const actual = makeBuffer(4)
        formatDOSDateTime(date, actual)
        const expected = 0x095b4f50
        expect(actual.getUint32(0)).toBe(expected)
    })
})
