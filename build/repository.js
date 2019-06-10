"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
const BEAN_PREFIX = 'mysql.';
const DEFAULT_DAO_BEAN = 'primary';
class MysqlRepository {
    constructor(entityClz) {
        this.useDefaultDao = false;
        this.entityClz = entityClz;
    }
    getDao(master) {
        master = master || false;
        const filter = function (target) {
            if (!target || !target.ins || typeof target.ins.isMaster !== 'function') {
                return false;
            }
            return target.ins.isMaster() === master;
        };
        let bean = null;
        if (!this.useDefaultDao) {
            const jwebPackage = this.constructor && this.constructor[jbean_1.CTOR_JWEB_PACKAGE_KEY];
            bean = jbean_1.BeanFactory.getBeanByPackage(jwebPackage, filter, BEAN_PREFIX);
        }
        if (!bean) {
            this.useDefaultDao = true;
            bean = jbean_1.BeanFactory.getBean(BEAN_PREFIX + DEFAULT_DAO_BEAN);
        }
        return bean;
    }
    insert(entity) {
        return this.getDao(true).insert(entity, jbean_1.BeanFactory.getRequestId(this));
    }
    update(entity) {
        return this.getDao(true).update(entity, this.entityClz['getPrimaryVal'](entity, true), jbean_1.BeanFactory.getRequestId(this));
    }
    delete(entity) {
        return this.getDao(true).delete(this.entityClz, this.entityClz['getPrimaryVal'](entity, true), jbean_1.BeanFactory.getRequestId(this));
    }
    updateBy(entity, where) {
        return this.getDao(true).update(entity, where, jbean_1.BeanFactory.getRequestId(this));
    }
    deleteBy(where) {
        return this.getDao(true).delete(this.entityClz, where, jbean_1.BeanFactory.getRequestId(this));
    }
    updateById(entity, id) {
        return this.getDao(true).update(entity, this.entityClz['getPrimaryVal'](entity, true, id), jbean_1.BeanFactory.getRequestId(this));
    }
    deleteById(id) {
        return this.getDao(true).delete(this.entityClz, this.entityClz['getPrimaryVal'](null, true, id), jbean_1.BeanFactory.getRequestId(this));
    }
    find(where, columns, withLock, withoutEntityClone) {
        return this.getDao().find(this.entityClz, where, columns, false, withLock, withoutEntityClone, jbean_1.BeanFactory.getRequestId(this));
    }
    findAll(where, columns, withLock, oneLimit, withoutEntityClone) {
        return this.getDao().findAll(this.entityClz, where, columns, false, withLock, oneLimit, withoutEntityClone, null, jbean_1.BeanFactory.getRequestId(this));
    }
    findById(id, columns, withLock, withoutEntityClone) {
        return this.getDao().find(this.entityClz, this.entityClz['getPrimaryVal'](null, true, id), columns, false, withLock, withoutEntityClone, jbean_1.BeanFactory.getRequestId(this));
    }
    searchBy(sql, where, withLock, oneLimit) {
        return this.getDao().selectBy(sql, where, withLock, oneLimit, jbean_1.BeanFactory.getRequestId(this));
    }
    searchByPage(where, page, pageSize, orderBy, columns, withoutEntityClone) {
        return this.getDao().searchByPage(this.entityClz, where, page, pageSize, orderBy, columns, withoutEntityClone, jbean_1.BeanFactory.getRequestId(this));
    }
    count(where) {
        return this.getDao().count(this.entityClz, where, null, jbean_1.BeanFactory.getRequestId(this));
    }
    query(sql, valueset, master, oneLimit) {
        return this.getDao(master).query(sql, valueset, oneLimit, jbean_1.BeanFactory.getRequestId(this));
    }
}
exports.default = MysqlRepository;
