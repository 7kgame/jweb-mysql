import { Pool, PoolConnection } from "mysql"

interface SelectOptions {
  where: {op?: string, [name: string]: any},
  orderby?: {column: string, op: string},
  limit?: { limit: number, start?: number}
}

export { SelectOptions }

export default class Utils {
  static pool: Pool | PoolConnection
  static methods = {
    templateAppendWhere(template: string, where: object): string {
      template += " WHERE "
      if (Object.keys(where).length > 1 && where['op'] !== 'and' && where['op'] !== 'or') {
        throw new Error('must specify op with \'and\' or \'or\'')
      }
      for (let  [k, v] of Object.entries(where)) {
        if (k === 'op') {
          continue
        }
        var pos = v.toUpperCase().indexOf('LIKE')
        if (pos !== -1) {
          template += `${Utils.pool.escapeId(k)} LIKE ${Utils.pool.escape(v.slice(pos + 5))}${where['op'] ? " " + where['op'].toUpperCase() + " " : ''}`
        } else {
          template += `${Utils.pool.escapeId(k)}=${Utils.pool.escape(v)}${where['op'] ? " " + where['op'].toUpperCase() + " " : ''}`
        }
      }
      if (where['op'] === 'and') {
        template = template.slice(0, -5)
      } else if (where['op'] === 'or') {
        template = template.slice(0, -4)
      }
      return template
    },
    templateAppendLimit(template: string, { limit, start }: {limit:number, start?:number}): string {
      template += " LIMIT "
      if (start) {
        template += Utils.pool.escape(start) + ","
      }
      template += Utils.pool.escape(limit)
      return template
    },
    templateAppendOrderBy(template: string, { column, op }) {
      template += ' ORDER BY '
      template += `${Utils.pool.escapeId(column)} ${op.toUpperCase()}`
      return template
    }
  }
  static generateInsertSql(
    dbName: string,
    tbName: string,
    values: object
  ): string {
    let template = `INSERT INTO ${Utils.pool.escapeId(dbName)}.${Utils.pool.escapeId(tbName)}(`
    for (let k of Object.keys(values)) {
      template += Utils.pool.escapeId(k) + ","
    }
    template = template.slice(0, -1) + ") VALUES("
    for (let v of Object.values(values)) {
      template += Utils.pool.escape(v) + ","
    }
    template = template.slice(0, -1) + ");"
    return template
  }

  static generateUpdateSql(dbName: string, tbName: string, valueset: object, where?: object): string {
    let template = `UPDATE ${Utils.pool.escapeId(dbName)}.${Utils.pool.escapeId(tbName)} SET `
    for (let  [k, v] of Object.entries(valueset)) {
      template += `${Utils.pool.escapeId(k)}=${Utils.pool.escape(v)},`
    }
    template = template.slice(0, -1)
    if (where) {
      template = Utils.methods.templateAppendWhere(template, where)
    }
    template += ';'
    return template
  }

  static generateDeleteSql(dbName: string, tbName: string, where?: object): string {
    let template = `DELETE FROM ${Utils.pool.escapeId(dbName)}.${Utils.pool.escapeId(tbName)}`
    if (where) {
      template = Utils.methods.templateAppendWhere(template, where, )
    }
    template += ';'
    return template
  }

  static generateSelectSql(dbName: string, tbNames: string[], columns: string[], options?: SelectOptions): string {
    let template = `SELECT `
    for (let item of columns) {
      template += `${Utils.pool.escapeId(item)},`
    }
    template = template.slice(0, -1)
    template += ' FROM '
    for (let item of tbNames) {
      template += `${Utils.pool.escapeId(dbName)}.${Utils.pool.escapeId(item)},`
    }
    template = template.slice(0, -1)
    if (options && options['where']) {
      template = Utils.methods.templateAppendWhere(template, options['where'])
    }
    if (options && options['orderby']) {
      template = Utils.methods.templateAppendOrderBy(template, options['orderby'])
    }
    if (options && options['limit']) {
      template = Utils.methods.templateAppendLimit(template, options['limit'])
    }
    template += ';'
    return template
  }

  static getSqlExecResultPromise(template: string): Promise<object> {
    return new Promise((resolve, reject) => {
      Utils.pool.query(template, function(err, results, fields) {
        if (err) {
          reject(err)
        }
        resolve(results)
      })
    })
  }
}
