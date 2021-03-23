/**
 * Cbc
 * ===
 *
 * Cipher Block Chaining (Cbc). This is a low-level tool for chaining multiple
 * encrypted blocks together, usually with Aes. This is a low-level tool that
 * does not include authentication. You should only be using this if you have
 * authentication at another step. It is best combined with Hmac.
 *
 * http://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher-block_chaining_.2829
 */
import { cmp } from './cmp'

export class Cbc {
    public static buf2BlocksBuf(buf: Buffer, blockSize: number): Buffer[] {
        const bytesize = blockSize / 8
        const blockBufs = []

        for (let i = 0; i <= buf.length / bytesize; i++) {
            let blockBuf = buf.slice(i * bytesize, i * bytesize + bytesize)

            if (blockBuf.length < blockSize) {
                blockBuf = Cbc.pkcs7Pad(blockBuf, blockSize)
            }

            blockBufs.push(blockBuf)
        }

        return blockBufs
    }

    public static blockBufs2Buf(blockBufs: Buffer[]): Buffer {
        let last = blockBufs[blockBufs.length - 1]
        last = Cbc.pkcs7Unpad(last)
        blockBufs[blockBufs.length - 1] = last

        const buf = Buffer.concat(blockBufs)

        return buf
    }

    public static encrypt(
        messageBuf: Buffer,
        ivBuf: Buffer,
        blockCipher: any /* TODO: type */,
        cipherKeyBuf: Buffer
    ): Buffer {
        const blockSize = ivBuf.length * 8
        const blockBufs = Cbc.buf2BlocksBuf(messageBuf, blockSize)
        const encBufs = Cbc.encryptBlocks(blockBufs, ivBuf, blockCipher, cipherKeyBuf)
        const encBuf = Buffer.concat(encBufs)
        return encBuf
    }

    public static decrypt(
        encBuf: Buffer,
        ivBuf: Buffer,
        blockCipher: any /* TODO: type */,
        cipherKeyBuf: Buffer
    ): Buffer {
        const bytesize = ivBuf.length
        const encBufs = []
        for (let i = 0; i < encBuf.length / bytesize; i++) {
            encBufs.push(encBuf.slice(i * bytesize, i * bytesize + bytesize))
        }
        const blockBufs = Cbc.decryptBlocks(encBufs, ivBuf, blockCipher, cipherKeyBuf)
        const buf = Cbc.blockBufs2Buf(blockBufs)
        return buf
    }

    public static encryptBlock(
        blockBuf: Buffer,
        ivBuf: Buffer,
        blockCipher: any /* TODO: type */,
        cipherKeyBuf: Buffer
    ): Buffer {
        const xorbuf = Cbc.xorBufs(blockBuf, ivBuf)
        const encBuf = blockCipher.encrypt(xorbuf, cipherKeyBuf)
        return encBuf
    }

    public static decryptBlock(
        encBuf: Buffer,
        ivBuf: Buffer,
        blockCipher: any /* TODO: type */,
        cipherKeyBuf: Buffer
    ): Buffer {
        const xorbuf = blockCipher.decrypt(encBuf, cipherKeyBuf)
        const blockBuf = Cbc.xorBufs(xorbuf, ivBuf)
        return blockBuf
    }

    public static encryptBlocks(
        blockBufs: Buffer[],
        ivBuf: Buffer,
        blockCipher: any /* TODO: type */,
        cipherKeyBuf: Buffer
    ): Buffer[] {
        const encBufs = []

        for (let i = 0; i < blockBufs.length; i++) {
            const blockBuf = blockBufs[i]
            const encBuf = Cbc.encryptBlock(blockBuf, ivBuf, blockCipher, cipherKeyBuf)

            encBufs.push(encBuf)

            ivBuf = encBuf
        }

        return encBufs
    }

    public static decryptBlocks(
        encBufs: Buffer[],
        ivBuf: Buffer,
        blockCipher: any /* TODO: type */,
        cipherKeyBuf: Buffer
    ): Buffer[] {
        const blockBufs = []

        for (let i = 0; i < encBufs.length; i++) {
            const encBuf = encBufs[i]
            const blockBuf = Cbc.decryptBlock(encBuf, ivBuf, blockCipher, cipherKeyBuf)

            blockBufs.push(blockBuf)

            ivBuf = encBuf
        }

        return blockBufs
    }

    public static pkcs7Pad(buf: Buffer, blockSize: number): Buffer {
        const bytesize = blockSize / 8
        const padbytesize = bytesize - buf.length
        const pad = Buffer.alloc(padbytesize)
        pad.fill(padbytesize)
        const paddedbuf = Buffer.concat([buf, pad])
        return paddedbuf
    }

    public static pkcs7Unpad(paddedbuf: Buffer): Buffer {
        const padlength = paddedbuf[paddedbuf.length - 1]
        const padbuf = paddedbuf.slice(paddedbuf.length - padlength, paddedbuf.length)
        const padbuf2 = Buffer.alloc(padlength)
        padbuf2.fill(padlength)
        if (!cmp(padbuf, padbuf2)) {
            throw new Error('invalid padding')
        }
        return paddedbuf.slice(0, paddedbuf.length - padlength)
    }

    public static xorBufs(buf1: Buffer, buf2: Buffer): Buffer {
        if (buf1.length !== buf2.length) {
            throw new Error('bufs must have the same length')
        }

        const buf = Buffer.alloc(buf1.length)

        for (let i = 0; i < buf1.length; i++) {
            buf[i] = buf1[i] ^ buf2[i]
        }

        return buf
    }
}
