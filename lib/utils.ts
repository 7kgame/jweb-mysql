import { escape, escapeId } from "mysql"
import { getObjectType, BeanFactory, BeanMeta } from 'jbean'

type WHERE = { $op?: string, [name: string]: any }
type ORDER_BY = { column: string, op?: string }
type LIMIT = {limit: number, start?: number}

interface SelectOptions {
  $where?: WHERE | WHERE[],
  $orderby?: ORDER_BY,
  $limit?: LIMIT
}

export { SelectOptions, ORDER_BY, LIMIT, WHERE }

export const getTableNameBy = function (entity: any, where?: SelectOptions | object, supportMulti?: boolean): string | string[] {
  if (typeof entity === 'object') {
    entity = entity.constructor
  }

  if (typeof entity['getTableNames'] === 'function') {
    let conditions = {}
    if (where && where['$where']) {
      conditions = where['$where']
    } else if (where) {
      conditions = where
    }
    const keys = Object.keys(conditions)
    const keyLen = keys.length
    const conditions2 = {}
    for (let i = 0; i < keyLen; i++) {
      const key = keys[i]
      if (key === '$where' || key === '$orderBy' || key === '$limit') {
        continue
      }
      let val = conditions[keys[i]]
      let compareSymbol = '='
      if (typeof val === 'string') {
        const valInfo = val.split(' ')
        if (valInfo.length > 1) {
          val = valInfo.slice(1).join(' ')
          compareSymbol = valInfo[0]
        }
      }
      conditions2[key] = [val, compareSymbol]
    }

    const tblNames = entity['getTableNames'](conditions2, !!supportMulti, entity)
    if (tblNames && tblNames.length > 0) {
      return tblNames
    }
  }

  if (!entity['$tableName']) {
    throw new Error('tableName is not found in ' + entity)
  }
  return entity['$tableName']
}

export default class Utils {
  static methods = {
    templateAppendWhere(template: string, $where: any): string {
      template += " WHERE "
      if (getObjectType($where) !== 'array') {
        $where = [$where]
      }
      const sql: string[] = []
      const whereLen = $where.length
      for (let it = 0; it < whereLen; it++) {
        const $whereI = $where[it]
        if (typeof $whereI !== 'object') {
          continue
        }
        let op = ' AND '
        if ($whereI['$op']) {
          op = ' ' + $whereI['$op'].toUpperCase() + ' '
        }
        const keys = Object.keys($whereI)
        const keyLen = keys.length
        const conds: string[] = []
        for (let itK = 0; itK < keyLen; itK++) {
          const key = keys[itK]
          let compareSymbol = '='
          let val = $whereI[key]
          if (key === '$op') {
            continue
          }
          if (typeof val === 'string') {
            const valInfo = val.split(' ')
            if (valInfo.length > 1) {
              val = valInfo.slice(1).join(' ')
              compareSymbol = valInfo[0]
            }
          }
          conds.push(`${escapeId(key)} ${compareSymbol} ${escape(val)}`)
        }
        if (conds.length > 0) {
          sql.push(conds.join(op))
        }
      }
      if (sql.length < 1) {
        return ''
      } else if (sql.length === 1) {
        return template + sql.join(') AND (')
      } else {
        return template + '(' + sql.join(') AND (') + ')'
      }
    },

    templateAppendLimit(template: string, { limit, start }: {limit:number, start?:number}): string {
      template += " LIMIT "
      if (start) {
        template += escape(start) + ", "
      }
      template += escape(limit)
      return template
    },

    templateAppendOrderBy(template: string, { column, op }) {
      template += ' ORDER BY '
      if (!op) {
        op = 'asc'
      }
      template += `${escapeId(column)} ${op.toUpperCase()}`
      return template
    }
  }

  static generateWhereSql (options?: SelectOptions | object, withLock?: boolean): string {
    let template: string = ''
    let hasSpecifiedOptionName = false
    if (options && options['$where']) {
      hasSpecifiedOptionName = true
      template = Utils.methods.templateAppendWhere(template, options['$where'])
    }
    if (options && options['$orderby']) {
      hasSpecifiedOptionName = true
      template = Utils.methods.templateAppendOrderBy(template, options['$orderby'])
      delete options['$orderby']
    }
    if (options && options['$limit']) {
      hasSpecifiedOptionName = true
      template = Utils.methods.templateAppendLimit(template, options['$limit'])
      delete options['$limit']
    }
    if (options && !hasSpecifiedOptionName) {
      options['$op'] = 'and'
      template = Utils.methods.templateAppendWhere(template, options)
    }
    if (withLock) {
      template += ' FOR UPDATE'
    }
    template += ';'
    return template
  }

  static generateInsertSql(tbName: string, valueset: object): string {
    let template = `INSERT INTO ${escapeId(tbName)}(`
    for (let k of Object.keys(valueset)) {
      template += escapeId(k) + ", "
    }
    template = template.slice(0, -2) + ") VALUES ("
    for (let v of Object.values(valueset)) {
      template += escape(v) + ", "
    }
    template = template.slice(0, -2) + ");"
    return template
  }

  static generateUpdateSql(tbName: string, valueset: object, $where?: SelectOptions | object): string {
    let template = `UPDATE ${escapeId(tbName)} SET `
    for (let  [k, v] of Object.entries(valueset)) {
      template += `${escapeId(k)} = ${escape(v)}, `
    }
    template = template.slice(0, -2)
    return template + this.generateWhereSql($where)
  }

  static generateDeleteSql(tbName: string, $where?: SelectOptions | object): string {
    let template = `DELETE FROM ${escapeId(tbName)}`
    return template + this.generateWhereSql($where)
  }

  static generateSelectSql(tbName: string, options?: SelectOptions | object, columns?: string[], withoutEscapeKey?: boolean, withLock?: boolean): string {
    let template = `SELECT `
    if (columns && columns.length > 0) {
      for (let item of columns) {
        template += withoutEscapeKey ? item : `${escapeId(item)}`
        template += ', '
      }
      template = template.slice(0, -2)
    } else {
      template += '*'
    }

    template += ` FROM ${escapeId(tbName)}`
    return template + this.generateWhereSql(options, withLock)
  }

  static makeWhereByPK (entity: Function | object, id: any) {
    let ctor: Function
    if (typeof entity === 'object') {
      ctor = entity.constructor
    } else {
      ctor = entity
    }
    const meta: BeanMeta = BeanFactory.getBeanMeta(ctor)
    if (!meta || !meta.id) {
      throw new Error('primary key is not exist in ' + ctor.name)
    }
    const where = {}
    where[meta.id] = id
    return where
  }

}
