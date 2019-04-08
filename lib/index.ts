import { createPool, Pool, PoolConnection } from "mysql"
import Utils, {SelectOptions} from "./utils"

const defaultOptions = {
  host: "127.0.0.1",
  port: 3306,
  user: "",
  password: "",
  connectionLimit: require("os").cpus().length
}

export default class MysqlDao {
  private options = {}
  private pool: Pool
  private connection: PoolConnection

  constructor(options) {
    if (!options) {
      throw new Error("mysql config options is missing")
    }
    // 重写，支持客户端配置参数，而不只是使用默认参数
    Object.assign(this.options, defaultOptions)
    for (let k in options) {
      if (typeof options[k] !== "undefined") {
        this.options[k] = options[k]
      }
    }
  }

  private getConnection(): Promise<PoolConnection> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection(function(err, conn) {
        if (err) {
          return reject(err)
        }
        if (conn) {
          return resolve(conn)
        }
      })
    })
  }

  public async connect(): Promise<PoolConnection> {
    if (!this.options) {
      throw new Error("database config options is missing")
    }
    if (!this.pool) {
      this.pool = createPool(this.options)
    }
    Utils.pool = this.pool
    this.connection = await this.getConnection()
    return this.connection
  }

  public getClient(): Pool {
    return this.pool
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
    }
  }

  public insert(dbName: string, tbName: string, values: object): Promise<object> {
    let template = Utils.generateInsertSql(dbName, tbName, values)
    return Utils.getSqlExecResultPromise(template)
  }

  public update(dbName: string, tbName: string, valueset: object, where?: object): Promise<object> {
    let template = Utils.generateUpdateSql(dbName, tbName, valueset, where)
    return Utils.getSqlExecResultPromise(template)
  }

  public delete(dbName: string, tbName: string, where?: object) {
    let template = Utils.generateDeleteSql(dbName, tbName, where)
    return Utils.getSqlExecResultPromise(template)
  }

  public select(dbName: string, tbName: string | string[], columns: string[], options?: SelectOptions) {
    let tables: string[]
    if (typeof tbName === 'string') {
      tables = [tbName]
    } else {
      tables = tbName
    }
    let template = Utils.generateSelectSql(dbName, tables, columns, options)
    return Utils.getSqlExecResultPromise(template)
  }
}
