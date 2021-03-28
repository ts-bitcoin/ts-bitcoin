/* eslint-disable @typescript-eslint/no-shadow */
import should = require('should')
import { Br } from '../src/br'
import { Bw } from '../src/bw'
import { Constants } from '../src/constants'
import { Hash } from '../src/hash'
import { Msg } from '../src/msg'
import { Random } from '../src/random'

describe('Msg', () => {
    const msghex = 'e3e1f3e876657261636b000000000000000000005df6e0e2'
    const msgtesthex = 'f4e5f3f476657261636b000000000000000000005df6e0e2'
    const msgregtesthex = 'dab5bffa76657261636b000000000000000000005df6e0e2'
    const msgbuf = Buffer.from(msghex, 'hex')
    const msg = new Msg().fromHex(msghex)
    const msgjson = msg.toJSON()
    const msgjsonstr = JSON.stringify(msgjson)

    it('should satisfy this basic API', () => {
        const msg = new Msg()
        should.exist(msg)
        msg.magicNum.should.equal(msg.constants.Msg.magicNum)
    })

    describe('#setCmd', () => {
        it('should set the command', () => {
            const msg = new Msg()
            msg.setCmd('inv')
            const cmdbuf = Buffer.alloc(12)
            cmdbuf.fill(0)
            cmdbuf.write('inv')
            Buffer.compare(cmdbuf, msg.cmdbuf).should.equal(0)
        })
    })

    describe('#getCmd', () => {
        it('should get the command', () => {
            const msg = new Msg()
            msg.setCmd('inv')
            msg.getCmd().should.equal('inv')
        })

        it('should get the command when the command is 12 chars', () => {
            const msg = new Msg()
            msg.setCmd('a'.repeat(12))
            msg.getCmd().should.equal('a'.repeat(12))
        })

        it('should get the command when there are extra 0s', () => {
            const msg = new Msg()
            msg.setCmd('a')
            msg.cmdbuf.write('a', 2)
            msg.getCmd().should.equal('a\u0000a')
        })
    })

    describe('@checksum', () => {
        it('should return known value', () => {
            const buf = Buffer.alloc(0)
            const checksumbuf = Msg.checksum(buf)
            Buffer.compare(checksumbuf, Hash.sha256Sha256(buf).slice(0, 4)).should.equal(0)
        })
    })

    describe('@asyncChecksum', () => {
        it('should return known value and compute same as @checksum', async () => {
            const buf = Buffer.alloc(0)
            const checksumbuf = await Msg.asyncChecksum(buf)
            Buffer.compare(checksumbuf, Hash.sha256Sha256(buf).slice(0, 4)).should.equal(0)
            const checksumbuf2 = Msg.checksum(buf)
            Buffer.compare(checksumbuf, checksumbuf2).should.equal(0)
        })
    })

    describe('#setData', () => {
        it('should data to a blank buffer', () => {
            const msg = new Msg()
            msg.setCmd('inv')
            msg.setData(Buffer.from([]))
            msg.isValid().should.equal(true)
        })
    })

    describe('#asyncSetData', () => {
        it('should data to a blank buffer', async () => {
            const msg = new Msg()
            msg.setCmd('inv')
            await msg.asyncSetData(Buffer.from([]))
            msg.isValid().should.equal(true)
        })
    })

    describe('#genFromBuffers', () => {
        it('should parse this known message', () => {
            let msgassembler
            let msg
            let next

            // test whole message at once
            msg = new Msg()
            msgassembler = msg.genFromBuffers()
            next = msgassembler.next() // one blank .next() is necessary
            next = msgassembler.next(msgbuf)
            next.value.length.should.equal(0)
            next.done.should.equal(true)
            msg.toHex().should.equal(msghex)

            // test message one byte at a time
            msg = new Msg()
            msgassembler = msg.genFromBuffers()
            msgassembler.next() // one blank .next() is necessary
            msgassembler.next() // should be able to place in multiple undefined buffers
            msgassembler.next(Buffer.from([])) // should be able to place zero buf
            for (let i = 0; i < msgbuf.length; i++) {
                const onebytebuf = msgbuf.slice(i, i + 1)
                next = msgassembler.next(onebytebuf)
            }
            msg.toHex().should.equal(msghex)
            next.done.should.equal(true)
            next.value.length.should.equal(0)

            // test message three bytes at a time
            msg = new Msg()
            msgassembler = msg.genFromBuffers()
            msgassembler.next() // one blank .next() is necessary
            for (let i = 0; i < msgbuf.length; i += 3) {
                const three = msgbuf.slice(i, i + 3)
                next = msgassembler.next(three)
            }
            msg.toHex().should.equal(msghex)
            next.done.should.equal(true)
            next.value.length.should.equal(0)
        })

        it('should throw an error for invalid magicNum in strict mode', () => {
            const msg = new Msg().fromBuffer(msgbuf)
            msg.magicNum = 0
            ;(function () {
                const msgassembler = new Msg().genFromBuffers({ strict: true })
                msgassembler.next()
                msgassembler.next(msg.toBuffer())
            }.should.throw('invalid magicNum'))
        })

        it('should throw an error for message over max size in strict mode', () => {
            const msg = new Msg()
            const msgbuf2 = Buffer.from(msgbuf)
            msgbuf2.writeUInt32BE(msg.constants.MaxSize + 1, 4 + 12)
            ;(function () {
                const msgassembler = new Msg().genFromBuffers({ strict: true })
                msgassembler.next()
                msgassembler.next(msgbuf2)
            }.should.throw('message size greater than maxsize'))
        })
    })

    describe('#STN', () => {
        it('should match initialized magicNum against STN magicnum', () => {
            const msg = new Msg.STN()
            msg.magicNum.should.equal(Constants.STN.Msg.magicNum)
            msg.magicNum.should.not.equal(Constants.Mainnet.Msg.magicNum)
        })
    })

    describe('#Testnet', () => {
        it('should parse this known message', () => {
            const msg = new Msg().fromBuffer(Buffer.from(msgtesthex, 'hex'))
            msg.magicNum.should.equal(Constants.Testnet.Msg.magicNum)
        })
    })

    describe('#Regtest', () => {
        it('should parse this known message', () => {
            const msg = new Msg().fromBuffer(Buffer.from(msgregtesthex, 'hex'))
            msg.magicNum.should.equal(Constants.Regtest.Msg.magicNum)
        })
    })

    describe('#fromBuffer', () => {
        it('should parse this known message', () => {
            const msg = new Msg().fromBuffer(msgbuf)
            msg.toHex().should.equal(msghex)
        })
    })

    describe('#toBuffer', () => {
        it('should parse this known message', () => {
            const msg = new Msg().fromBuffer(msgbuf)
            msg.toBuffer().toString('hex').should.equal(msghex)
        })
    })

    describe('#fromBr', () => {
        it('should parse this known message', () => {
            const br = new Br(msgbuf)
            const msg = new Msg().fromBr(br)
            msg.toHex().should.equal(msghex)
        })
    })

    describe('#toBw', () => {
        it('should create this known message', () => {
            const bw = new Bw()
            new Msg().fromHex(msghex).toBw(bw).toBuffer().toString('hex').should.equal(msghex)
            new Msg().fromHex(msghex).toBw().toBuffer().toString('hex').should.equal(msghex)
        })
    })

    describe('#fromJSON', () => {
        it('should parse this known json msg', () => {
            new Msg().fromJSON(msgjson).toHex().should.equal(msghex)
        })
    })

    describe('#toJSON', () => {
        it('should create this known message', () => {
            JSON.stringify(new Msg().fromHex(msghex).toJSON()).should.equal(msgjsonstr)
        })
    })

    describe('#isValid', () => {
        it('should know these messages are valid or invalid', () => {
            new Msg().fromHex(msghex).isValid().should.equal(true)
        })
    })

    describe('#asyncIsValid', () => {
        it('should return same as isValid', async () => {
            const msg = new Msg()
            msg.setCmd('ping')
            msg.setData(Random.getRandomBuffer(8))
            msg.isValid().should.equal(true)
            const res = await msg.asyncIsValid()
            res.should.equal(msg.isValid())
        })
    })

    describe('#asyncValidate', () => {
        it('should validate this known valid message', () => {
            const msg = new Msg()
            msg.setCmd('ping')
            msg.setData(Random.getRandomBuffer(8))
            msg.validate()
        })
    })

    describe('#asyncValidate', () => {
        it('should validate this known valid message', async () => {
            const msg = new Msg()
            msg.setCmd('ping')
            msg.setData(Random.getRandomBuffer(8))
            await msg.asyncValidate()
        })

        it('should validate this known valid message', async () => {
            const msg = new Msg()
            msg.setCmd('ping')
            msg.setData(Random.getRandomBuffer(8))
            msg.checksumbuf = Buffer.from('00000000', 'hex')
            let errors = 0
            try {
                await msg.asyncValidate()
            } catch (e) {
                errors++
            }
            errors.should.equal(1)
        })
    })
})
