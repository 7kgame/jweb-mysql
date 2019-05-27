import { BeanFactory, CTOR_JWEB_PACKAGE_KEY, Page } from 'jbean'
import MysqlDao from './dao'
import { ORDER_BY, SelectOptions } from './utils'

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
    return this.getDao(true).insert(<any> entity)
  }

  public update (entity: T): Promise<number> {
    return this.getDao(true).update(<any> entity, this.entityClz['getPrimaryVal'](entity, true))
  }

  public delete (entity: T): Promise<number> {
    return this.getDao(true).delete(this.entityClz, this.entityClz['getPrimaryVal'](entity, true))
  }

  public updateBy (entity: T, where: SelectOptions | object): Promise<number> {
    return this.getDao(true).update(<any> entity, where)
  }

  public deleteBy (where: SelectOptions | object): Promise<number> {
    return this.getDao(true).delete(this.entityClz, where)
  }

  public updateById (entity: object, id: any): Promise<number> {
    return this.getDao(true).update(entity, this.entityClz['getPrimaryVal'](entity, true, id))
  }

  public deleteById (id: any): Promise<number> {
    return this.getDao(true).delete(this.entityClz, this.entityClz['getPrimaryVal'](null, true, id))
  }

  public find (where: SelectOptions | object | T, columns?: string[], withLock?: boolean, doEntityClone?: boolean): Promise<T> {
    if (typeof where['toObject'] === 'function') {
      where = where['toObject']()
    }
    return this.getDao().find(this.entityClz, where, columns, false, withLock, doEntityClone)
  }

  public findAll (where: SelectOptions | object | T, columns?: string[], withLock?: boolean, oneLimit?: boolean, doEntityClone?: boolean): Promise<T[]> {
    if (where && typeof where['toObject'] === 'function') {
      where = where['toObject']()
    }
    return this.getDao().findAll(this.entityClz, where, columns, false, withLock, oneLimit, doEntityClone)
  }

  public findById (id: any, columns?: string[], withLock?: boolean, doEntityClone?: boolean): Promise<T> {
    return this.getDao().find(this.entityClz, this.entityClz['getPrimaryVal'](null, true, id), columns, false, withLock, doEntityClone)
  }

  public searchBy (sql: string, where?: SelectOptions | object | T, withLock?: boolean, oneLimit?: boolean): Promise<T[]> {
    if (where && typeof where['toObject'] === 'function') {
      where = where['toObject']()
    }
    return this.getDao().selectBy(sql, where, withLock, oneLimit)
  }

  public searchByPage (where: object | T, page: number, pageSize: number, orderBy?: ORDER_BY, columns?: string[], doEntityClone?: boolean): Promise<Page> {
    if (where && typeof where['toObject'] === 'function') {
      where = where['toObject']()
    }
    return this.getDao().searchByPage(this.entityClz, <any> where, page, pageSize, orderBy, columns, doEntityClone)
  }

  public count (where?: SelectOptions | object | T): Promise<number> {
    if (typeof where['toObject'] === 'function') {
      where = where['toObject']()
    }
    return this.getDao().count(this.entityClz, where)
  }

  public query (sql: string, valueset?: any, master?: boolean, oneLimit?: boolean): Promise<any> {
    return this.getDao(master).query(sql, valueset, oneLimit)
  }

}