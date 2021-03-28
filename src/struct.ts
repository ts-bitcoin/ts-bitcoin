/**
 * Structure
 * =========
 *
 * A convenient structure to extend objects from that comes with very common
 * boiler plate instance methods:
 * - fromObject
 * - fromBr
 * - toBw
 * - fromBuffer
 * - fromFastBuffer
 * - toBuffer
 * - toFastBuffer
 * - fromHex
 * - toHex
 * - fromString
 * - toString
 * - fromJSON
 * - toJSON
 * - cloneByBuffer
 * - cloneByFastBuffer
 * - cloneByHex
 * - cloneByString
 * - cloneByJSON
 *
 * As well as static methods for:
 * - fromObject
 * - fromBr
 * - fromBuffer
 * - fromFastBuffer
 * - fromHex
 * - fromString
 * - fromJSON
 *
 * The "expect" method also facilitates deserializing a sequence of buffers
 * into an object.
 */
import * as isHex from 'is-hex'
import { Br } from './br'
import { Bw } from './bw'

export class Struct {
    constructor(obj?: any) {
        this.fromObject(obj)
    }

    public fromObject(obj: any): this {
        if (!obj) {
            return this
        }
        for (const key of Object.keys(obj)) {
            if (obj[key] !== undefined) {
                this[key] = obj[key]
            }
        }
        return this
    }

    public static fromObject<T extends Struct>(this: (new () => T) & typeof Struct, obj: any): T {
        return new this().fromObject(obj) as T
    }

    public fromBr(br: Br, ..._rest: any[]): this {
        if (!(br instanceof Br)) {
            throw new Error('br must be a buffer reader')
        }
        throw new Error('not implemented')
    }

    public static fromBr<T extends Struct>(this: (new () => T) & typeof Struct, br: Br): T {
        return new this().fromBr(br) as T
    }

    public asyncFromBr(br: Br, ..._rest: any[]): Promise<this> {
        if (!(br instanceof Br)) {
            throw new Error('br must be a buffer reader')
        }
        throw new Error('not implemented')
    }

    public static asyncFromBr<T extends Struct>(this: (new () => T) & typeof Struct, br: Br): Promise<T> {
        return new this().asyncFromBr(br) as Promise<T>
    }

    public toBw(_bw?: Bw): Bw {
        throw new Error('not implemented')
    }

    public asyncToBw(_bw?: Bw): Promise<Bw> {
        throw new Error('not implemented')
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

    /**
     * Convert a buffer into an object, i.e. deserialize the object.
     */
    public fromBuffer(buf: Buffer, ...rest: any[]): this {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('buf must be a buffer')
        }
        const br = new Br(buf)
        return this.fromBr(br, ...rest)
    }

    public static fromBuffer<T extends Struct>(this: (new () => T) & typeof Struct, buf: Buffer, ...rest: any[]): T {
        return new this().fromBuffer(buf, ...rest) as T
    }

