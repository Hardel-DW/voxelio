import { describe, expect, it } from 'vitest'
import { NbtFloat } from '@/tags/NbtFloat'

describe('NbtFloat', () => {
	it('toString', () => {
		expect(new NbtFloat(4).toString()).toEqual('4f')

		expect(new NbtFloat(2.35).toString()).toEqual('2.35f')
	})
})
