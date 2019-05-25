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
    let template = Utils.generateInsertSql(getTableNameBy(entity), valueset)
    const ret = await this.query(template)
    return ret.insertId
  }

  public async update (entity: object, where: SelectOptions | object) {
    const valueset = entity['toObject'] ? entity['toObject']() : entity
    let template = Utils.generateUpdateSql(getTableNameBy(entity), valueset, where)
    const ret = await this.query(template)
    return ret.affectedRows
  }

  public async delete (entity: Function, where: SelectOptions | object) {
    let template = Utils.generateDeleteSql(getTableNameBy(entity), where)
    const ret = await this.query(template)
    return ret.affectedRows
  }

  public async fetch (entity: Function, where: SelectOptions | object, columns?: string[]) {
    return this.fetchAll(entity, where, columns, true)
    // if (typeof where['where'] === 'undefined') {
    //   where = {
    //     $where: {$op: 'and', ...where},
    //     $limit: {limit: 1}
    //   }
    // }
    // const data = await this.fetchAll(entity, where, columns)
    // // let template = Utils.generateSelectSql(getTableNameBy(entity), where, columns)
    // // const data = await this.query(template)
    // if (!data || data.length < 1) {
    //   return null
    // }
    // if (typeof entity['clone'] === 'function') {
    //   return entity['clone'](data[0])
    // } else {
    //   return JSON.parse(JSON.stringify(data[0]))
    // }
  }

  public async fetchAll (entity: Function, where?: SelectOptions | object, columns?: string[], oneLimit?: boolean) {
    if (oneLimit && typeof where['where'] === 'undefined') {
      where = {
        $where: {$op: 'and', ...where},
        $limit: {limit: 1}
      }
    }
    let template = Utils.generateSelectSql(getTableNameBy(entity), where, columns)
    const data = await this.query(template)
    if (!data) {
      return oneLimit ? null : []
    }
    const ret: any[] = []
    const len = data.length
    for (let i = 0; i < len; i++) {
      if (i > 0 && oneLimit) {
        break
      }
      if (typeof entity['format'] === 'function') {
        ret.push(entity['format'](data[i]))
      } else {
        ret.push(JSON.parse(JSON.stringify(data[i])))
      }
    }
    // data.forEach(item => {
    //   if (typeof entity['clone'] === 'function') {
    //     ret.push(entity['clone'](item))
    //   } else {
    //     ret.push(JSON.parse(JSON.stringify(item)))
    //   }
    // })
    return oneLimit ? ret[0] : ret
  }

  public async select (entity: Function, where?: SelectOptions | object, columns?: string[]) {
    // let template = Utils.generateSelectSql(getTableNameBy(entity), where, columns)
    // const data = await this.query(template)
    // if (!data) {
    //   return []
    // }
    // const ret: any[] = []
    // data.forEach(item => {
    //   if (typeof entity['clone'] === 'function') {
    //     ret.push(entity['clone'](item))
    //   } else {
    //     ret.push(JSON.parse(JSON.stringify(item)))
    //   }
    // })
    // return ret
    return this.fetchAll(entity, where, columns)
  }

  public async getEntity (entity: Function, where: SelectOptions | object, columns?: string[]) {
    // if (typeof where['where'] === 'undefined') {
    //   where = {
    //     $where: {$op: 'and', ...where},
    //     $limit: {limit: 1}
    //   }
    // }
    // let template = Utils.generateSelectSql(getTableNameBy(entity), where, columns)
    // const data = await this.query(template)
    // if (!data || data.length < 1) {
    //   return null
    // }
    // if (typeof entity['clone'] === 'function') {
    //   return entity['clone'](data[0])
    // } else {
    //   return JSON.parse(JSON.stringify(data[0]))
    // }
    return this.fetchAll(entity, where, columns, true)
  }

  // findById
  // count
  // fetch
  // fetchAll
  // updateById
  /**
   * Pageable {
      getPageNumber
      getPageSize
      getOffset
      getSort
      data
    }
   */

  public async query (sql: string, valueset?: any): Promise<any> {
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