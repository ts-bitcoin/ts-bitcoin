/* eslint-disable @typescript-eslint/no-shadow */
import { Aes } from '../src/aes'
import { Cbc } from '../src/cbc'
import 'should'

describe('Cbc', () => {
    describe('@buf2BlocksBuf', () => {
        it('should convert this buffer into one block', () => {
            const buf = Buffer.alloc(16 - 1)
            buf.fill(0)
            const blockBufs = Cbc.buf2BlocksBuf(buf, 16 * 8)
            blockBufs.length.should.equal(1)
            blockBufs[0].toString('hex').should.equal('00000000000000000000000000000001')
        })

        it('should convert this buffer into two blocks', () => {
            const buf = Buffer.alloc(16)
            buf.fill(0)
            const blockBufs = Cbc.buf2BlocksBuf(buf, 16 * 8)
            blockBufs.length.should.equal(2)
            blockBufs[0].toString('hex').should.equal('00000000000000000000000000000000')
            blockBufs[1].toString('hex').should.equal('10101010101010101010101010101010')
        })
    })

    describe('@buf2BlocksBuf', () => {
        it('should convert this buffer into one block and back into the same buffer', () => {
            const buf = Buffer.alloc(16 - 1)
            buf.fill(0)
            const blockBufs = Cbc.buf2BlocksBuf(buf, 16 * 8)
            const buf2 = Cbc.blockBufs2Buf(blockBufs)
            buf2.toString('hex').should.equal(buf.toString('hex'))
        })

        it('should convert this buffer into two blocks and back into the same buffer', () => {
            const buf = Buffer.alloc(16)
            buf.fill(0)
            const blockBufs = Cbc.buf2BlocksBuf(buf, 16 * 8)
            const buf2 = Cbc.blockBufs2Buf(blockBufs)
            buf2.toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('@encrypt', () => {
        it('should return this known value', () => {
            const messageBuf1 = Buffer.alloc(128 / 8)
            messageBuf1.fill(0)
            const messageBuf2 = Buffer.alloc(128 / 8)
            messageBuf2.fill(0x10)
            const messageBuf = Buffer.concat([messageBuf1, messageBuf2])
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = {} as any
            blockCipher.encrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            blockCipher.decrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            const encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
            const buf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
            Buffer.compare(messageBuf, buf2).should.equal(0)
        })

        it('should return this shorter known value', () => {
            const messageBuf1 = Buffer.alloc(128 / 8)
            messageBuf1.fill(0)
            const messageBuf2 = Buffer.alloc(120 / 8)
            messageBuf2.fill(0x10)
            const messageBuf = Buffer.concat([messageBuf1, messageBuf2])
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = {} as any
            blockCipher.encrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            blockCipher.decrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            const encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
            const buf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
            Buffer.compare(messageBuf, buf2).should.equal(0)
        })

        it('should return this shorter known value', () => {
            const messageBuf1 = Buffer.alloc(128 / 8)
            messageBuf1.fill(0)
            const messageBuf2 = Buffer.alloc(136 / 8)
            messageBuf2.fill(0x10)
            const messageBuf = Buffer.concat([messageBuf1, messageBuf2])
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = {} as any
            blockCipher.encrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            blockCipher.decrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            const encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
            const buf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
            Buffer.compare(messageBuf, buf2).should.equal(0)
        })

        it('should encrypt something with Aes', () => {
            const messageBuf1 = Buffer.alloc(128 / 8)
            messageBuf1.fill(0)
            const messageBuf2 = Buffer.alloc(128 / 8)
            messageBuf2.fill(0x10)
            const messageBuf = Buffer.concat([messageBuf1, messageBuf2])
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = Aes
            const encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
            const buf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
            Buffer.compare(messageBuf, buf2).should.equal(0)
        })
    })

    describe('@decrypt', () => {
        it('should properly decrypt an encrypted message', () => {
            const messageBuf1 = Buffer.alloc(128 / 8)
            messageBuf1.fill(0)
            let messageBuf2 = Buffer.alloc(128 / 8)
            messageBuf2.fill(0x10)
            const messageBuf = Buffer.concat([messageBuf1, messageBuf2])
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = {} as any
            blockCipher.encrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            blockCipher.decrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            const encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
            messageBuf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
            messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
        })

        it('should properly decrypt an encrypted message', () => {
            const messageBuf1 = Buffer.alloc(128 / 8)
            messageBuf1.fill(0)
            let messageBuf2 = Buffer.alloc(120 / 8)
            messageBuf2.fill(0x10)
            const messageBuf = Buffer.concat([messageBuf1, messageBuf2])
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = {} as any
            blockCipher.encrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            blockCipher.decrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            const encBuf = Cbc.encrypt(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
            messageBuf2 = Cbc.decrypt(encBuf, ivBuf, blockCipher, cipherKeyBuf)
            messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
        })
    })

    describe('@encryptBlock', () => {
        it('should return this known value', () => {
            const messageBuf = Buffer.alloc(128 / 8)
            messageBuf.fill(0)
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = {} as any
            blockCipher.encrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            const enc = Cbc.encryptBlock(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
            enc.toString('hex').should.equal(ivBuf.toString('hex'))
        })

        it('should return this other known value', () => {
            const messageBuf = Buffer.alloc(128 / 8)
            messageBuf.fill(0x10)
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = {} as any
            blockCipher.encrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            const enc = Cbc.encryptBlock(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
            enc.toString('hex').should.equal('00000000000000000000000000000000')
        })
    })

    describe('@decryptBlock', () => {
        it('should decrypt an encrypted block', () => {
            const messageBuf = Buffer.alloc(128 / 8)
            messageBuf.fill(0)
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = {} as any
            blockCipher.encrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            blockCipher.decrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            const encBuf = Cbc.encryptBlock(messageBuf, ivBuf, blockCipher, cipherKeyBuf)
            const buf = Cbc.decryptBlock(encBuf, ivBuf, blockCipher, cipherKeyBuf)
            buf.toString('hex').should.equal(messageBuf.toString('hex'))
        })
    })

    describe('@encryptBlocks', () => {
        it('should return this known value', () => {
            const messageBuf1 = Buffer.alloc(128 / 8)
            messageBuf1.fill(0)
            const messageBuf2 = Buffer.alloc(128 / 8)
            messageBuf2.fill(0x10)
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = {} as any
            blockCipher.encrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            const encBufs = Cbc.encryptBlocks([messageBuf1, messageBuf2], ivBuf, blockCipher, cipherKeyBuf)
            encBufs[0].toString('hex').should.equal('10101010101010101010101010101010')
            encBufs[1].toString('hex').should.equal('00000000000000000000000000000000')
        })
    })

    describe('@decryptBlocks', () => {
        it('should decrypt encrypted blocks', () => {
            const messageBuf1 = Buffer.alloc(128 / 8)
            messageBuf1.fill(0)
            const messageBuf2 = Buffer.alloc(128 / 8)
            messageBuf2.fill(0x10)
            const ivBuf = Buffer.alloc(128 / 8)
            ivBuf.fill(0x10)
            const cipherKeyBuf = Buffer.alloc(128 / 8)
            cipherKeyBuf.fill(0)
            const blockCipher = {} as any
            blockCipher.encrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            blockCipher.decrypt = function (messageBuf, _cipherKeyBuf) {
                return messageBuf
            }
            const encBufs = Cbc.encryptBlocks([messageBuf1, messageBuf2], ivBuf, blockCipher, cipherKeyBuf)
            const bufs = Cbc.decryptBlocks(encBufs, ivBuf, blockCipher, cipherKeyBuf)
            bufs[0].toString('hex').should.equal(messageBuf1.toString('hex'))
            bufs[1].toString('hex').should.equal(messageBuf2.toString('hex'))
        })
    })

    describe('@pkcs7Pad', () => {
        it('should pad this 32 bit buffer to 128 bits with the number 128/8 - 32/8', () => {
            const buf = Buffer.alloc(32 / 8)
            buf.fill(0)
            const padbuf = Cbc.pkcs7Pad(buf, 128)
            padbuf.length.should.equal(128 / 8)
            padbuf[32 / 8].should.equal(128 / 8 - 32 / 8)
            padbuf[32 / 8 + 1].should.equal(128 / 8 - 32 / 8)
            // ...
            padbuf[32 / 8 + 128 / 8 - 32 / 8 - 1].should.equal(128 / 8 - 32 / 8)
        })
    })

    describe('@pkcs7Unpad', () => {
        it('should unpad this padded 32 bit buffer', () => {
            const buf = Buffer.alloc(32 / 8)
            buf.fill(0)
            const paddedbuf = Cbc.pkcs7Pad(buf, 128)
            const unpaddedbuf = Cbc.pkcs7Unpad(paddedbuf)
            unpaddedbuf.toString('hex').should.equal(buf.toString('hex'))
        })
    })

    describe('@xorBufs', () => {
        it('should xor 1 and 0', () => {
            const buf1 = Buffer.from([1])
            const buf2 = Buffer.from([0])
            const buf = Cbc.xorBufs(buf1, buf2)
            buf[0].should.equal(1)
        })

        it('should xor 1 and 1', () => {
            const buf1 = Buffer.from([1])
            const buf2 = Buffer.from([1])
            const buf = Cbc.xorBufs(buf1, buf2)
            buf[0].should.equal(0)
        })
    })
})
