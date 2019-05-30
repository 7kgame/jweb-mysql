import MysqlDao, { ORDER_BY, SelectOptions, WHERE, UPDATE_RESULT} from './dao'
import { Page } from 'jbean'

export default class MysqlRepository<T> {

  protected entityClz: Function

  constructor (entity: Function)

  getDao(master?: boolean): MysqlDao

  insert (entity: T): Promise<number>
  update (entity: T): Promise<UPDATE_RESULT>
  delete (entity: T): Promise<UPDATE_RESULT>
  updateBy (entity: T, where: SelectOptions | object): Promise<UPDATE_RESULT>
  deleteBy (where: SelectOptions | object): Promise<UPDATE_RESULT>
  updateById (entity: object, id: any): Promise<UPDATE_RESULT>
  deleteById (id: any): Promise<UPDATE_RESULT>
  find (where: SelectOptions | object | T, columns?: string[], withLock?: boolean, withoutEntityClone?: boolean): Promise<T>
  findAll (where: SelectOptions | object | T, columns?: string[], withLock?: boolean, oneLimit?: boolean, withoutEntityClone?: boolean): Promise<T[]>
  findById (id: any, columns?: string[], withLock?: boolean, withoutEntityClone?: boolean): Promise<T>
  searchBy (sql: string, where?: SelectOptions | object | T, withLock?: boolean, oneLimit?: boolean): Promise<T[]>
  searchByPage<T> (where: WHERE | WHERE[] | object | T, page: number, pageSize: number, orderBy?: ORDER_BY, columns?: string[], withoutEntityClone?: boolean): Promise<Page<T>>
  count (where?: SelectOptions | object | T): Promise<number>
  query (sql: string, valueset?: any, master?: boolean, oneLimit?: boolean): Promise<any>

}