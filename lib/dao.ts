import { createPool, Pool, PoolConnection, MysqlError} from 'mysql'
import Utils, { getTableNameBy, SelectOptions, ORDER_BY, WHERE } from './utils'
import { getObjectType, Page, registerBegin, registerCommit, registerRollback } from 'jbean'

export type UPDATE_RESULT = {affected: number, changed: number}

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
  connectionLimit: 20,
  connectTimeout: 10000,
  waitForConnections: true,
  charset: 'UTF8_GENERAL_CI',
  supportBigNumbers: true,
  bigNumberStrings: false,
  dateStrings: false
}

const makeSimplePromise = function (data, err?): Promise<any> {
  return new Promise(function (res, rej) {
    if (err) {
      rej(err)
    } else {
      res(data)
    }
  })
}

const connectionPool = {}

export function commitTransaction(requestId: number): Promise<any> {
  return new Promise(function (res, rej) {
    const rKey = 'r_' + requestId
    if (typeof connectionPool[rKey] === 'undefined') {
      res(null)
      return
    }
    const connection: PoolConnection = connectionPool[rKey][0]
    const pool: Pool = connectionPool[rKey][1]
    delete connectionPool[rKey]
    connection.commit(function (err: MysqlError) {
      // connection.release()
      pool.releaseConnection(connection)
      if (err) {
        rej(err)
      } else {
        res(null)
      }
    })
  })
}

export function rollbackTransaction(requestId: number): Promise<any> {
  return new Promise(function (res, rej) {
    const rKey = 'r_' + requestId
    if (typeof connectionPool[rKey] === 'undefined') {
      res(null)
      return
    }
    // const connection: PoolConnection = connectionPool[rKey]
    const connection: PoolConnection = connectionPool[rKey][0]
    const pool: Pool = connectionPool[rKey][1]
    delete connectionPool[rKey]
    connection.rollback(function (err: MysqlError) {
      // connection.release()
      pool.releaseConnection(connection)
      if (err) {
        rej(err)
      } else {
        res(null)
      }
    })
  })
}

export function releaseConnection (requestId: number): void {
  const rKey = 'r_' + requestId
  if (typeof connectionPool[rKey] === 'undefined') {
    return
  }
  // const connection: PoolConnection = connectionPool[rKey]
  const connection: PoolConnection = connectionPool[rKey][0]
  const pool: Pool = connectionPool[rKey][1]
  pool.releaseConnection(connection)
  // connection.release()
  delete connectionPool[rKey]
}

registerCommit(function (requestId: number) {
  return commitTransaction(requestId)
})

registerRollback(function (requestId: number) {
  return rollbackTransaction(requestId)
})

export default class MysqlDao {
  private options = {}
  private pool: Pool
  private master: boolean = false

  constructor(options) {
    if (!options) {
      throw new Error('mysql config options is missing')
    }
    this.master = !!options.master
    Object.assign(this.options, defaultOptions)
    for (let k in options) {
      if (typeof this.options[k] !== 'undefined') {
        this.options[k] = options[k]
      }
    }
  }

  public isMaster (): boolean {
    return this.master
  }

  public async connect(): Promise<void> {
    if (!this.options) {
      throw new Error('database config options is missing')
    }
    if (!this.pool) {
      this.pool = await createPool(this.options)
    }
  }

