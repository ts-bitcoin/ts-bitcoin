/**
 * Workers
 * =======
 *
 * Workers manages either processes (in node) or threads (in a browser). The
 * workers are intended to handle CPU-heavy tasks that block IO. This class is
 * a little unusual in that it must use different interfaces whether in node or
 * in the browser. In node, we use node's build-in child_process fork to create
 * new workers we can communicate with. In the browser, we use web workers.
 * Unfortunately, node and web browsers do not have a common interface for
 * workers. There is a node module called webworker-threads for node that
 * mimics the browser's web workers, but unfortunately it does not support
 * require(), and thus isn't very useful in our case. Therefore we fall back to
 * process forks.
 *
 * You probably don't need to use this class directly. Use Work, which will
 * automatically spawn new workers if needed.
 */
import { WorkersResult } from './workers-result'

let globalWorkers: Workers | undefined

export class Workers {
    public nativeWorkers: any[]
    public lastid: number
    public incompconsteRes: any[]
    public promisemap: Map<any, any>

    constructor(nativeWorkers = [], lastid = 0, incompconsteRes = [], promisemap = new Map()) {
        this.nativeWorkers = nativeWorkers
        this.lastid = lastid
        this.incompconsteRes = incompconsteRes
        this.promisemap = promisemap
    }

    public asyncObjectMethod(obj: any, methodname: string, args: any[] = [], id = this.lastid + 1): WorkersResult {
        const result = obj[methodname](...args)
        const workersResult = new WorkersResult().fromResult(result, id)
        return workersResult
    }

    public static async asyncObjectMethod(
        obj: any,
        methodname: string,
        args?: any[],
        id?: number
    ): Promise<WorkersResult> {
        if (!globalWorkers) {
            globalWorkers = new Workers()
        }
        return globalWorkers.asyncObjectMethod(obj, methodname, args, id)
    }

    public asyncClassMethod(classObj: any, methodname: string, args: any[], id = this.lastid + 1): WorkersResult {
        if (!args) {
            throw new Error('must specify args')
        }
        const result = classObj[methodname](...args)
        const workersResult = new WorkersResult().fromResult(result, id)
        return workersResult
    }

    public static async asyncClassMethod(
        classObj: any,
        methodname: string,
        args: any[],
        id?: number
    ): Promise<WorkersResult> {
        if (!globalWorkers) {
            globalWorkers = new Workers()
        }
        return globalWorkers.asyncClassMethod(classObj, methodname, args, id)
    }

    public static endGlobalWorkers(): void {
        if (globalWorkers && !(process as any).browser) {
            globalWorkers = undefined
        }
    }
}
