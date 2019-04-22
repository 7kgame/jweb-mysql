import { createPool, Pool, PoolConnection } from 'mysql'

export interface SelectOptions {
  where: { _op?: string, [name: string]: any },
  orderby?: { column: string, _op: string },
  limit?: { limit: number, start?: number }
}

export default interface MysqlDao {
  connect (): Promise<PoolConnection>
  getClient (): Pool
  disconnect (): Promise<void>
  insert (entity: object): Promise<any>
  delete (entity: Function, where: SelectOptions | object): Promise<number>
  update (entity: object, where: SelectOptions | object): Promise<number>
  select (entity: Function, where?: SelectOptions | object, columns?: string[]): Promise<any>
  getEntity (entity: Function, where: SelectOptions | object, columns?: string[]): Promise<any>
  query (sql: string, valueset?: object): Promise<any>
}