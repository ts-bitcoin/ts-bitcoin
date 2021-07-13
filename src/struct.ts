import { Br } from './br'
import { Bw } from './bw'

/**
 * A convenient structure to extend objects from that comes with very common boiler plate methods.
 * The "expect" method also facilitates deserializing a sequence of buffers into an object.
 */
export class Struct {
    /**
     * Create a instance.
     * @param obj Object.
     */
    constructor(obj?: Record<string, unknown>) {
        this.fromObject(obj)
    }

    /**
     * Inject properties from object.
     * @param obj Object.
     * @returns This instance.
     */
    public fromObject(obj: Record<string, unknown> = {}): this {
        Object.assign(this, obj)
        return this
    }

    /**
     * Instantiate from object.
     * @param obj Object.
     * @returns Struct instance.
     */
    public static fromObject<T extends Struct>(this: (new () => T) & typeof Struct, obj: Record<string, unknown>): T {
        return new this().fromObject(obj) as T
    }

    /**
     * Inject properties from a buffer reader.
     * @param br Buffer reader.
     * @returns This instance.
     */
    public fromBr(br: Br): this {
        if (!(br instanceof Br)) {
            throw new Error('br must be a buffer reader')
        }
        throw new Error('not implemented')
    }

    /**
     * Instantiate from a buffer reader.
     * @param br Buffer reader.
     * @returns Struct instance.
     */
    public static fromBr<T extends Struct>(this: (new () => T) & typeof Struct, br: Br): T {
        return new this().fromBr(br) as T
    }

    /**
     * Inject properties from a buffer reader asynchronously.
     * @param br Buffer reader.
     * @returns This instance.
     */
    public asyncFromBr(br: Br): Promise<this> {
        if (!(br instanceof Br)) {
            throw new Error('br must be a buffer reader')
        }
        throw new Error('not implemented')
    }

    /**
     * Instantiate from a buffer reader asynchronously.
     * @param br Buffer reader.
     * @returns This instance.
     */
    public static asyncFromBr<T extends Struct>(this: (new () => T) & typeof Struct, br: Br): Promise<T> {
        return new this().asyncFromBr(br) as Promise<T>
    }

    /**
     * Write the struct to a buffer writer.
     * @param bw Optional buffer writer to write to.
     * @returns Given or new buffer writer.
     */
    public toBw(_bw?: Bw): Bw {
        throw new Error('not implemented')
    }

    /**
     * Write the struct to a buffer writer asynchronously.
     * @param bw Optional buffer writer to write to.
     * @returns Given or new buffer writer.
     */
    public asyncToBw(_bw?: Bw): Promise<Bw> {
        throw new Error('not implemented')
    }

