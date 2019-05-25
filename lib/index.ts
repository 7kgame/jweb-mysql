import { createPool, Pool, PoolConnection } from 'mysql'
import Utils, {getTableNameBy, SelectOptions} from './utils'

const printSql = function (sql: string): void {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  console.log(sql)
}

type Page = {total: number, list: any[]}

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
    Object.assign(this.options, defaultOptions)
    for (let k in options) {
      if (typeof this.options[k] !== 'undefined') {
        this.options[k] = options[k]
      }
    }
  }

  public async connect(): Promise<void> {
    if (!this.options) {
      throw new Error('database config options is missing')
    }
    if (!this.pool) {
      this.pool = await createPool(this.options)
    }
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
    let sql = Utils.generateInsertSql(getTableNameBy(entity), valueset)
    const ret = await this.query(sql)
    return ret.insertId
  }

  public async update (entity: object, where: SelectOptions | object) {
    const valueset = entity['toObject'] ? entity['toObject']() : entity
    let sql = Utils.generateUpdateSql(getTableNameBy(entity, where), valueset, where)
    const ret = await this.query(sql)
    return ret.affectedRows
  }

  public async delete (entity: Function, where: SelectOptions | object) {
    let sql = Utils.generateDeleteSql(getTableNameBy(entity, where), where)
    const ret = await this.query(sql)
    return ret.affectedRows
  }

  public async find (entity: Function, where: SelectOptions | object, columns?: string[], withoutEscapeKey?: boolean, doEntityClone?: boolean) {
    return this.findAll(entity, where, columns, withoutEscapeKey, true, doEntityClone)
  }

  public async findAll (entity: Function, where?: SelectOptions | object, columns?: string[], withoutEscapeKey?: boolean, oneLimit?: boolean, doEntityClone?: boolean) {
    if (oneLimit && where && typeof where['where'] === 'undefined') {
      where = {
        $where: {$op: 'and', ...where},
        $limit: {limit: 1}
      }
    }
    let sql = Utils.generateSelectSql(getTableNameBy(entity, where), where, columns, withoutEscapeKey)
    const data = await this.query(sql)
    if (!data || data.length < 1) {
      return oneLimit ? null : []
    }
    const ret: any[] = []
    const dataLen = data.length
    const keys = Object.getOwnPropertyNames(data[0])
    const keyLen = keys.length
    doEntityClone = doEntityClone && typeof entity['clone'] === 'function'

    for (let i = 0; i < dataLen; i++) {
      if (i > 0 && oneLimit) {
        break
      }
      if (doEntityClone) {
        ret.push(entity['clone'](data[i]))
      } else {
        const item = {}
        for (let j = 0; j < keyLen; j++) {
          item[keys[j]] = data[i][keys[j]]
        }
        ret.push(item)
      }
    }
    return oneLimit ? ret[0] : ret
  }

  public async findById (entity: Function, id: any, columns?: string[], doEntityClone?: boolean) {
    return this.find(entity, Utils.makeWhereByPK(entity, id), columns, false, doEntityClone)
  }

  public async updateById (entity: object, id: any) {
    return this.update(entity, Utils.makeWhereByPK(entity, id))
  }

  public async count (entity: Function, where?: SelectOptions | object): Promise<number> {
    if (where) {
      delete where['$limit']
      delete where['$orderBy']
    }
    const data = await this.findAll(entity, where, ['count(*) as count'], true)
    return (data && data[0].count) ? data[0].count : 0
  }

  public async selectBy (sql: string, where?: SelectOptions | object, oneLimit?: boolean) {
    sql += Utils.generateWhereSql(where)
    return this.query(sql, null, oneLimit)
  }

  public async searchByPage (entity: Function, where: SelectOptions | object, columns?: string[], doEntityClone?: boolean): Promise<Page> {
    const ret: Page = {total: 0, list: null}
    ret.list = await this.findAll(entity, where, columns, false, false, doEntityClone)
    ret.total = await this.count(entity, where)
    return ret
  }

  public async query (sql: string, valueset?: any, oneLimit?: boolean): Promise<any> {
    printSql(sql)
    return new Promise((resolve, reject) => {
      this.getClient().query(sql, valueset || [], function(err, results, fields) {
        if (err) {
          reject(err)
          return
        }
        if (oneLimit) {
          results = results ? results[0] : null
        }
        resolve(results)
      })
    })
  }

}