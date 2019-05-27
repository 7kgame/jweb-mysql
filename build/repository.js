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
        return this.getDao(true).insert(entity);
    }
    update(entity) {
        return this.getDao(true).update(entity, this.entityClz['getPrimaryVal'](entity, true));
    }
    delete(entity) {
        return this.getDao(true).delete(this.entityClz, this.entityClz['getPrimaryVal'](entity, true));
    }
    updateBy(entity, where) {
        return this.getDao(true).update(entity, where);
    }
    deleteBy(where) {
        return this.getDao(true).delete(this.entityClz, where);
    }
    updateById(entity, id) {
        return this.getDao(true).update(entity, this.entityClz['getPrimaryVal'](entity, true, id));
    }
    deleteById(id) {
        return this.getDao(true).delete(this.entityClz, this.entityClz['getPrimaryVal'](null, true, id));
    }
    find(where, columns, withLock, doEntityClone) {
        if (typeof where['toObject'] === 'function') {
            where = where['toObject']();
        }
        return this.getDao().find(this.entityClz, where, columns, false, withLock, doEntityClone);
    }
    findAll(where, columns, withLock, oneLimit, doEntityClone) {
        if (where && typeof where['toObject'] === 'function') {
            where = where['toObject']();
        }
        return this.getDao().findAll(this.entityClz, where, columns, false, withLock, oneLimit, doEntityClone);
    }
    searchBy(sql, where, withLock, oneLimit) {
        if (where && typeof where['toObject'] === 'function') {
            where = where['toObject']();
        }
        return this.getDao().selectBy(sql, where, withLock, oneLimit);
    }
    searchByPage(where, page, pageSize, orderBy, columns, doEntityClone) {
        if (where && typeof where['toObject'] === 'function') {
            where = where['toObject']();
        }
        return this.getDao().searchByPage(this.entityClz, where, page, pageSize, orderBy, columns, doEntityClone);
    }
    count(where) {
        if (typeof where['toObject'] === 'function') {
            where = where['toObject']();
        }
        return this.getDao().count(this.entityClz, where);
    }
    query(sql, valueset, master, oneLimit) {
        return this.getDao(master).query(sql, valueset, oneLimit);
    }
}
exports.default = MysqlRepository;
