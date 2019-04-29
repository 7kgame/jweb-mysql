import { escape, escapeId } from "mysql"

interface SelectOptions {
  where: { $op?: string, [name: string]: any },
  orderby?: { column: string, $op: string },
  limit?: { limit: number, start?: number }
}

export { SelectOptions }

export const getTableNameBy = function (entity: any): string {
  if (typeof entity === 'object') {
    entity = entity.constructor
  }
  if (entity['$tableName']) {
    // console.log('utils.js line 16' + entity['$tableName'])
    return entity['$tableName']
  } else {
    throw new Error('tableName is not found in ' + entity)
  }
}

export default class Utils {
  static methods = {
    templateAppendWhere(template: string, where: object): string {
      template += " WHERE "
      if (Object.keys(where).length > 1 && where['$op'] !== 'and' && where['$op'] !== 'or') {
        throw new Error('must specify $op with \'and\' or \'or\'')
      }
      for (let  [k, v] of Object.entries(where)) {
        if (k === '$op') {
          continue
        }
        var pos = (typeof v === 'string') ? v.toUpperCase().indexOf('LIKE') : -1
        if (pos !== -1) {
          template += `${escapeId(k)} LIKE ${escape(v.slice(pos + 5))}${where['$op'] ? " " + where['$op'].toUpperCase() + " " : ''}`
        } else {
          template += `${escapeId(k)}=${escape(v)}${where['$op'] ? " " + where['$op'].toUpperCase() + " " : ''}`
        }
      }
      if (where['$op'] === 'and') {
        template = template.slice(0, -5)
      } else if (where['$op'] === 'or') {
        template = template.slice(0, -4)
      }
      return template
    },
    templateAppendLimit(template: string, { limit, start }: {limit:number, start?:number}): string {
      template += " LIMIT "
      if (start) {
        template += escape(start) + ","
      }
      template += escape(limit)
      return template
    },
    templateAppendOrderBy(template: string, { column, $op }) {
      template += ' ORDER BY '
      template += `${escapeId(column)} ${$op.toUpperCase()}`
      return template
    }
  }

  static generateInsertSql(tbName: string, valueset: object): string {
    let template = `INSERT INTO ${escapeId(tbName)}(`
    for (let k of Object.keys(valueset)) {
      template += escapeId(k) + ","
    }
    template = template.slice(0, -1) + ") VALUES("
    for (let v of Object.values(valueset)) {
      template += escape(v) + ","
    }
    template = template.slice(0, -1) + ");"
    return template
  }

  static generateUpdateSql(tbName: string, valueset: object, where?: SelectOptions | object): string {
    let template = `UPDATE ${escapeId(tbName)} SET `
    for (let  [k, v] of Object.entries(valueset)) {
      template += `${escapeId(k)}=${escape(v)},`
    }
    template = template.slice(0, -1)
    if (where) {
      where['$op'] = where['$op'] || 'and'
      template = Utils.methods.templateAppendWhere(template, where)
    }
    template += ';'
    return template
  }

  static generateDeleteSql(tbName: string, where?: SelectOptions | object): string {
    let template = `DELETE FROM ${escapeId(tbName)}`
    if (where) {
      where['$op'] = where['$op'] || 'and'
      template = Utils.methods.templateAppendWhere(template, where)
    }
    template += ';'
    return template
  }

  static generateSelectSql(tbName: string, options?: SelectOptions | object, columns?: string[]): string {
    let template = `SELECT `
    columns = columns || ['*']
    for (let item of columns) {
      template += `${escapeId(item)},`
    }

    template = template.slice(0, -1)
    template += ` FROM ${escapeId(tbName)}`
    if (options && options['where']) {
      template = Utils.methods.templateAppendWhere(template, options['where'])
    }
    if (options && options['orderby']) {
      template = Utils.methods.templateAppendOrderBy(template, options['orderby'])
      delete options['orderby']
    }
    if (options && options['limit']) {
      template = Utils.methods.templateAppendLimit(template, options['limit'])
      delete options['limit']
    }
    if (options && typeof options['where'] === 'undefined') {
      options['$op'] = 'and'
      template = Utils.methods.templateAppendWhere(template, options)
    }
    template += ';'
    return template
  }

}