    /**
     * Inject properties from a buffer.
     * @param buf Buffer.
     * @returns This instance.
     */
    public fromBuffer(buf: Buffer): this {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('buf must be a buffer')
        }
        const br = new Br(buf)
        return this.fromBr(br)
    }

    /**
     * Instantiate from a buffer.
     * @param buf Buffer.
     * @returns Struct instance.
     */
    public static fromBuffer<T extends Struct>(this: (new () => T) & typeof Struct, buf: Buffer): T {
        return new this().fromBuffer(buf) as T
    }

    /**
     * Inject properties from a buffer asynchronously.
     * @param buf Buffer.
     * @returns This instance.
     */
    public asyncFromBuffer(buf: Buffer): Promise<this> {
        if (!Buffer.isBuffer(buf)) {
            throw new Error('buf must be a buffer')
        }
        const br = new Br(buf)
        return this.asyncFromBr(br)
    }

    /**
     * Instantiate from a buffer asynchronously.
     * @param buf Buffer.
     * @returns Struct instance.
     */
    public static asyncFromBuffer<T extends Struct>(this: (new () => T) & typeof Struct, buf: Buffer): Promise<T> {
        return new this().asyncFromBuffer(buf) as Promise<T>
    }

    /**
     * Convert the struct to a buffer using the binary structure defined in toBw().
     * @returns Struct properties as buffer.
     */
    public toBuffer(): Buffer {
        return this.toBw().toBuffer()
    }

    /**
     * Convert the struct to a buffer using the binary structure defined in toBw() asynchronously.
     * @returns Struct properties as buffer.
     */
    public asyncToBuffer(): Promise<Buffer> {
        return this.asyncToBw().then((bw) => bw.toBuffer())
    }

    /**
     * Inject properties from a hex string.
     * @param hex Hex string.
     * @returns This instance.
     */
    public fromHex(hex: string): this {
        const size = hex.length >>> 1
        const buf = Buffer.from(hex, 'hex')
        if (buf.length !== size) {
            throw new Error('hex must be a hex string')
        }
        return this.fromBuffer(buf)
    }

    /**
     * Instantiate from a hex string.
     * @param hex Hex string.
     * @returns Struct instance.
     */
    public static fromHex<T extends Struct>(this: (new () => T) & typeof Struct, hex: string): T {
        return new this().fromHex(hex) as T
    }

    /**
     * Inject properties from a hex string asynchronously.
     * @param hex Hex string.
     * @returns This instance.
     */
    public asyncFromHex(hex: string): Promise<this> {
        const size = hex.length >>> 1
        const buf = Buffer.from(hex, 'hex')
        if (buf.length !== size) {
            throw new Error('hex must be a hex string')
        }
        return this.asyncFromBuffer(buf)
    }

    /**
     * Instantiate from a hex string asynchronously.
     * @param hex Hex string.
     * @returns Struct instance.
     */
    public static asyncFromHex<T extends Struct>(this: (new () => T) & typeof Struct, hex: string): Promise<T> {
        return new this().asyncFromHex(hex) as Promise<T>
    }

    /**
     * Convert the struct to a hex string using the binary structure defined in toBw().
     * @returns Struct properties as hex string.
     */
    public toHex(): string {
        return this.toBuffer().toString('hex')
    }

    /**
     * Convert the struct to a hex string using the binary structure defined in toBw() asynchronously.
     * @returns Struct properties as hex string.
     */
    public asyncToHex(): Promise<string> {
        return this.asyncToBuffer().then((buf) => buf.toString('hex'))
    }

    /**
     * Inject properties from a string. Alias for fromHex().
     * @param str String.
     * @returns This instance.
     */
    public fromString(str: string): this {
        if (typeof str !== 'string') {
            throw new Error('str must be a string')
        }
        return this.fromHex(str)
    }

    /**
     * Instantiate from a string. Alias for fromHex().
     * @param str String.
     * @returns Struct instance.
     */
    public static fromString<T extends Struct>(this: (new () => T) & typeof Struct, str: string): T {
        return new this().fromString(str) as T
    }

    /**
     * Inject properties from a string asynchronously. Alias for asyncFomHex().
     * @param str String.
     * @returns This instance.
     */
    public asyncFromString(str: string): Promise<this> {
        if (typeof str !== 'string') {
            throw new Error('str must be a string')
        }
        return this.asyncFromHex(str)
    }

    /**
     * Instantiate from a string asynchronously. Alias for asyncFomHex().
     * @param str String.
     * @returns Struct instance.
     */
    public static asyncFromString<T extends Struct>(this: (new () => T) & typeof Struct, str: string): Promise<T> {
        return new this().asyncFromString(str)
    }

    /**
     * Convert the struct to a string. Alias for toHex().
     * @returns Struct properties as string.
     */
    public toString(): string {
        return this.toHex()
    }

    /**
     * Convert the struct to a string asynchronously. Alias for toHex() .
     * @returns Struct properties as string.
     */
    public asyncToString(): Promise<string> {
        return this.asyncToHex()
    }

    /**
     * Inject properties from a json object.
     * @param json Json object.
     * @returns This instance.
     */
    public fromJSON(_json: any): this {
        throw new Error('not implemented')
    }

    /**
     * Instantiate from a json object.
     * @param json Json object.
     * @returns This instance.
     */
    public static fromJSON<T extends Struct>(this: (new () => T) & typeof Struct, json: any): T {
        return new this().fromJSON(json) as T
    }

    /**
     * Inject properties from a json object asynchronously.
     * @param json Json object.
     * @returns This instance.
     */
    public asyncFromJSON(_json: any): Promise<this> {
        throw new Error('not implemented')
    }

    /**
     * Instantiate from a json object asynchronously.
     * @param json Json object.
     * @returns This instance.
     */
    public static asyncFromJSON<T extends Struct>(this: (new () => T) & typeof Struct, json: any): Promise<T> {
        return new this().asyncFromJSON(json) as Promise<T>
    }

    /**
     * Convert the struct to a json object.
     * @returns Struct properties as json object.
     */
    public toJSON(): any {
        throw new Error('not implemented')
    }

    /**
     * Convert the struct to a json object asynchronously.
     * @returns Struct properties as json object.
     */
    public asyncToJSON(): Promise<any> {
        throw new Error('not implemented')
    }

    /**
     * Clone this struct instance.
     * @returns Cloned instance.
     */
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
