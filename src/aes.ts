/**
 * Aes (experimental)
 * ==================
 *
 * Advanced Encryption Standard (Aes). Aes is a low-level tool for encrypting
 * or decrypting blocks of data. There is almost never a reason to use Aes -
 * don't use it unless you need to encrypt or decrypt individual blocks.
 */
const _Aes = require('aes')

export class Aes {
    public static encrypt(messageBuf: Buffer, keyBuf: Buffer): Buffer {
        const key = Aes.buf2Words(keyBuf)
        const message = Aes.buf2Words(messageBuf)
        const a = new _Aes(key)
        const enc = a.encrypt(message)
        const encBuf = Aes.words2Buf(enc)
        return encBuf
    }

    public static decrypt(encBuf: Buffer, keyBuf: Buffer): Buffer {
        const enc = Aes.buf2Words(encBuf)
        const key = Aes.buf2Words(keyBuf)
        const a = new _Aes(key)
        const message = a.decrypt(enc)
        const messageBuf = Aes.words2Buf(message)
        return messageBuf
    }

    public static buf2Words(buf: Buffer): number[] {
        if (buf.length % 4) {
            throw new Error('buf length must be a multiple of 4')
        }

        const words = []

        for (let i = 0; i < buf.length / 4; i++) {
            words.push(buf.readUInt32BE(i * 4))
        }

        return words
    }

    public static words2Buf(words: number[]): Buffer {
        const buf = Buffer.alloc(words.length * 4)

        for (let i = 0; i < words.length; i++) {
            buf.writeUInt32BE(words[i], i * 4)
        }

        return buf
    }
}