    public asyncFromBuffer(buf: Buffer, ...rest: any[]): Promise<this> {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('buf must be a buffer')
        }
        const br = new Br(buf)
        return this.asyncFromBr(br, ...rest)
    }

    public static asyncFromBuffer<T extends Struct>(
        this: (new () => T) & typeof Struct,
        buf: Buffer,
        ...rest: any[]
    ): Promise<T> {
        return new this().asyncFromBuffer(buf, ...rest) as Promise<T>
    }

    /**
     * The complement of toFastBuffer - see description for toFastBuffer
     */
    public fromFastBuffer(buf: Buffer, ...rest: any[]): this {
        if (buf.length === 0) {
            return this
        } else {
            return this.fromBuffer(buf, ...rest)
        }
    }

    public static fromFastBuffer<T extends Struct>(
        this: (new () => T) & typeof Struct,
        buf: Buffer,
        ...rest: any[]
    ): T {
        return new this().fromFastBuffer(buf, ...rest) as T
    }

    /**
     * Convert the object into a buffer, i.e. serialize the object. This method
     * may block the main thread.
     */
    public toBuffer(): Buffer {
        return this.toBw().toBuffer()
    }

    public asyncToBuffer(): Promise<Buffer> {
        return this.asyncToBw().then((bw) => bw.toBuffer())
    }

    /**
     * Sometimes the toBuffer method has cryptography and blocks the main thread,
     * and we need a non-blocking way to serialize an object. That is what
     * toFastBuffer is. Of course it defaults to just using toBuffer if an object
     * hasn't implemented it. If your regular toBuffer method blocks, like with
     * Bip32, then you should implement this method to be non-blocking. This
     * method is used to send objects to the workers. i.e., for converting a
     * Bip32 object to a string, we need to encode it as a buffer in a
     * non-blocking manner with toFastBuffer, send it to a worker, then the
     * worker converts it to a string, which is a blocking operation.
     *
     * It is very common to want to convert a blank object to a zero length
     * buffer, so we can transport a blank object to a worker. So that behavior
     * is included by default.
     */
    public toFastBuffer(): Buffer {
        if (Object.keys(this).length === 0) {
            return Buffer.alloc(0)
        }
        return this.toBuffer()
    }

    public fromHex(hex: string, ...rest: any[]): this {
        if (!isHex(hex)) {
            throw new Error('invalid hex string')
        }
        const buf = Buffer.from(hex, 'hex')
        return this.fromBuffer(buf, ...rest)
    }

    public static fromHex<T extends Struct>(this: (new () => T) & typeof Struct, hex: string, ...rest: any[]): T {
        return new this().fromHex(hex, ...rest) as T
    }

    public asyncFromHex(hex: string, ...rest: any[]): Promise<this> {
        if (!isHex(hex)) {
            throw new Error('invalid hex string')
        }
        const buf = Buffer.from(hex, 'hex')
        return this.asyncFromBuffer(buf, ...rest)
    }

    public static asyncFromHex<T extends Struct>(
        this: (new () => T) & typeof Struct,
        hex: string,
        ...rest: any[]
    ): Promise<T> {
        return new this().asyncFromHex(hex, ...rest) as Promise<T>
    }

    public fromFastHex(hex: string, ...rest: any[]): this {
        if (!isHex(hex)) {
            throw new Error('invalid hex string')
        }
        const buf = Buffer.from(hex, 'hex')
        return this.fromFastBuffer(buf, ...rest)
    }

    public static fromFastHex<T extends Struct>(this: (new () => T) & typeof Struct, hex: string, ...rest: any[]): T {
        return new this().fromFastHex(hex, ...rest) as T
    }

    public toHex(): string {
        return this.toBuffer().toString('hex')
    }

    public asyncToHex(): Promise<string> {
        return this.asyncToBuffer().then((buf) => buf.toString('hex'))
    }

    public toFastHex(): string {
        return this.toFastBuffer().toString('hex')
    }

    public fromString(str: string, ...rest: any[]): this {
        if (typeof str !== 'string') {
            throw new Error('str must be a string')
        }
        return this.fromHex(str, ...rest)
    }

    public static fromString<T extends Struct>(this: (new () => T) & typeof Struct, str: string, ...rest: any[]): T {
        return new this().fromString(str, ...rest) as T
    }

    public asyncFromString(str: string, ...rest: any[]): Promise<this> {
        if (typeof str !== 'string') {
            throw new Error('str must be a string')
        }
        return this.asyncFromHex(str, ...rest)
    }

    public static asyncFromString<T extends Struct>(
        this: (new () => T) & typeof Struct,
        str: string,
        ...rest: any[]
    ): Promise<T> {
        return new this().asyncFromString(str, ...rest)
    }

    public toString(): string {
        return this.toHex()
    }

    public asyncToString(): Promise<string> {
        return this.asyncToHex()
    }

    public fromJSON(_json): this {
        throw new Error('not implemented')
    }

    public static fromJSON<T extends Struct>(this: (new () => T) & typeof Struct, json): T {
        return new this().fromJSON(json) as T
    }

    public asyncFromJSON(_json, ..._rest): Promise<this> {
        throw new Error('not implemented')
    }

    public static asyncFromJSON<T extends Struct>(this: (new () => T) & typeof Struct, json, ...rest): Promise<T> {
        return new this().asyncFromJSON(json, ...rest) as Promise<T>
    }

    public toJSON(): any {
        const json: Record<string, any> = {}
        for (const val in this) {
            // arrays
            if (Array.isArray(this[val])) {
                const arr = []
                for (const i in this[val]) {
                    if (typeof (this[val][i] as any).toJSON === 'function') {
                        arr.push((this[val][i] as any).toJSON())
                    } else {
                        arr.push(JSON.stringify(this[val][i]))
                    }
                }
                json[val] = arr
                // objects
            } else if (this[val] === null) {
                json[val] = this[val]
            } else if (typeof this[val] === 'object' && typeof (this[val] as any).toJSON === 'function') {
                json[val] = (this[val] as any).toJSON()
                // booleans, numbers, and strings
            } else if (
                typeof this[val] === 'boolean' ||
                typeof this[val] === 'number' ||
                typeof this[val] === 'string'
            ) {
                json[val] = this[val]
                // buffers
            } else if (Buffer.isBuffer(this[val])) {
                json[val] = (this[val] as any).toString('hex')
                // map
            } else if (this[val] instanceof Map) {
                json[val] = JSON.stringify(this[val])
                // throw an error for objects that do not implement toJSON
            } else if (typeof this[val] === 'object') {
                throw new Error('not implemented')
            }
        }
        return json
        // throw new Error('not implemented')
    }

    public asyncToJSON(): Promise<any> {
        throw new Error('not implemented')
    }

    public clone(): this {
        // TODO: Should this be more intelligent about picking which clone method
        // to default to?
        return this.cloneByJSON() as any
    }

    public cloneByBuffer(): this {
        return new (this.constructor as typeof Struct)().fromBuffer(this.toBuffer()) as any
    }

    public cloneByFastBuffer(): this {
        return new (this.constructor as typeof Struct)().fromFastBuffer(this.toFastBuffer()) as any
    }

    public cloneByHex(): this {
        return new (this.constructor as typeof Struct)().fromHex(this.toHex()) as any
    }

    public cloneByString(): this {
        return new (this.constructor as typeof Struct)().fromString(this.toString()) as any
    }

    public cloneByJSON(): this {
        return new (this.constructor as typeof Struct)().fromJSON(this.toJSON()) as any
    }
}
