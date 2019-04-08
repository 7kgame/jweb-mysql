import { createPool, Pool, PoolConnection } from 'mysql'

export default interface MysqlDao {
  connect (): Promise<PoolConnection>
  getClient (): Pool
  disconnect (): Promise<void>
}
