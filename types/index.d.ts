import { createPool, Pool, PoolConnection } from 'mysql';

export default interface MysqlDao {
  connect (): Promise<PoolConnection>;
  getClient (): PoolConnection;
  disconnect (): Promise<void>;
}
