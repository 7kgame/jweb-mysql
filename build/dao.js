"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("mysql");
const utils_1 = require("./utils");
const jbean_1 = require("jbean");
const printSql = function (sql) {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }
    console.log(sql);
};
const defaultOptions = {
    host: '127.0.0.1',
    port: 3306,
    user: '',
    password: '',
    database: '',
    connectionLimit: 20,
    connectTimeout: 10000,
    waitForConnections: true,
    charset: 'UTF8_GENERAL_CI',
    supportBigNumbers: true,
    bigNumberStrings: false,
    dateStrings: false
};
const makeSimplePromise = function (data, err) {
    return new Promise(function (res, rej) {
        if (err) {
            rej(err);
        }
        else {
            res(data);
        }
    });
};
const connectionPool = {};
function commitTransaction(requestId) {
    return new Promise(function (res, rej) {
        const rKey = 'r_' + requestId;
        if (typeof connectionPool[rKey] === 'undefined') {
            res(null);
            return;
        }
        const connection = connectionPool[rKey][0];
        const pool = connectionPool[rKey][1];
        delete connectionPool[rKey];
        connection.commit(function (err) {
            // connection.release()
            pool.releaseConnection(connection);
            if (err) {
                rej(err);
            }
            else {
                res(null);
            }
        });
    });
}
exports.commitTransaction = commitTransaction;
function rollbackTransaction(requestId) {
    return new Promise(function (res, rej) {
        const rKey = 'r_' + requestId;
        if (typeof connectionPool[rKey] === 'undefined') {
            res(null);
            return;
        }
        // const connection: PoolConnection = connectionPool[rKey]
        const connection = connectionPool[rKey][0];
        const pool = connectionPool[rKey][1];
        delete connectionPool[rKey];
        connection.rollback(function (err) {
            // connection.release()
            pool.releaseConnection(connection);
            if (err) {
                rej(err);
            }
            else {
                res(null);
            }
        });
    });
}
exports.rollbackTransaction = rollbackTransaction;
function releaseConnection(requestId) {
    const rKey = 'r_' + requestId;
    if (typeof connectionPool[rKey] === 'undefined') {
        return;
    }
    // const connection: PoolConnection = connectionPool[rKey]
    const connection = connectionPool[rKey][0];
    const pool = connectionPool[rKey][1];
    pool.releaseConnection(connection);
    // connection.release()
    delete connectionPool[rKey];
}
exports.releaseConnection = releaseConnection;
jbean_1.registerCommit(function (requestId) {
    return commitTransaction(requestId);
});
jbean_1.registerRollback(function (requestId) {
    return rollbackTransaction(requestId);
});
class MysqlDao {
    constructor(options) {
        this.options = {};
        this.master = false;
        if (!options) {
            throw new Error('mysql config options is missing');
        }
        this.master = !!options.master;
        Object.assign(this.options, defaultOptions);
        for (let k in options) {
            if (typeof this.options[k] !== 'undefined') {
                this.options[k] = options[k];
            }
        }
    }
    isMaster() {
        return this.master;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options) {
                throw new Error('database config options is missing');
            }
            if (!this.pool) {
                this.pool = yield mysql_1.createPool(this.options);
            }
        });
    }
    getClient(requestId) {
        return new Promise((res, rej) => {
            if (!requestId) {
                res(this.pool);
            }
            else {
                const rKey = 'r_' + requestId;
                if (typeof connectionPool[rKey] !== 'undefined') {
                    res(connectionPool[rKey][0]);
                }
                else {
                    const pool = this.pool;
                    pool.getConnection(function (err, connection) {
                        if (err) {
                            rej(err);
                        }
                        else {
                            connection.beginTransaction(function (err) {
                                if (err) {
                                    connection.release();
                                    rej(err);
                                }
                                else {
                                    connectionPool[rKey] = [connection, pool];
                                    res(connection);
                                }
                            });
                        }
                    });
                }
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pool) {
                yield this.pool.end();
            }
        });
    }
    insert(entity, requestId) {
        const tableNames = utils_1.getTableNameBy(entity);
        if (jbean_1.getObjectType(tableNames) === 'array' && tableNames.length > 1) {
            throw new Error('multi table name exist in insert case: ' + tableNames);
        }
        let sql = utils_1.default.generateInsertSql(tableNames, entity);
        return new Promise((res, rej) => {
            this.query(sql, null, false, requestId).then(function (ret) {
                res(ret.insertId || ret.affectedRows);
            }, function (e) {
                rej(e);
            });
        });
    }
    update(entity, where, requestId) {
        const tableNames = utils_1.getTableNameBy(entity, where);
        if (jbean_1.getObjectType(tableNames) === 'array' && tableNames.length > 1) {
            throw new Error('multi table name exist in update case: ' + tableNames);
        }
        let sql = utils_1.default.generateUpdateSql(tableNames, entity, where);
        return new Promise((res, rej) => {
            this.query(sql, null, false, requestId).then(function (ret) {
                res({
                    changed: ret.changedRows,
                    affected: ret.affectedRows
                });
            }, function (e) {
                rej(e);
            });
        });
    }
    delete(entity, where, requestId) {
        const tableNames = utils_1.getTableNameBy(entity, where);
        if (jbean_1.getObjectType(tableNames) === 'array' && tableNames.length > 1) {
            throw new Error('multi table name exist in delete case: ' + tableNames);
        }
        let sql = utils_1.default.generateDeleteSql(tableNames, where);
        return new Promise((res, rej) => {
            this.query(sql, null, false, requestId).then(function (ret) {
                res({
                    changed: ret.changedRows,
                    affected: ret.affectedRows
                });
            }, function (e) {
                rej(e);
            });
        });
    }
    find(entity, where, columns, withoutEscapeKey, withLock, withoutEntityClone, requestId) {
        return this.findAll(entity, where, columns, withoutEscapeKey, withLock, true, withoutEntityClone, null, requestId);
    }
    findAll(entity, where, columns, withoutEscapeKey, withLock, oneLimit, withoutEntityClone, tableNames, requestId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!tableNames) {
                tableNames = utils_1.getTableNameBy(entity, where, !oneLimit);
            }
            let tableNamesLen = 0;
            if (jbean_1.getObjectType(tableNames) === 'array') {
                tableNamesLen = tableNames.length;
            }
            else {
                tableNames = [tableNames];
                tableNamesLen = 1;
            }
            if (oneLimit && tableNamesLen > 1) {
                throw new Error('multi table name exist in findOne case: ' + tableNames);
            }
            withoutEntityClone = withoutEntityClone || typeof entity['clone'] !== 'function';
            let ret = [];
            for (let i = 0; i < tableNamesLen; i++) {
                let ret0 = yield this._doFind(entity, tableNames[i], where, columns, withoutEscapeKey, withLock, oneLimit, withoutEntityClone, requestId);
                if (oneLimit && ret0 && ret0.length > 0) {
                    return ret0[0];
                }
                ret = ret.concat(ret0);
            }
            if (oneLimit) {
                if (ret.length === 0) {
                    return null;
                }
                else if (ret.length === 1) {
                    return ret[0];
                }
            }
            return ret;
        });
    }
    _doFind(entity, tableName, where, columns, withoutEscapeKey, withLock, oneLimit, withoutEntityClone, requestId) {
        let sql = utils_1.default.generateSelectSql(tableName, where, columns, withoutEscapeKey, withLock, oneLimit);
        return new Promise((res, rej) => {
            this.query(sql, null, false, requestId).then(function (data) {
                if (!data || data.length < 1) {
                    res(oneLimit ? null : []);
                    return;
                }
                const ret = [];
                const dataLen = data.length;
                const keys = Object.getOwnPropertyNames(data[0]);
                const keyLen = keys.length;
                for (let i = 0; i < dataLen; i++) {
                    if (i > 0 && oneLimit) {
                        break;
                    }
                    if (!withoutEntityClone) {
                        ret.push(entity['clone'](data[i]));
                    }
                    else {
                        const item = {};
                        for (let j = 0; j < keyLen; j++) {
                            item[keys[j]] = data[i][keys[j]];
                        }
                        ret.push(item);
                    }
                }
                res(ret);
            }, function (e) {
                rej(e);
            });
        });
    }
    findById(entity, id, columns, withLock, withoutEntityClone, requestId) {
        if (id === undefined) {
            return makeSimplePromise(null);
        }
        return this.find(entity, utils_1.default.makeWhereByPK(entity, id), columns, false, withLock, withoutEntityClone, requestId);
    }
    updateById(entity, id, requestId) {
        if (id === undefined) {
            return makeSimplePromise(0);
        }
        return this.update(entity, utils_1.default.makeWhereByPK(entity, id), requestId);
    }
    deleteById(entity, id, requestId) {
        if (id === undefined) {
            return makeSimplePromise(0);
        }
        return this.delete(entity, utils_1.default.makeWhereByPK(entity, id), requestId);
    }
    count(entity, where, tableNames, requestId) {
        where = (where && where['$where']) ? where['$where'] : where;
        return new Promise((res, rej) => {
            this.findAll(entity, where, ['count(*) as count'], true, false, false, true, tableNames, requestId).then(function (data) {
                const dataLen = data.length;
                let count = 0;
                for (let i = 0; i < dataLen; i++) {
                    let c = (+data[i].count);
                    c && (count += c);
                }
                res(count);
            }, function (e) {
                rej(e);
            });
        });
    }
    selectBy(sql, where, withLock, oneLimit, requestId) {
        sql += utils_1.default.generateWhereSql(where, withLock);
        return this.query(sql, null, oneLimit, requestId);
    }
    searchByPage(entity, where, page, pageSize, orderBy, columns, withoutEntityClone, requestId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ret = { total: 0, list: null };
            pageSize = pageSize - 0;
            if (pageSize < 1) {
                return ret;
            }
            page = page - 1;
            if (!page || page < 1) {
                page = 0;
            }
            const limit = pageSize - 0;
            const start = page * pageSize;
            const searchWhere = {
                $where: (where && where['$where']) ? where['$where'] : where
            };
            if (orderBy) {
                searchWhere.$orderBy = orderBy;
            }
            searchWhere.$limit = {
                limit: limit,
                start: start
            };
            let tableNames = utils_1.getTableNameBy(entity, where, true);
            tableNames = [].concat(tableNames);
            const tblLen = tableNames.length;
            let data = [];
            let count = 0;
            for (let i = 0; i < tblLen; i++) {
                if (data.length < limit && searchWhere['$limit'].limit > 0) {
                    let d0 = yield this.findAll(entity, searchWhere, columns, false, false, false, withoutEntityClone, tableNames[i], requestId);
                    data = data.concat(d0);
                }
                let c0 = yield this.count(entity, where, tableNames[i], requestId);
                count += c0;
                searchWhere['$limit'].limit = limit - data.length;
                searchWhere['$limit'].start = start - count;
                if (searchWhere['$limit'].start < 0) {
                    searchWhere['$limit'].start = 0;
                }
            }
            ret.list = data;
            ret.total = count;
            if (limit > 0 && ret.list.length > limit) {
                ret.list = ret.list.slice(0, limit);
            }
            return ret;
        });
    }
    query(sql, valueset, oneLimit, requestId) {
        printSql(sql);
        return new Promise((resolve, reject) => {
            this.getClient(requestId).then((connection) => {
                connection.query(sql, valueset || [], function (err, results, fields) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (oneLimit) {
                        results = results ? results[0] : null;
                    }
                    resolve(results);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }
}
exports.default = MysqlDao;
MysqlDao['singleton'] = true;
