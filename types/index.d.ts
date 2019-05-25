import { createPool, Pool, PoolConnection } from 'mysql'

type WHERE = { $op?: string, [name: string]: any }

export interface SelectOptions {
  $where?: WHERE | WHERE[],
  $orderby?: { column: string, op: string },
  $limit?: { limit: number, start?: number }
}

export interface Page {
  total: number,
  list: any[]
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
  count (entity: Function, where?: SelectOptions | object): Promise<number>
  findById (entity: Function, id: any, columns?: string[], doEntityClone?: boolean): Promise<any>
  updateById (entity: object, id: any): Promise<number>
  selectBy (sql: string, where?: SelectOptions | object, oneLimit?: boolean): Promise<any>
  searchByPage (entity: Function, where: SelectOptions | object, columns?: string[], doEntityClone?: boolean): Promise<Page>
  query (sql: string, valueset?: object, oneLimit?: boolean): Promise<any>

  select (entity: Function, where?: SelectOptions | object, columns?: string[], withoutEscapeKey?: boolean, oneLimit?: boolean, doEntityClone?: boolean): Promise<any>
  getEntity (entity: Function, where: SelectOptions | object, columns?: string[], withoutEscapeKey?: boolean, doEntityClone?: boolean): Promise<any>

}