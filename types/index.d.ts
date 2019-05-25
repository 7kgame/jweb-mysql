import { createPool, Pool, PoolConnection } from 'mysql'

// export interface SelectOptions {
//   $where?: { $op?: string, [name: string]: any },
//   $orderby?: { column: string, $op: string },
//   $limit?: { limit: number, start?: number }
// }

type WHERE = { $op?: string, [name: string]: any }

export interface SelectOptions {
  $where?: WHERE | WHERE[],
  $orderby?: { column: string, $op: string },
  $limit?: { limit: number, start?: number }
}

export default interface MysqlDao {
  connect (): Promise<void>
  getClient (): Pool
  disconnect (): Promise<void>
  insert (entity: object): Promise<any>
  delete (entity: Function, where: SelectOptions | object): Promise<number>
  update (entity: object, where: SelectOptions | object): Promise<number>
  find (entity: Function, where?: SelectOptions | object, columns?: string[], withoutEscapeKey?: boolean, doEntityClone?: boolean): Promise<any>
  findAll (entity: Function, where?: SelectOptions | object, columns?: string[], withoutEscapeKey?: boolean, oneLimit?: boolean, doEntityClone?: boolean): Promise<any>
  selectBy (sql: string, where?: SelectOptions | object, oneLimit?: boolean): Promise<any>
  count (entity: Function, where?: SelectOptions | object): Promise<number>

  select (entity: Function, where?: SelectOptions | object, columns?: string[], withoutEscapeKey?: boolean, oneLimit?: boolean, doEntityClone?: boolean): Promise<any>
  getEntity (entity: Function, where: SelectOptions | object, columns?: string[], withoutEscapeKey?: boolean, doEntityClone?: boolean): Promise<any>
  query (sql: string, valueset?: object, oneLimit?: boolean): Promise<any>
}