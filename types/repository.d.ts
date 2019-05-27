import MysqlDao, { ORDER_BY, SelectOptions } from './dao'
import { Page } from 'jbean'

export default class MysqlRepository<T> {

  protected entityClz: Function

  constructor (entity: Function)

  getDao(master?: boolean): MysqlDao

  insert (entity: T): Promise<number>
  update (entity: T): Promise<number>
  delete (entity: T): Promise<number>
  updateBy (entity: T, where: SelectOptions | object): Promise<number>
  deleteBy (where: SelectOptions | object): Promise<number>
  updateById (entity: object, id: any): Promise<number>
  deleteById (id: any): Promise<number>
  find (where: SelectOptions | object | T, columns?: string[], withLock?: boolean, doEntityClone?: boolean): Promise<T>
  findAll (where: SelectOptions | object | T, columns?: string[], withLock?: boolean, oneLimit?: boolean, doEntityClone?: boolean): Promise<T[]>
  findById (id: any, columns?: string[], withLock?: boolean, doEntityClone?: boolean): Promise<T>
  searchBy (sql: string, where?: SelectOptions | object | T, withLock?: boolean, oneLimit?: boolean): Promise<T[]>
  searchByPage (where: SelectOptions | object | T, page: number, pageSize: number, orderBy?: ORDER_BY, columns?: string[], doEntityClone?: boolean): Promise<Page>
  count (where?: SelectOptions | object | T): Promise<number>
  query (sql: string, valueset?: any, master?: boolean, oneLimit?: boolean): Promise<any>

}