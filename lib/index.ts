import { SelectOptions } from './utils'
import MysqlDao from './dao'
import MysqlRepository from './repository'
import { Pool, PoolConnection, escape, escapeId } from 'mysql'


export default MysqlDao

export {
  MysqlRepository,
  SelectOptions,

  escape,
  escapeId,
  Pool,
  PoolConnection
}
