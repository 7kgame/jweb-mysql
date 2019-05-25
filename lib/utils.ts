import { escape, escapeId } from "mysql"
import { getObjectType } from 'jbean'

type WHERE = { $op?: string, [name: string]: any }

interface SelectOptions {
  $where?: WHERE | WHERE[],
  $orderby?: { column: string, $op: string },
  $limit?: { limit: number, start?: number }
}

export { SelectOptions }

export const getTableNameBy = function (entity: any): string {
  if (typeof entity === 'object') {
    entity = entity.constructor
  }
  if (entity['$tableName']) {
    return entity['$tableName']
  } else {
    throw new Error('tableName is not found in ' + entity)
  }
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
          const valInfo = val.split(' ')
          if (valInfo.length > 1) {
            val = valInfo.slice(1).join(' ')
            compareSymbol = valInfo[0]
          }
          conds.push(`${escapeId(key)} ${compareSymbol} ${escape(val)}`)
        }
        sql.push(conds.join(op))
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

  static generateWhereSql (options?: SelectOptions | object): string {
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
      template += `${escapeId(k)} = ${escape(v)},`
    }
    template = template.slice(0, -1)
    // if ($where) {
    //   $where['$op'] = $where['$op'] || 'and'
    //   template = Utils.methods.templateAppendWhere(template, $where)
    // }
    // template += ';'
    return template + this.generateWhereSql($where)
  }

  static generateDeleteSql(tbName: string, $where?: SelectOptions | object): string {
    let template = `DELETE FROM ${escapeId(tbName)}`
    // if ($where) {
    //   $where['$op'] = $where['$op'] || 'and'
    //   template = Utils.methods.templateAppendWhere(template, $where)
    // }
    // template += ';'
    return template + this.generateWhereSql($where)
  }

  static generateSelectSql(tbName: string, options?: SelectOptions | object, columns?: string[]): string {
    let template = `SELECT `
    if (columns) {
      for (let item of columns) {
        template += `${escapeId(item)}, `
      }
      template = template.slice(0, -2)
    } else {
      template += '*'
    }

    template += ` FROM ${escapeId(tbName)}`
    // let hasSpecifiedOptionName = false
    // if (options && options['$where']) {
    //   hasSpecifiedOptionName = true
    //   template = Utils.methods.templateAppendWhere(template, options['$where'])
    // }
    // if (options && options['$orderby']) {
    //   hasSpecifiedOptionName = true
    //   template = Utils.methods.templateAppendOrderBy(template, options['$orderby'])
    //   delete options['$orderby']
    // }
    // if (options && options['$limit']) {
    //   hasSpecifiedOptionName = true
    //   template = Utils.methods.templateAppendLimit(template, options['$limit'])
    //   delete options['$limit']
    // }
    // if (options && !hasSpecifiedOptionName) {
    //   options['$op'] = 'and'
    //   template = Utils.methods.templateAppendWhere(template, options)
    // }
    // template += ';'
    return template + this.generateWhereSql(options)
  }

}
