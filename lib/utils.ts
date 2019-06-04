import { escape, escapeId } from "mysql"
import { getObjectType, BeanFactory, BeanMeta } from 'jbean'

type WHERE = { $op?: string, [name: string]: any }
type ORDER_BY = { column: string, op?: string }
type LIMIT = {limit: number, start?: number}

interface SelectOptions {
  $where?: WHERE | WHERE[],
  $orderBy?: ORDER_BY,
  $limit?: LIMIT
}

export { SelectOptions, ORDER_BY, LIMIT, WHERE }

export const getTableNameBy = function (entity: any, options?: SelectOptions | WHERE | WHERE[] | object, supportMulti?: boolean): string | string[] {
  if (typeof entity === 'object') {
    entity = entity.constructor
  }

  if (typeof entity['getTableNames'] === 'function') {
    const where = [].concat((options && options['$options']) ? options['$where'] : options)
    const whereLen = where.length
    const conditions = {}
    for (let it = 0; it < whereLen; it++) {
      const $whereI = (where[it] && where[it]['toObject']) ? where[it]['toObject']() : where[it]
      if (typeof $whereI !== 'object') {
        continue
      }
      let op = $whereI['$op'] ? $whereI['$op'].toUpperCase() : null
      const keys = Object.keys($whereI)
      const keyLen = keys.length
      for (let itK = 0; itK < keyLen; itK++) {
        const key = keys[itK]
        if (key === '$op') {
          continue
        }
        if (typeof conditions[key] === 'undefined') {
          conditions[key] = []
        }
        let val = $whereI[key]
        if (keyLen === 2 && op) {
          conditions[key].push([op, val])
        } else {
          let compareSymbol = '='
          if (typeof val === 'string') {
            const valInfo = val.split(' ')
            if (valInfo.length > 1) {
              val = valInfo.slice(1).join(' ')
              compareSymbol = valInfo[0]
            }
          }
          conditions[key].push([compareSymbol, val])
        }
      }
    }

    const tblNames = entity['getTableNames'](conditions, supportMulti, entity)
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
      const where = [].concat($where)
      template += " WHERE "
      const sql: string[] = []
      const whereLen = where.length
      for (let it = 0; it < whereLen; it++) {
        const $whereI = (where[it] && where[it]['toObject']) ? where[it]['toObject']() : where[it]
        if (typeof $whereI !== 'object') {
          continue
        }
        let op = $whereI['$op'] ? $whereI['$op'].toUpperCase() : null
        const keys = Object.keys($whereI)
        const keyLen = keys.length
        const conds: string[] = []
        let compareSymbol = op
        for (let itK = 0; itK < keyLen; itK++) {
          const key = keys[itK]
          let val = $whereI[key]
          if (key === '$op') {
            continue
          }
          if (keyLen === 2 && op) {
            if (getObjectType(val) === 'array') {
              const vals = []
              const valLen = val.length
              for (let itV = 0; itV < valLen; itV++) {
                vals.push(escape(val[itV]))
              }
              if (op === 'BETWEEN') {
                val = vals.join(' AND ')
              } else if (op === 'IN') {
                val = '(' + vals.join(', ') + ')'
              } else {
                val = vals.join(', ')
              }
            } else {
              if (val !== null && ['object', 'function'].indexOf(typeof val) >= 0) {
                throw new Error('value type is not simple: ' + JSON.stringify($whereI))
              }
              val = escape(val)
            }
          } else {
            if (val !== null && ['object', 'function'].indexOf(typeof val) >= 0) {
              throw new Error('value type is not simple: ' + JSON.stringify($whereI))
            }
            compareSymbol = '='
            if (typeof val === 'string') {
              const valInfo = val.split(' ')
              if (valInfo.length > 1) {
                val = valInfo.slice(1).join(' ')
                compareSymbol = valInfo[0]
              }
            }
            val = escape(val)
          }
          conds.push(`${escapeId(key)} ${compareSymbol} ${val}`)
        }
        if (conds.length > 0) {
          sql.push(conds.join(op ? (' ' + op + '') : ' AND '))
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

  static generateWhereSql (options?: SelectOptions | object, withLock?: boolean, oneLimit?: boolean): string {
    let template: string = ''
    let where = options || {}
    if (!where['$where'] && !where['$orderBy'] && !where['$limit']) {
      where = {$where: where}
    }
    if (where['$where']) {
      template = Utils.methods.templateAppendWhere(template, where['$where'])
    }
    if (where['$orderBy']) {
      template = Utils.methods.templateAppendOrderBy(template, where['$orderBy'])
    }
    if (where['$limit']) {
      template = Utils.methods.templateAppendLimit(template, where['$limit'])
    } else if (oneLimit) {
      template = Utils.methods.templateAppendLimit(template, {limit: 1})
    }
    if (withLock) {
      template += ' FOR UPDATE'
    }
    template += ';'
    return template
  }

  static generateInsertSql(tbName: string, valueset: object): string {
    valueset = (valueset && valueset['toObject']) ? valueset['toObject']() : valueset
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

  static generateUpdateSql(tbName: string, valueset: object, $where?: SelectOptions | WHERE | WHERE[] | object): string {
    valueset = (valueset && valueset['toObject']) ? valueset['toObject']() : valueset
    let template = `UPDATE ${escapeId(tbName)} SET `
    for (let  [k, v] of Object.entries(valueset)) {
      template += `${escapeId(k)} = ${escape(v)}, `
    }
    template = template.slice(0, -2)
    return template + this.generateWhereSql($where)
  }

  static generateDeleteSql(tbName: string, $where?: SelectOptions | WHERE | WHERE[] | object): string {
    let template = `DELETE FROM ${escapeId(tbName)}`
    return template + this.generateWhereSql($where)
  }

  static generateSelectSql(tbName: string, options?: SelectOptions | WHERE | WHERE[] | object, columns?: string[], withoutEscapeKey?: boolean, withLock?: boolean, oneLimit?: boolean): string {
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
    return template + this.generateWhereSql(options, withLock, oneLimit)
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
