import { createPool, Pool, PoolConnection } from 'mysql'
import { Page } from 'jbean'

export type WHERE = { $op?: string, [name: string]: any }
export type ORDER_BY = { column: string, op?: string }
export type LIMIT = {limit: number, start?: number}
export type UPDATE_RESULT = {affected: number, changed: number}

export interface SelectOptions {
  $where?: WHERE | WHERE[],
  $orderBy?: ORDER_BY,
  $limit?: LIMIT
}

export default interface MysqlDao {
  connect (): Promise<void>
  isMaster (): boolean
  getClient (): Promise<Pool | PoolConnection>
  disconnect (): Promise<void>
  insert (entity: object, requestId?: number): Promise<any>
  delete (entity: Function, where: SelectOptions | WHERE | WHERE[] | object, requestId?: number): Promise<UPDATE_RESULT>
  update (entity: object, where: SelectOptions | WHERE | WHERE[] | object, requestId?: number): Promise<UPDATE_RESULT>
  find (entity: Function, where?: SelectOptions | WHERE | WHERE[] | object, columns?: string[], withoutEscapeKey?: boolean, withLock?: boolean, withoutEntityClone?: boolean, requestId?: number): Promise<any>
  findAll (entity: Function, where?: SelectOptions | WHERE | WHERE[] | object, columns?: string[], withoutEscapeKey?: boolean, withLock?: boolean, oneLimit?: boolean, withoutEntityClone?: boolean, requestId?: number): Promise<any[]>
  count (entity: Function, where?: SelectOptions | WHERE | WHERE[] | object, requestId?: number): Promise<number>
  findById (entity: Function, id: any, columns?: string[], withLock?: boolean, withoutEntityClone?: boolean, requestId?: number): Promise<any>
  updateById (entity: object, id: any, requestId?: number): Promise<UPDATE_RESULT>
  deleteById (entity: Function, id: any, requestId?: number): Promise<UPDATE_RESULT>
  selectBy (sql: string, where?: SelectOptions | WHERE | WHERE[] | object, withLock?: boolean, oneLimit?: boolean, requestId?: number): Promise<any[]>
  searchByPage<T> (entity: Function, where: WHERE | WHERE[] | object, page: number, pageSize: number, orderBy?: ORDER_BY, columns?: string[], withoutEntityClone?: boolean, requestId?: number): Promise<Page<T>>
  query (sql: string, valueset?: object, oneLimit?: boolean, requestId?: number): Promise<any>
}

export function commitTransaction(requestId: number): Promise<any>
export function rollbackTransaction(requestId: number): Promise<any>
export function releaseConnection (requestId: number): void
