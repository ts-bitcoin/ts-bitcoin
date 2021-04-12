/**
 * Structure
 * =========
 *
 * A convenient structure to extend objects from that comes with very common boiler plate methods.
 * The "expect" method also facilitates deserializing a sequence of buffers into an object.
 */
import { Br } from './br'
import { Bw } from './bw'

export class Struct {
    constructor(data?: Record<string, unknown>) {
        Object.assign(this, data)
    }

    public static fromBr(br: Br): any {
        if (!(br instanceof Br)) {
            throw new Error('Invalid buffer reader')
        }
        throw new Error('Not implemented')
    }

    public static asyncFromBr<T extends Struct>(_br: Br): Promise<T> {
        // TODO: send to worker
        throw new Error('Not implemented')
    }

    public toBw(_bw?: Bw): Bw {
        throw new Error('not implemented')
    }

    public asyncToBw(_bw?: Bw): Promise<Bw> {
        // TODO: send to worker
        throw new Error('Not implemented')
    }

    public static fromBuffer<T extends Struct>(this: (new () => T) & typeof Struct, buf: Buffer): T {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('Invalid buffer')
        }
        const br = new Br(buf)
        return this.fromBr(br) as T
    }

    public static asyncFromBuffer<T extends Struct>(this: (new () => T) & typeof Struct, _buf: Buffer): Promise<T> {
        // TODO: send to worker
        throw new Error('Not implemented')
    }

    /**
     * Convert the object into a buffer, i.e. serialize the object. This method
     * may block the main thread.
     */
    public toBuffer(): Buffer {
        return this.toBw().toBuffer()
    }

    public asyncToBuffer(): Promise<Buffer> {
        // TODO: send to worker
        throw new Error('Not implemented')
    }

    public static fromHex<T extends Struct>(this: (new () => T) & typeof Struct, hex: string): T {
        const size = hex.length >>> 1
        const buf = Buffer.from(hex, 'hex')
        if (buf.length !== size) {
            throw new Error('Invalid hex string')
        }
        const br = new Br(buf)
        return this.fromBr(br) as T
    }

    public static asyncFromHex<T extends Struct>(this: (new () => T) & typeof Struct, _hex: string): Promise<T> {
        // TODO: send to worker
        throw new Error('Not implemented')
    }

    public toHex(): string {
        return this.toBuffer().toString('hex')
    }

    public asyncToHex(): Promise<string> {
        // TODO: send to worker
        throw new Error('Not implemented')
    }

    public static fromJSON(_json: any): any {
        throw new Error('Not implemented')
    }

    public static asyncFromJSON(_br: Br): any {
        // TODO: send to worker
        throw new Error('Not implemented')
    }

    public toJSON(): any {
        throw new Error('not implemented')
    }

    public asyncToJSON(): Promise<any> {
        // TODO: send to worker
        throw new Error('Not implemented')
    }

    public toString(): string {
        return this.toHex()
    }

    public asyncToString(): Promise<string> {
        // TODO: send to worker
        throw new Error('Not implemented')
    }

    public clone(): this {
        return (this.constructor as typeof Struct).fromBuffer(this.toBuffer()) as any
    }

    /**
     * It is very often the case that you want to create a bitcoin object from a
     * stream of small buffers rather than from a buffer of the correct length.
     * For instance, if streaming from the network or disk. The genFromBuffers
     * method is a generator which produces an iterator. Use .next(buf) to pass
     * in a small buffer. The iterator will end when it has received enough data
     * to produce the object. In some cases it is able to yield the number of
     * bytes it is expecting, but that is not always known.
     */
    public *genFromBuffers(): Generator<any, any, any> {
        throw new Error('not implemented')
    }

    /**
     * A convenience method used by from the genFromBuffers* generators.
     * Basically lets you expect a certain number of bytes (len) and keeps
     * yielding until you give it enough. It yields the expected amount
     * remaining, and returns an object containing a buffer of the expected
     * length, and, if any, the remainder buffer.
     */
    public *expect(len: number, startbuf?: Buffer): Generator<number, { buf: Buffer; remainderbuf: Buffer }, Buffer> {
        let buf = startbuf
        const bw = new Bw()
        let gotlen = 0
        if (startbuf) {
            bw.write(startbuf)
            gotlen += startbuf.length
        }
        while (gotlen < len) {
            const remainderlen = len - gotlen
            buf = yield remainderlen
            if (!buf) {
                continue
            }
            bw.write(buf)
            gotlen += buf.length
        }
        buf = bw.toBuffer()
        const overlen = gotlen - len
        const remainderbuf = buf.slice(buf.length - overlen, buf.length)
        buf = buf.slice(0, buf.length - overlen)
        return {
            buf,
            remainderbuf,
        }
    }
}
