/* eslint-disable @typescript-eslint/no-floating-promises */
import should = require('should')
import * as sinon from 'sinon'
import { Br } from '../src/br'
import { StructLegacy } from '../src/struct-legacy'

describe('StructLegacy', () => {
    it('should make a new struct', () => {
        let struct = new StructLegacy()
        should.exist(struct)
        struct = new StructLegacy()
        should.exist(struct)
    })

    describe('#fromObject', () => {
        it('should set from an object', () => {
            ;(new StructLegacy().fromObject({ test: 'test' }) as any).test.should.equal('test')
            Object.keys(new StructLegacy().fromObject({})).length.should.equal(0)
        })
    })

    describe('@fromObject', () => {
        it('should set from an object', () => {
            ;(StructLegacy.fromObject({ test: 'test' }) as any).test.should.equal('test')
            Object.keys(StructLegacy.fromObject({})).length.should.equal(0)
        })
    })

    describe('#fromBr', () => {
        it('should throw an error if arg is not a Br', () => {
            ;(function () {
                new StructLegacy().fromBr({} as any)
            }.should.throw('br must be a buffer reader'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const br = new Br()
                new StructLegacy().fromBr(br)
            }.should.throw('not implemented'))
        })
    })

    describe('@fromBr', () => {
        it('should throw an error if arg is not a Br', () => {
            ;(function () {
                StructLegacy.fromBr({} as any)
            }.should.throw('br must be a buffer reader'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const br = new Br()
                StructLegacy.fromBr(br)
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncFromBr', () => {
        it('should throw an error if arg is not a Br', () => {
            ;(function () {
                new StructLegacy().asyncFromBr({} as any)
            }.should.throw('br must be a buffer reader'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const br = new Br()
                new StructLegacy().asyncFromBr(br)
            }.should.throw('not implemented'))
        })
    })

    describe('@asyncFromBr', () => {
        it('should throw an error if arg is not a Br', () => {
            ;(function () {
                StructLegacy.asyncFromBr({} as any)
            }.should.throw('br must be a buffer reader'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const br = new Br()
                StructLegacy.asyncFromBr(br)
            }.should.throw('not implemented'))
        })
    })

    describe('#toBw', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().toBw()
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncToBw', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().asyncToBw()
            }.should.throw('not implemented'))
        })
    })

    describe('#genFromBuffers', () => {
        it('should throw an error', () => {
            ;(function () {
                new StructLegacy().genFromBuffers().next()
            }.should.throw('not implemented'))
        })
    })

    describe('#fromBuffer', () => {
        it('should throw an error if arg is not a buffer', () => {
            ;(function () {
                new StructLegacy().fromBuffer({} as any)
            }.should.throw('buf must be a buffer'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const buf = Buffer.from([])
                new StructLegacy().fromBuffer(buf)
            }.should.throw('not implemented'))
        })
    })

    describe('@fromBuffer', () => {
        it('should throw an error if arg is not a buffer', () => {
            ;(function () {
                StructLegacy.fromBuffer({} as any)
            }.should.throw('buf must be a buffer'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const buf = Buffer.from([])
                StructLegacy.fromBuffer(buf)
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncFromBuffer', () => {
        it('should throw an error if arg is not a buffer', () => {
            ;(function () {
                new StructLegacy().asyncFromBuffer({} as any)
            }.should.throw('buf must be a buffer'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const buf = Buffer.from([])
                new StructLegacy().asyncFromBuffer(buf)
            }.should.throw('not implemented'))
        })
    })

    describe('@asyncFromBuffer', () => {
        it('should throw an error if arg is not a buffer', () => {
            ;(function () {
                StructLegacy.asyncFromBuffer({} as any)
            }.should.throw('buf must be a buffer'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                const buf = Buffer.from([])
                StructLegacy.asyncFromBuffer(buf)
            }.should.throw('not implemented'))
        })
    })

    describe('#fromFastBuffer', () => {
        it('should call fromBuffer', () => {
            let struct = new StructLegacy()
            struct.fromBuffer = sinon.spy()
            struct = Object.create(struct)
            const buf = Buffer.from('00', 'hex')
            struct.fromFastBuffer(buf)
            ;(struct.fromBuffer as sinon.SinonSpy).calledOnce.should.equal(true)
        })

        it('should not call fromBuffer if buf length is zero', () => {
            let struct = new StructLegacy()
            struct.fromBuffer = sinon.spy()
            struct = Object.create(struct)
            const buf = Buffer.from('', 'hex')
            struct.fromFastBuffer(buf)
            ;(struct.fromBuffer as sinon.SinonSpy).calledOnce.should.equal(false)
        })
    })

    describe('@fromFastBuffer', () => {
        it('should call fromBuffer', () => {
            class StructLegacyMock extends StructLegacy {}
            StructLegacyMock.prototype.fromBuffer = sinon.spy()
            const buf = Buffer.from('00', 'hex')
            StructLegacyMock.fromFastBuffer(buf)
            ;(StructLegacyMock.prototype.fromBuffer as sinon.SinonSpy).calledOnce.should.equal(true)
        })

        it('should not call fromBuffer if buf length is zero', () => {
            class StructLegacyMock extends StructLegacy {}
            StructLegacyMock.prototype.fromBuffer = sinon.spy()
            const buf = Buffer.from('', 'hex')
            StructLegacyMock.fromFastBuffer(buf)
            ;(StructLegacyMock.prototype.fromBuffer as sinon.SinonSpy).calledOnce.should.equal(false)
        })
    })

    describe('#toBuffer', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().toBuffer()
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncToBuffer', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().asyncToBuffer()
            }.should.throw('not implemented'))
        })
    })

    describe('#toFastBuffer', () => {
        it('should call toBuffer', () => {
            let struct = new StructLegacy()
            struct.toBuffer = sinon.spy()
            struct = Object.create(struct)
            ;(struct as any).property = 'test'
            Object.keys(struct).length.should.equal(1)
            struct.toFastBuffer()
            ;(struct.toBuffer as sinon.SinonSpy).calledOnce.should.equal(true)
        })

        it('should return zero-length buffer if object has no keys', () => {
            let struct = new StructLegacy()
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
                new StructLegacy().fromHex('x00')
            }.should.throw('invalid hex string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().fromHex('00')
            }.should.throw('not implemented'))
        })
    })

    describe('@fromHex', () => {
        it('should throw an error for invalid hex string', () => {
            ;(function () {
                StructLegacy.fromHex('x00')
            }.should.throw('invalid hex string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                StructLegacy.fromHex('00')
            }.should.throw('not implemented'))
        })
    })

    describe('#fromFastHex', () => {
        it('should throw an error for invalid hex string', () => {
            ;(function () {
                new StructLegacy().fromFastHex('x00')
            }.should.throw('invalid hex string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().fromFastHex('00')
            }.should.throw('not implemented'))
        })
    })

    describe('@fromFastHex', () => {
        it('should throw an error for invalid hex string', () => {
            ;(function () {
                StructLegacy.fromFastHex('x00')
            }.should.throw('invalid hex string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                StructLegacy.fromFastHex('00')
            }.should.throw('not implemented'))
        })
    })

    describe('#toHex', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().toHex()
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncToHex', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().asyncToHex()
            }.should.throw('not implemented'))
        })
    })

    describe('#toFastHex', () => {
        it('should return an empty string for blank data', () => {
            const hex = new StructLegacy().toFastHex()
            ;(typeof hex === 'string').should.equal(true)
            hex.length.should.equal(0)
        })
    })

    describe('#fromString', () => {
        it('should throw an error for invalid string', () => {
            ;(function () {
                new StructLegacy().fromString({} as any)
            }.should.throw('str must be a string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().fromString('00')
            }.should.throw('not implemented'))
        })
    })

    describe('@fromString', () => {
        it('should throw an error for invalid string', () => {
            ;(function () {
                StructLegacy.fromString({} as any)
            }.should.throw('str must be a string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                StructLegacy.fromString('00')
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncFromString', () => {
        it('should throw an error for invalid string', () => {
            ;(function () {
                new StructLegacy().asyncFromString({} as any)
            }.should.throw('str must be a string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().asyncFromString('00')
            }.should.throw('not implemented'))
        })
    })

    describe('@asyncFromString', () => {
        it('should throw an error for invalid string', () => {
            ;(function () {
                StructLegacy.asyncFromString({} as any)
            }.should.throw('str must be a string'))
        })

        it('should throw a not implemented error', () => {
            ;(function () {
                StructLegacy.asyncFromString('00')
            }.should.throw('not implemented'))
        })
    })

    describe('#toString', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().toString()
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncToString', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().asyncToString()
            }.should.throw('not implemented'))
        })
    })

    describe('#fromJSON', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().fromJSON(undefined)
            }.should.throw('not implemented'))
        })
    })

    describe('@fromJSON', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                StructLegacy.fromJSON(undefined)
            }.should.throw('not implemented'))
        })
    })

    describe('#asyncFromJSON', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().asyncFromJSON(undefined)
            }.should.throw('not implemented'))
        })
    })

    describe('@asyncFromJSON', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                StructLegacy.asyncFromJSON(undefined)
            }.should.throw('not implemented'))
        })
    })

    describe('#toJSON', () => {
        it('should convert an object into a json string', () => {
            const obj = new StructLegacy()
            ;(obj as any).arr = [1, 2, 3, 4]
            ;(obj as any).anotherObj = new StructLegacy()

            const json = obj.toJSON()

            should.exist(json.arr)
            should.exist(json.anotherObj)
        })
    })

    describe('#asyncToJSON', () => {
        it('should throw a not implemented error', () => {
            ;(function () {
                new StructLegacy().asyncToJSON()
            }.should.throw('not implemented'))
        })
    })

    describe('#clone', () => {
        it('should call cloneByJSON', () => {
            const struct = new StructLegacy()
            struct.cloneByJSON = sinon.spy()
            struct.clone()
            ;(struct.cloneByJSON as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })

    describe('#cloneByBuffer', () => {
        it('should call toBuffer', () => {
            class StructLegacy2 extends StructLegacy {
                public toBuffer() {
                    return {} as any
                }

                public fromBuffer(_obj: any) {
                    return this
                }
            }
            const struct = new StructLegacy2()
            struct.toBuffer = sinon.spy()
            struct.cloneByBuffer()
            ;(struct.toBuffer as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })

    describe('#cloneByFastBuffer', () => {
        it('should call toFastBuffer', () => {
            class StructLegacy2 extends StructLegacy {
                public toFastBuffer() {
                    return {} as any
                }

                public fromFastBuffer(_obj: any) {
                    return this
                }
            }
            const struct = new StructLegacy2()
            struct.toFastBuffer = sinon.spy()
            struct.cloneByFastBuffer()
            ;(struct.toFastBuffer as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })

    describe('#cloneByHex', () => {
        it('should call toHex', () => {
            class StructLegacy2 extends StructLegacy {
                public toHex() {
                    return {} as any
                }

                public fromHex(_obj: any) {
                    return this
                }
            }
            const struct = new StructLegacy2()
            struct.toHex = sinon.spy()
            struct.cloneByHex()
            ;(struct.toHex as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })

    describe('#cloneByString', () => {
        it('should call toString', () => {
            class StructLegacy2 extends StructLegacy {
                public toString() {
                    return {} as any
                }

                public fromString(_obj: any) {
                    return this
                }
            }
            const struct = new StructLegacy2()
            struct.toString = sinon.spy()
            struct.cloneByString()
            ;(struct.toString as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })

    describe('#cloneByJSON', () => {
        it('should call toJSON', () => {
            class StructLegacy2 extends StructLegacy {
                public toJSON() {
                    return {}
                }

                public fromJSON(_obj: any) {
                    return this
                }
            }
            const struct = new StructLegacy2()
            struct.toJSON = sinon.spy()
            struct.cloneByJSON()
            ;(struct.toJSON as sinon.SinonSpy).calledOnce.should.equal(true)
        })
    })
})
