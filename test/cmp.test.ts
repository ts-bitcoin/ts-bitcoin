/* eslint-disable @typescript-eslint/no-shadow */
import { cmp } from '../src/cmp'
import 'should'

describe('cmp', () => {
    it('should know if these buffers are equal', () => {
        let buf1
        let buf2

        buf1 = Buffer.from([])
        buf2 = Buffer.from([])
        cmp(buf1, buf2).should.equal(true)

        buf1 = Buffer.from([1])
        buf2 = Buffer.from([])
        cmp(buf1, buf2).should.equal(false)

        buf1 = Buffer.from([])
        buf2 = Buffer.from([1])
        cmp(buf1, buf2).should.equal(false)

        buf1 = Buffer.from([1])
        buf2 = Buffer.from([1])
        cmp(buf1, buf2).should.equal(true)

        buf1 = Buffer.from([1, 1])
        buf2 = Buffer.from([1])
        cmp(buf1, buf2).should.equal(false)

        buf1 = Buffer.from([1])
        buf2 = Buffer.from([1, 1])
        cmp(buf1, buf2).should.equal(false)

        buf1 = Buffer.from([1, 1])
        buf2 = Buffer.from([1, 1])
        cmp(buf1, buf2).should.equal(true)

        buf1 = Buffer.from([1, 0])
        buf2 = Buffer.from([1, 1])
        cmp(buf1, buf2).should.equal(false)

        buf1 = Buffer.from([1])
        buf2 = Buffer.from([1, 0])
        cmp(buf1, buf2).should.equal(false)
        ;(function () {
            const buf1 = ''
            const buf2 = Buffer.from([0])
            cmp(buf1 as any, buf2)
        }.should.throw('buf1 and buf2 must be buffers'))
        ;(function () {
            const buf1 = Buffer.from([0])
            const buf2 = ''
            cmp(buf1, buf2 as any)
        }.should.throw('buf1 and buf2 must be buffers'))
    })
})
