import should = require('should')
import { Aescbc } from '../src/aescbc'
import * as vectors from './vectors/aescbc.json'

describe('Aescbc', () => {
    should.exist(Aescbc)

    describe('@encrypt', () => {
        it('should return encrypt one block', () => {
            const cipherKeyBuf = Buffer.alloc(256 / 8)
            cipherKeyBuf.fill(0x10)
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0)
            const messageBuf = Buffer.alloc(128 / 8 - 1)
            messageBuf.fill(0)
            const encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
            encBuf.length.should.equal(128 / 8 + 128 / 8)
        })

        it('should return encrypt two blocks', () => {
            const cipherKeyBuf = Buffer.alloc(256 / 8)
            cipherKeyBuf.fill(0x10)
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0)
            const messageBuf = Buffer.alloc(128 / 8)
            messageBuf.fill(0)
            const encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
            encBuf.length.should.equal(128 / 8 + 128 / 8 + 128 / 8)
        })
    })

    describe('@decrypt', () => {
        it('should decrypt that which was encrypted', () => {
            const cipherKeyBuf = Buffer.alloc(256 / 8)
            cipherKeyBuf.fill(0x10)
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0)
            const messageBuf = Buffer.alloc(128 / 8)
            messageBuf.fill(0)
            const encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
            const messageBuf2 = Aescbc.decrypt(encBuf, cipherKeyBuf)
            messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
        })
    })

    describe('vectors', () => {
        // eslint-disable-next-line ban/ban
        vectors.forEach((vector, i) => {
            it('should pass sjcl test vector ' + i, () => {
                const keyBuf = Buffer.from(vector.key, 'hex')
                const ivBuf = Buffer.from(vector.iv, 'hex')
                const ptbuf = Buffer.from(vector.pt, 'hex')
                const ctBuf = Buffer.from(vector.ct, 'hex')
                Aescbc.encrypt(ptbuf, keyBuf, ivBuf)
                    .slice(128 / 8)
                    .toString('hex')
                    .should.equal(vector.ct)
                Aescbc.decrypt(Buffer.concat([ivBuf, ctBuf]), keyBuf)
                    .toString('hex')
                    .should.equal(vector.pt)
            })
        })
    })
})
