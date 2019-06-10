import { BeanFactory, CTOR_JWEB_PACKAGE_KEY, Page } from 'jbean'
import MysqlDao, { UPDATE_RESULT } from './dao'
import { ORDER_BY, SelectOptions, WHERE } from './utils'

const BEAN_PREFIX = 'mysql.'
const DEFAULT_DAO_BEAN = 'primary'

export default class MysqlRepository<T> {

  protected entityClz: Function
  private useDefaultDao: boolean = false

  public constructor (entityClz: Function) {
    this.entityClz = entityClz
  }

  protected getDao(master?: boolean): MysqlDao {
    master = master || false
    const filter = function (target: any) {
      if (!target || !target.ins || typeof target.ins.isMaster !== 'function') {
        return false
      }
      return target.ins.isMaster() === master
    }
    let bean: MysqlDao = null
    if (!this.useDefaultDao) {
      const jwebPackage: string = this.constructor && this.constructor[CTOR_JWEB_PACKAGE_KEY]
      bean = <MysqlDao> BeanFactory.getBeanByPackage(jwebPackage, filter, BEAN_PREFIX)
    }

    if (!bean) {
      this.useDefaultDao = true
      bean = <MysqlDao> BeanFactory.getBean(BEAN_PREFIX + DEFAULT_DAO_BEAN)
    }
    return bean
  }

  public insert (entity: T): Promise<number> {
    return this.getDao(true).insert(<any> entity, BeanFactory.getRequestId(this))
  }

  public update (entity: T): Promise<UPDATE_RESULT> {
    return this.getDao(true).update(<any> entity, this.entityClz['getPrimaryVal'](entity, true), BeanFactory.getRequestId(this))
  }

  public delete (entity: T): Promise<UPDATE_RESULT> {
    return this.getDao(true).delete(this.entityClz, this.entityClz['getPrimaryVal'](entity, true), BeanFactory.getRequestId(this))
  }

  public updateBy (entity: T, where: SelectOptions | object): Promise<UPDATE_RESULT> {
    return this.getDao(true).update(<any> entity, where, BeanFactory.getRequestId(this))
  }

  public deleteBy (where: SelectOptions | object): Promise<UPDATE_RESULT> {
    return this.getDao(true).delete(this.entityClz, where, BeanFactory.getRequestId(this))
  }

  public updateById (entity: object, id: any): Promise<UPDATE_RESULT> {
    return this.getDao(true).update(entity, this.entityClz['getPrimaryVal'](entity, true, id), BeanFactory.getRequestId(this))
  }

  public deleteById (id: any): Promise<UPDATE_RESULT> {
    return this.getDao(true).delete(this.entityClz, this.entityClz['getPrimaryVal'](null, true, id), BeanFactory.getRequestId(this))
  }

  public find (where: SelectOptions | object | T, columns?: string[], withLock?: boolean, withoutEntityClone?: boolean): Promise<T> {
    return this.getDao().find(this.entityClz, where, columns, false, withLock, withoutEntityClone, BeanFactory.getRequestId(this))
  }

  public findAll (where: SelectOptions | object | T, columns?: string[], withLock?: boolean, oneLimit?: boolean, withoutEntityClone?: boolean): Promise<T[]> {
    return this.getDao().findAll(this.entityClz, where, columns, false, withLock, oneLimit, withoutEntityClone, null, BeanFactory.getRequestId(this))
  }

  public findById (id: any, columns?: string[], withLock?: boolean, withoutEntityClone?: boolean): Promise<T> {
    return this.getDao().find(this.entityClz, this.entityClz['getPrimaryVal'](null, true, id), columns, false, withLock, withoutEntityClone, BeanFactory.getRequestId(this))
  }

  public searchBy (sql: string, where?: SelectOptions | object | T, withLock?: boolean, oneLimit?: boolean): Promise<any[]> {
    return this.getDao().selectBy(sql, where, withLock, oneLimit, BeanFactory.getRequestId(this))
  }

  public searchByPage<T> (where: WHERE | WHERE[] | object | T, page: number, pageSize: number, orderBy?: ORDER_BY, columns?: string[], withoutEntityClone?: boolean): Promise<Page<T>> {
    return this.getDao().searchByPage(this.entityClz, <any> where, page, pageSize, orderBy, columns, withoutEntityClone, BeanFactory.getRequestId(this))
  }

  public count (where?: SelectOptions | object | T): Promise<number> {
    return this.getDao().count(this.entityClz, where, null, BeanFactory.getRequestId(this))
  }

  public query (sql: string, valueset?: any, master?: boolean, oneLimit?: boolean): Promise<any> {
    return this.getDao(master).query(sql, valueset, oneLimit, BeanFactory.getRequestId(this))
  }

}