  public getClient (requestId?: number): Promise<Pool | PoolConnection> {
    return new Promise((res, rej) => {
      if (!requestId) {
        res(this.pool)
      } else {
        const rKey = 'r_' + requestId
        if (typeof connectionPool[rKey] !== 'undefined') {
          res(connectionPool[rKey][0])
        } else {
          const pool = this.pool
          pool.getConnection(function (err: MysqlError, connection: PoolConnection) {
            if (err) {
              rej(err)
            } else {
              connection.beginTransaction(function (err: MysqlError) {
                if (err) {
                  connection.release()
                  rej(err)
                } else {
                  connectionPool[rKey] = [connection, pool]
                  res(connection)
                }
              })
            }
          })
        }
      }
    })
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
    }
  }

  public insert(entity: object, requestId?: number): Promise<any> {
    const tableNames: any = getTableNameBy(entity)
    if (getObjectType(tableNames) === 'array' && tableNames.length > 1) {
      throw new Error('multi table name exist in insert case: ' + tableNames)
    }
    let sql = Utils.generateInsertSql(tableNames, entity)
    return new Promise((res, rej) => {
      this.query(sql, null, false, requestId).then(function (ret) {
        res(ret.insertId || ret.affectedRows)
      }, function (e) {
        rej(e)
      })
    })
  }

  public update (entity: object, where: SelectOptions | WHERE | WHERE[] | object, requestId?: number): Promise<UPDATE_RESULT> {
    const tableNames: any = getTableNameBy(entity, where)
    if (getObjectType(tableNames) === 'array' && tableNames.length > 1) {
      throw new Error('multi table name exist in update case: ' + tableNames)
    }
    let sql = Utils.generateUpdateSql(tableNames, entity, where)
    return new Promise((res, rej) => {
      this.query(sql, null, false, requestId).then(function (ret) {
        res({
          changed: ret.changedRows,
          affected: ret.affectedRows
        })
      }, function (e) {
        rej(e)
      })
    })
  }

  public delete (entity: Function, where: SelectOptions | WHERE | WHERE[] | object, requestId?: number): Promise<UPDATE_RESULT> {
    const tableNames: any = getTableNameBy(entity, where)
    if (getObjectType(tableNames) === 'array' && tableNames.length > 1) {
      throw new Error('multi table name exist in delete case: ' + tableNames)
    }
    let sql = Utils.generateDeleteSql(tableNames, where)
    return new Promise((res, rej) => {
      this.query(sql, null, false, requestId).then(function (ret) {
        res({
          changed: ret.changedRows,
          affected: ret.affectedRows
        })
      }, function (e) {
        rej(e)
      })
    })
  }

  public find (entity: Function, where: SelectOptions | WHERE | WHERE[] | object, columns?: string[], withoutEscapeKey?: boolean, withLock?: boolean, withoutEntityClone?: boolean, requestId?: number): Promise<any> {
    return this.findAll(entity, where, columns, withoutEscapeKey, withLock, true, withoutEntityClone, null, requestId)
  }

  public async findAll (entity: Function, where?: SelectOptions | WHERE | WHERE[] | object, columns?: string[], withoutEscapeKey?: boolean, withLock?: boolean, oneLimit?: boolean, withoutEntityClone?: boolean, tableNames?: any, requestId?: number): Promise<any[]> {
    if (!tableNames) {
      tableNames = getTableNameBy(entity, where, !oneLimit)
    }
    let tableNamesLen = 0
    if (getObjectType(tableNames) === 'array') {
      tableNamesLen = tableNames.length
    } else {
      tableNames = [tableNames]
      tableNamesLen = 1
    }
    if (oneLimit && tableNamesLen > 1) {
      throw new Error('multi table name exist in findOne case: ' + tableNames)
    }

    withoutEntityClone = withoutEntityClone || typeof entity['clone'] !== 'function'

    let ret: any[] = []
    for (let i = 0; i < tableNamesLen; i++) {
      let ret0 = await this._doFind(entity, tableNames[i], where, columns, withoutEscapeKey, withLock, oneLimit, withoutEntityClone, requestId)
      if (oneLimit && ret0 && ret0.length > 0) {
        return ret0[0]
      }
      ret = ret.concat(ret0)
    }
    if (oneLimit) {
      if (ret.length === 0) {
        return null
      } else if (ret.length === 1) {
        return ret[0]
      }
    }
    return ret
  }

  private _doFind (entity: Function, tableName: string, where: SelectOptions | object, columns: string[], withoutEscapeKey: boolean, withLock: boolean, oneLimit: boolean, withoutEntityClone: boolean, requestId?: number): Promise<any[] | null> {
    let sql = Utils.generateSelectSql(tableName, where, columns, withoutEscapeKey, withLock, oneLimit)
    return new Promise((res, rej) => {
      this.query(sql, null, false, requestId).then(function (data) {
        if (!data || data.length < 1) {
          res(oneLimit ? null : [])
          return
        }
        const ret: any[] = []
        const dataLen = data.length
        const keys = Object.getOwnPropertyNames(data[0])
        const keyLen = keys.length
        for (let i = 0; i < dataLen; i++) {
          if (i > 0 && oneLimit) {
            break
          }
          if (!withoutEntityClone) {
            ret.push(entity['clone'](data[i]))
          } else {
            const item = {}
            for (let j = 0; j < keyLen; j++) {
              item[keys[j]] = data[i][keys[j]]
            }
            ret.push(item)
          }
        }
        res(ret)
      }, function (e) {
        rej(e)
      })
    })
  }

  public findById (entity: Function, id: any, columns?: string[], withLock?: boolean, withoutEntityClone?: boolean, requestId?: number): Promise<any> {
    if (id === undefined) {
      return makeSimplePromise(null)
    }
    return this.find(entity, Utils.makeWhereByPK(entity, id), columns, false, withLock, withoutEntityClone, requestId)
  }

  public updateById (entity: object, id: any, requestId?: number): Promise<UPDATE_RESULT> {
    if (id === undefined) {
      return makeSimplePromise(0)
    }
    return this.update(entity, Utils.makeWhereByPK(entity, id), requestId)
  }

  public deleteById (entity: Function, id: any, requestId?: number): Promise<UPDATE_RESULT> {
    if (id === undefined) {
      return makeSimplePromise(0)
    }
    return this.delete(entity, Utils.makeWhereByPK(entity, id), requestId)
  }

  public count (entity: Function, where?: SelectOptions | WHERE | WHERE[] | object, tableNames?: any, requestId?: number): Promise<number> {
    where = (where && where['$where']) ? where['$where'] : where
    return new Promise((res, rej) => {
      this.findAll(entity, where, ['count(*) as count'], true, false, false, true, tableNames, requestId).then(function(data) {
        const dataLen = data.length
        let count = 0
        for (let i = 0; i < dataLen; i++) {
          let c = (+data[i].count)
          c && (count += c)
        }
        res(count)
      }, function (e) {
        rej(e)
      })
    })
  }

  public selectBy (sql: string, where?: SelectOptions | WHERE | WHERE[] | object, withLock?: boolean, oneLimit?: boolean, requestId?: number): Promise<any[]> {
    sql += Utils.generateWhereSql(where, withLock)
    return this.query(sql, null, oneLimit, requestId)
  }

  public async searchByPage<T> (entity: Function, where: WHERE | WHERE[] | object, page: number, pageSize: number, orderBy?: ORDER_BY, columns?: string[], withoutEntityClone?: boolean, requestId?: number): Promise<Page<T>> {
    const ret: Page<T> = {total: 0, list: null}
    pageSize = pageSize - 0
    if (pageSize < 1) {
      return ret
    }
    page = page - 1
    if (!page || page < 1) {
      page = 1
    }

    const limit = pageSize - 0
    const start = (page - 1) * pageSize

    const searchWhere: any = {
      $where: (where && where['$where']) ? where['$where'] : where
    }

    if (orderBy) {
      searchWhere.$orderBy = orderBy
    }
    searchWhere.$limit = {
      limit: limit,
      start: start
    }

    let tableNames = getTableNameBy(entity, where, true)
    tableNames = [].concat(tableNames)

    const tblLen = tableNames.length
    let data: any[] = []
    let count = 0
    for (let i = 0; i < tblLen; i++) {
      if (data.length < limit && searchWhere['$limit'].limit > 0) {
        let d0 = await this.findAll(entity, searchWhere, columns, false, false, false, withoutEntityClone, tableNames[i], requestId)
        data = data.concat(d0)
      }
      let c0 = await this.count(entity, where, tableNames[i], requestId)
      count += c0
      searchWhere['$limit'].limit = limit - data.length
      searchWhere['$limit'].start = start - count
      if (searchWhere['$limit'].start < 0) {
        searchWhere['$limit'].start = 0
      }
    }
    ret.list = data
    ret.total = count
    if (limit > 0 && ret.list.length > limit) {
      ret.list = ret.list.slice(0, limit)
    }
    return ret
  }

  public query (sql: string, valueset?: any, oneLimit?: boolean, requestId?: number): Promise<any> {
    printSql(sql)
    return new Promise((resolve, reject) => {
      this.getClient(requestId).then((connection: Pool | PoolConnection) => {
        connection.query(sql, valueset || [], function(err, results, fields) {
          if (err) {
            reject(err)
            return
          }
          if (oneLimit) {
            results = results ? results[0] : null
          }
          resolve(results)
        })
      }).catch(err => {
        reject(err)
      })
    })
  }

}

MysqlDao['singleton'] = true