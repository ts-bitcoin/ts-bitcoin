import should = require('should')
import { Bn } from '../src/bn'
import { VarInt } from '../src/var-int'
import { Version } from '../src/version'

describe('Version', () => {
    it('should exist', () => {
        should.exist(Version)
        should.exist(new Version())
    })

    describe('#toBuffer', () => {
        it('should convert to buffer', () => {
            const version = Version.fromObject({
                versionBytesNum: 0,
                servicesBuf: Buffer.alloc(8),
                timeBn: new Bn(0),
                addrRecvServicesBuf: Buffer.alloc(8),
                addrRecvIpAddrBuf: Buffer.alloc(16),
                addrRecvPort: 0,
                addrTransServicesBuf: Buffer.alloc(8),
                addrTransIpAddrBuf: Buffer.alloc(16),
                addrTransPort: 0,
                nonceBuf: Buffer.alloc(8),
                userAgentVi: VarInt.fromNumber('test'.length),
                userAgentBuf: Buffer.from('test'),
                startHeightNum: 100,
                relay: true,
            })
            Buffer.isBuffer(version.toBuffer()).should.equal(true)
        })
    })

    describe('#fromBuffer', () => {
        it('should convert from buffer', () => {
            let version = Version.fromObject({
                versionBytesNum: 0,
                servicesBuf: Buffer.alloc(8),
                timeBn: new Bn(0),
                addrRecvServicesBuf: Buffer.alloc(8),
                addrRecvIpAddrBuf: Buffer.alloc(16),
                addrRecvPort: 0,
                addrTransServicesBuf: Buffer.alloc(8),
                addrTransIpAddrBuf: Buffer.alloc(16),
                addrTransPort: 0,
                nonceBuf: Buffer.alloc(8),
                userAgentVi: VarInt.fromNumber('test'.length),
                userAgentBuf: Buffer.from('test'),
                startHeightNum: 100,
                relay: true,
            })
            version = new Version().fromBuffer(version.toBuffer())
            ;(version instanceof Version).should.equal(true)
        })
    })

    describe('@fromBuffer', () => {
        it('should convert from buffer', () => {
            let version = Version.fromObject({
                versionBytesNum: 0,
                servicesBuf: Buffer.alloc(8),
                timeBn: new Bn(0),
                addrRecvServicesBuf: Buffer.alloc(8),
                addrRecvIpAddrBuf: Buffer.alloc(16),
                addrRecvPort: 0,
                addrTransServicesBuf: Buffer.alloc(8),
                addrTransIpAddrBuf: Buffer.alloc(16),
                addrTransPort: 0,
                nonceBuf: Buffer.alloc(8),
                userAgentVi: VarInt.fromNumber('test'.length),
                userAgentBuf: Buffer.from('test'),
                startHeightNum: 100,
                relay: true,
            })
            version = Version.fromBuffer(version.toBuffer())
            ;(version instanceof Version).should.equal(true)
        })
    })
})
