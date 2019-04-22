import { createPool, Pool, PoolConnection } from 'mysql'
import Utils, {getTableNameBy, SelectOptions} from './utils'

const printSql = function (sql: string): void {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  console.log(sql)
}

const defaultOptions = {
  host: '127.0.0.1',
  port: 3306,
  user: '',
  password: '',
  database: '',
  connectionLimit: require("os").cpus().length
}

export default class MysqlDao {
  private options = {}
  private pool: Pool
  private connection: PoolConnection

  constructor(options) {
    if (!options) {
      throw new Error('mysql config options is missing')
    }
    // 重写，支持客户端配置参数，而不只是使用默认参数
    Object.assign(this.options, defaultOptions)
    for (let k in options) {
      if (typeof options[k] !== 'undefined') {
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
      throw new Error('database config options is missing')
    }
    if (!this.pool) {
      this.pool = createPool(this.options)
    }
    this.connection = await this.getConnection()
    return this.connection
  }

  public getClient (): Pool {
    return this.pool
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
    }
  }

  public async insert(entity: object) {
    const valueset = entity['toObject'] ? entity['toObject']() : entity
    let template = Utils.generateInsertSql(getTableNameBy(entity), valueset)
    return this.query(template)
  }

  public async update (entity: object, where?: SelectOptions | object) {
    const valueset = entity['toObject'] ? entity['toObject']() : entity
    let template = Utils.generateUpdateSql(getTableNameBy(entity), valueset, where)
    return this.query(template)
  }

  public async delete (entity: Function, where?: SelectOptions | object) {
    let template = Utils.generateDeleteSql(getTableNameBy(entity), where)
    return this.query(template)
  }

  public async select (entity: Function, options?: SelectOptions | object, columns?: string[]) {
    let template = Utils.generateSelectSql(getTableNameBy(entity), options, columns)
    return this.query(template)
  }

  public async query (sql: string, valueset?: any) {
    printSql(sql)
    return new Promise((resolve, reject) => {
      this.getClient().query(sql, valueset || [], function(err, results, fields) {
        if (err) {
          reject(err)
          return
        }
        resolve(results)
      })
    })
  }
}
