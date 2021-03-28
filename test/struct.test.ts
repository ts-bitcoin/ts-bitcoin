/* eslint-disable @typescript-eslint/no-floating-promises */
import should = require('should')
import * as sinon from 'sinon'
import { Br } from '../src/br'
import { Struct } from '../src/struct'

describe('Struct', () => {
    it('should make a new struct', () => {
        let struct = new Struct()
        should.exist(struct)
        struct = new Struct()
        should.exist(struct)
    })

    describe('#fromObject', () => {
        it('should set from an object', () => {
            ;(new Struct().fromObject({ test: 'test' }) as any).test.should.equal('test')
            Object.keys(new Struct().fromObject({})).length.should.equal(0)
        })
    })

    describe('@fromObject', () => {
        it('should set from an object', () => {
            ;(Struct.fromObject({ test: 'test' }) as any).test.should.equal('test')
            Object.keys(Struct.fromObject({})).length.should.equal(0)
        })
    })

    describe('#fromBr', () => {
        it('should throw an error if arg is not a Br', () => {
            ;(function () {
                new Struct().fromBr({} as any)
            }.should.throw('br must be a buffer reader'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const br = new Br()
                new Struct().fromBr(br)
            }.should.throw('not implemented'))
        })
    })

    describe('@fromBr', () => {
        it('should throw an error if arg is not a Br', () => {
            ;(function () {
                Struct.fromBr({} as any)
            }.should.throw('br must be a buffer reader'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const br = new Br()
                Struct.fromBr(br)
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncFromBr', () => {
        it('should throw an error if arg is not a Br', () => {
            ;(function () {
                new Struct().asyncFromBr({} as any)
            }.should.throw('br must be a buffer reader'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const br = new Br()
                new Struct().asyncFromBr(br)
            }.should.throw('not implemented'))
        })
    })

    describe('@asyncFromBr', () => {
        it('should throw an error if arg is not a Br', () => {
            ;(function () {
                Struct.asyncFromBr({} as any)
            }.should.throw('br must be a buffer reader'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const br = new Br()
                Struct.asyncFromBr(br)
            }.should.throw('not implemented'))
        })
    })

    describe('#toBw', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().toBw()
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncToBw', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().asyncToBw()
            }.should.throw('not implemented'))
        })
    })

    describe('#genFromBuffers', () => {
        it('should throw an error', () => {
            ;(function () {
                new Struct().genFromBuffers().next()
            }.should.throw('not implemented'))
        })
    })

    describe('#fromBuffer', () => {
        it('should throw an error if arg is not a buffer', () => {
            ;(function () {
                new Struct().fromBuffer({} as any)
            }.should.throw('buf must be a buffer'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const buf = Buffer.from([])
                new Struct().fromBuffer(buf)
            }.should.throw('not implemented'))
        })
    })

    describe('@fromBuffer', () => {
        it('should throw an error if arg is not a buffer', () => {
            ;(function () {
                Struct.fromBuffer({} as any)
            }.should.throw('buf must be a buffer'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const buf = Buffer.from([])
                Struct.fromBuffer(buf)
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncFromBuffer', () => {
        it('should throw an error if arg is not a buffer', () => {
            ;(function () {
                new Struct().asyncFromBuffer({} as any)
            }.should.throw('buf must be a buffer'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const buf = Buffer.from([])
                new Struct().asyncFromBuffer(buf)
            }.should.throw('not implemented'))
        })
    })

    describe('@asyncFromBuffer', () => {
        it('should throw an error if arg is not a buffer', () => {
            ;(function () {
                Struct.asyncFromBuffer({} as any)
            }.should.throw('buf must be a buffer'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const buf = Buffer.from([])
                Struct.asyncFromBuffer(buf)
            }.should.throw('not implemented'))
        })
    })

    describe('#fromFastBuffer', () => {
        it('should call fromBuffer', () => {
            let struct = new Struct()
            struct.fromBuffer = sinon.spy()
            struct = Object.create(struct)
            const buf = Buffer.from('00', 'hex')
            struct.fromFastBuffer(buf)
            ;(struct.fromBuffer as sinon.SinonSpy).calledOnce.should.equal(true)
        })

        it('should not call fromBuffer if buf length is zero', () => {
            let struct = new Struct()
            struct.fromBuffer = sinon.spy()
            struct = Object.create(struct)
            const buf = Buffer.from('', 'hex')
            struct.fromFastBuffer(buf)
            ;(struct.fromBuffer as sinon.SinonSpy).calledOnce.should.equal(false)
        })
    })

    describe('@fromFastBuffer', () => {
        it('should call fromBuffer', () => {
            class StructMock extends Struct {}
            StructMock.prototype.fromBuffer = sinon.spy()
            const buf = Buffer.from('00', 'hex')
            StructMock.fromFastBuffer(buf)
            ;(StructMock.prototype.fromBuffer as sinon.SinonSpy).calledOnce.should.equal(true)
        })

        it('should not call fromBuffer if buf length is zero', () => {
            class StructMock extends Struct {}
            StructMock.prototype.fromBuffer = sinon.spy()
            const buf = Buffer.from('', 'hex')
            StructMock.fromFastBuffer(buf)
            ;(StructMock.prototype.fromBuffer as sinon.SinonSpy).calledOnce.should.equal(false)
        })
    })

    describe('#toBuffer', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().toBuffer()
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncToBuffer', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().asyncToBuffer()
            }.should.throw('not implemented'))
        })
    })

    describe('#toFastBuffer', () => {
        it('should call toBuffer', () => {
            let struct = new Struct()
            struct.toBuffer = sinon.spy()
            struct = Object.create(struct)
            ;(struct as any).property = 'test'
            Object.keys(struct).length.should.equal(1)
            struct.toFastBuffer()
            ;(struct.toBuffer as sinon.SinonSpy).calledOnce.should.equal(true)
        })

        it('should return zero-length buffer if object has no keys', () => {
            let struct = new Struct()
            struct.toBuffer = sinon.spy()
            struct = Object.create(struct)
            Object.keys(struct).length.should.equal(0)
            struct.toFastBuffer().length.should.equal(0)
            ;(struct.toBuffer as sinon.SinonSpy).calledOnce.should.equal(false)
        })
    })

    describe('#fromHex', () => {
        it('should throw an error for invalid hex string', () => {
            ;(function () {
                new Struct().fromHex('x00')
            }.should.throw('invalid hex string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().fromHex('00')
            }.should.throw('not implemented'))
        })
    })

    describe('@fromHex', () => {
        it('should throw an error for invalid hex string', () => {
            ;(function () {
                Struct.fromHex('x00')
            }.should.throw('invalid hex string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                Struct.fromHex('00')
            }.should.throw('not implemented'))
        })
    })

    describe('#fromFastHex', () => {
        it('should throw an error for invalid hex string', () => {
            ;(function () {
                new Struct().fromFastHex('x00')
            }.should.throw('invalid hex string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().fromFastHex('00')
            }.should.throw('not implemented'))
        })
    })

    describe('@fromFastHex', () => {
        it('should throw an error for invalid hex string', () => {
            ;(function () {
                Struct.fromFastHex('x00')
            }.should.throw('invalid hex string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                Struct.fromFastHex('00')
            }.should.throw('not implemented'))
        })
    })

    describe('#toHex', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().toHex()
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncToHex', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().asyncToHex()
            }.should.throw('not implemented'))
        })
    })

    describe('#toFastHex', () => {
        it('should return an empty string for blank data', () => {
            const hex = new Struct().toFastHex()
            ;(typeof hex === 'string').should.equal(true)
            hex.length.should.equal(0)
        })
    })

    describe('#fromString', () => {
        it('should throw an error for invalid string', () => {
            ;(function () {
                new Struct().fromString({} as any)
            }.should.throw('str must be a string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().fromString('00')
            }.should.throw('not implemented'))
        })
    })

    describe('@fromString', () => {
        it('should throw an error for invalid string', () => {
            ;(function () {
                Struct.fromString({} as any)
            }.should.throw('str must be a string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                Struct.fromString('00')
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncFromString', () => {
        it('should throw an error for invalid string', () => {
            ;(function () {
                new Struct().asyncFromString({} as any)
            }.should.throw('str must be a string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().asyncFromString('00')
            }.should.throw('not implemented'))
        })
    })

    describe('@asyncFromString', () => {
        it('should throw an error for invalid string', () => {
            ;(function () {
                Struct.asyncFromString({} as any)
            }.should.throw('str must be a string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                Struct.asyncFromString('00')
            }.should.throw('not implemented'))
        })
    })

    describe('#toString', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().toString()
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncToString', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().asyncToString()
            }.should.throw('not implemented'))
        })
    })

    describe('#fromJSON', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().fromJSON(undefined)
            }.should.throw('not implemented'))
        })
    })

    describe('@fromJSON', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                Struct.fromJSON(undefined)
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncFromJSON', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().asyncFromJSON(undefined)
            }.should.throw('not implemented'))
        })
    })

    describe('@asyncFromJSON', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                Struct.asyncFromJSON(undefined)
            }.should.throw('not implemented'))
        })
    })

    describe('#toJSON', () => {
        it('should convert an object into a json string', () => {
            const obj = new Struct()
            ;(obj as any).arr = [1, 2, 3, 4]
            ;(obj as any).anotherObj = new Struct()

            const json = obj.toJSON()

            should.exist(json.arr)
            should.exist(json.anotherObj)
        })
    })

    describe('#asyncToJSON', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new Struct().asyncToJSON()
            }.should.throw('not implemented'))
        })
    })

    describe('#clone', () => {
        it('should call cloneByJSON', () => {
            const struct = new Struct()
            struct.cloneByJSON = sinon.spy()
            struct.clone()
            ;(struct.cloneByJSON as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })

    describe('#cloneByBuffer', () => {
        it('should call toBuffer', () => {
            class Struct2 extends Struct {
                public toBuffer() {
                    return {} as any
                }

                public fromBuffer(_obj: any) {
                    return this
                }
            }
            const struct = new Struct2()
            struct.toBuffer = sinon.spy()
            struct.cloneByBuffer()
            ;(struct.toBuffer as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })

    describe('#cloneByFastBuffer', () => {
        it('should call toFastBuffer', () => {
            class Struct2 extends Struct {
                public toFastBuffer() {
                    return {} as any
                }

                public fromFastBuffer(_obj: any) {
                    return this
                }
            }
            const struct = new Struct2()
            struct.toFastBuffer = sinon.spy()
            struct.cloneByFastBuffer()
            ;(struct.toFastBuffer as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })

    describe('#cloneByHex', () => {
        it('should call toHex', () => {
            class Struct2 extends Struct {
                public toHex() {
                    return {} as any
                }

                public fromHex(_obj: any) {
                    return this
                }
            }
            const struct = new Struct2()
            struct.toHex = sinon.spy()
            struct.cloneByHex()
            ;(struct.toHex as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })

    describe('#cloneByString', () => {
        it('should call toString', () => {
            class Struct2 extends Struct {
                public toString() {
                    return {} as any
                }

                public fromString(_obj: any) {
                    return this
                }
            }
            const struct = new Struct2()
            struct.toString = sinon.spy()
            struct.cloneByString()
            ;(struct.toString as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })

    describe('#cloneByJSON', () => {
        it('should call toJSON', () => {
            class Struct2 extends Struct {
                public toJSON() {
                    return {}
                }

                public fromJSON(_obj: any) {
                    return this
                }
            }
            const struct = new Struct2()
            struct.toJSON = sinon.spy()
            struct.cloneByJSON()
            ;(struct.toJSON as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })
})
