/**
 * Hash
 * ====
 *
 * Some hash functions are used through out bitcoin. We expose them here as a
 * convenience.
 */
import { sha1, sha256, sha512, ripemd160 } from 'hash.js'
import { Workers } from './workers'

export class Hash {
    public static readonly blockSize = {
        sha1: 512,
        sha256: 512,
        sha512: 1024,
    }

    public static sha1(buf: Buffer): Buffer {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('sha1 hash must be of a buffer')
        }
        const hash = sha1().update(buf).digest()
        return Buffer.from(hash)
    }

    public static async asyncSha1(buf: Buffer): Promise<Buffer> {
        const args = [buf]
        const workersResult = await Workers.asyncClassMethod(Hash, 'sha1', args)
        return workersResult.resbuf
    }

    public static sha256(buf: Buffer): Buffer {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('sha256 hash must be of a buffer')
        }
        const hash = sha256().update(buf).digest()
        return Buffer.from(hash)
    }

    public static async asyncSha256(buf: Buffer): Promise<Buffer> {
        const args = [buf]
        const workersResult = await Workers.asyncClassMethod(Hash, 'sha256', args)
        return workersResult.resbuf
    }

    public static sha256Sha256(buf: Buffer): Buffer {
        try {
            return Hash.sha256(Hash.sha256(buf))
        } catch (e) {
            throw new Error('sha256Sha256 hash must be of a buffer: ' + e)
        }
    }

    public static async asyncSha256Sha256(buf: Buffer): Promise<Buffer> {
        const args = [buf]
        const workersResult = await Workers.asyncClassMethod(Hash, 'sha256Sha256', args)
        return workersResult.resbuf
    }

    public static ripemd160(buf: Buffer): Buffer {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('ripemd160 hash must be of a buffer')
        }
        const hash = ripemd160().update(buf).digest()
        return Buffer.from(hash)
    }

    public static async asyncRipemd160(buf: Buffer): Promise<Buffer> {
        const args = [buf]
        const workersResult = await Workers.asyncClassMethod(Hash, 'ripemd160', args)
        return workersResult.resbuf
    }

    public static sha256Ripemd160(buf: Buffer): Buffer {
        try {
            return Hash.ripemd160(Hash.sha256(buf))
        } catch (e) {
            throw new Error('sha256Ripemd160 hash must be of a buffer: ' + e)
        }
    }

    public static async asyncSha256Ripemd160(buf: Buffer): Promise<Buffer> {
        const args = [buf]
        const workersResult = await Workers.asyncClassMethod(Hash, 'sha256Ripemd160', args)
        return workersResult.resbuf
    }

    public static sha512(buf: Buffer): Buffer {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('sha512 hash must be of a buffer')
        }
        const hash = sha512().update(buf).digest()
        return Buffer.from(hash)
    }

    public static async asyncSha512(buf: Buffer): Promise<Buffer> {
        const args = [buf]
        const workersResult = await Workers.asyncClassMethod(Hash, 'sha512', args)
        return workersResult.resbuf
    }

    public static hmac(hashFStr: 'sha1' | 'sha256' | 'sha512', data: Buffer, key: Buffer): Buffer {
        if (hashFStr !== 'sha1' && hashFStr !== 'sha256' && hashFStr !== 'sha512') {
            throw new Error('invalid choice of hash function')
        }

        const hashf = Hash[hashFStr]

        if (!Buffer.isBuffer(data) || !Buffer.isBuffer(key)) {
            throw new Error('data and key must be buffers')
        }

        // http://en.wikipedia.org/wiki/Hash-based_message_authentication_code
        // http://tools.ietf.org/html/rfc4868#section-2
        const blockSize = Hash.blockSize[hashFStr] / 8

        if (key.length > blockSize) {
            key = hashf(key)
        }

        if (key.length < blockSize) {
            const fill = Buffer.alloc(blockSize)
            fill.fill(0, key.length)
            key.copy(fill)
            key = fill
        }

        const oKeyPad = Buffer.alloc(blockSize)
        const iKeyPad = Buffer.alloc(blockSize)
        for (let i = 0; i < blockSize; i++) {
            oKeyPad[i] = 0x5c ^ key[i]
            iKeyPad[i] = 0x36 ^ key[i]
        }

        return hashf(Buffer.concat([oKeyPad, hashf(Buffer.concat([iKeyPad, data]))]))
    }

    public static readonly bitsize = {
        sha1Hmac: 160,
        sha256Hmac: 256,
        sha512Hmac: 512,
    }

    public static sha1Hmac(data: Buffer, key: Buffer): Buffer {
        return Hash.hmac('sha1', data, key)
    }

    public static async asyncSha1Hmac(data: Buffer, key: Buffer): Promise<Buffer> {
        const args = [data, key]
        const workersResult = await Workers.asyncClassMethod(Hash, 'sha1Hmac', args)
        return workersResult.resbuf
    }

    public static sha256Hmac(data: Buffer, key: Buffer): Buffer {
        return Hash.hmac('sha256', data, key)
    }

    public static async asyncSha256Hmac(data: Buffer, key: Buffer): Promise<Buffer> {
        const args = [data, key]
        const workersResult = await Workers.asyncClassMethod(Hash, 'sha256Hmac', args)
        return workersResult.resbuf
    }

    public static sha512Hmac(data: Buffer, key: Buffer): Buffer {
        return Hash.hmac('sha512', data, key)
    }

    public static async asyncSha512Hmac(data: Buffer, key: Buffer): Promise<Buffer> {
        const args = [data, key]
        const workersResult = await Workers.asyncClassMethod(Hash, 'sha512Hmac', args)
        return workersResult.resbuf
    }
}
