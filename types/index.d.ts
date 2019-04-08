import { createPool, Pool, PoolConnection } from 'mysql'
import {SelectOptions} from '../lib/utils'
export default interface MysqlDao {
  connect (): Promise<PoolConnection>
  getClient (): Pool
  disconnect (): Promise<void>
  insert (dbName: string,tbName: string, values: object): Promise<object>
  delete (dbName: string, tbName: string, where?: object): Promise<object>
  update (dbName: string, tbName: string, where?: object): Promise<object>
  insert (dbName: string, tbName: string, columns: string[], options?: SelectOptions): Promise<object>
}