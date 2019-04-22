import { createPool, Pool, PoolConnection } from 'mysql'
import { SelectOptions } from '../lib/utils'

export default interface MysqlDao {
  connect (): Promise<PoolConnection>
  getClient (): Pool
  disconnect (): Promise<void>
  insert (entity: object): Promise<any>
  delete (entity: Function, where?: SelectOptions | object): Promise<any>
  update (entity: object, where?: SelectOptions | object): Promise<any>
  select (entity: Function, options?: SelectOptions | object, columns?: string[]): Promise<any>
  query (sql: string, valueset?: object): Promise<any>
}