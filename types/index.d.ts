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
  fetch (entity: Function, where?: SelectOptions | object, columns?: string[]): Promise<any>
  fetchAll (entity: Function, where: SelectOptions | object, columns?: string[]): Promise<any>
  select (entity: Function, where?: SelectOptions | object, columns?: string[]): Promise<any>
  getEntity (entity: Function, where: SelectOptions | object, columns?: string[]): Promise<any>
  query (sql: string, valueset?: object): Promise<any>
}