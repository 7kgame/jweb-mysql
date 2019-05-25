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
    connectionLimit: require("os").cpus().length
};
class MysqlDao {
    constructor(options) {
        this.options = {};
        if (!options) {
            throw new Error('mysql config options is missing');
        }
        Object.assign(this.options, defaultOptions);
        for (let k in options) {
            if (typeof this.options[k] !== 'undefined') {
                this.options[k] = options[k];
            }
        }
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
    getClient() {
        return this.pool;
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pool) {
                yield this.pool.end();
            }
        });
    }
    insert(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const valueset = entity['toObject'] ? entity['toObject']() : entity;
            let sql = utils_1.default.generateInsertSql(utils_1.getTableNameBy(entity), valueset);
            const ret = yield this.query(sql);
            return ret.insertId;
        });
    }
    update(entity, where) {
        return __awaiter(this, void 0, void 0, function* () {
            const valueset = entity['toObject'] ? entity['toObject']() : entity;
            let sql = utils_1.default.generateUpdateSql(utils_1.getTableNameBy(entity), valueset, where);
            const ret = yield this.query(sql);
            return ret.affectedRows;
        });
    }
    delete(entity, where) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = utils_1.default.generateDeleteSql(utils_1.getTableNameBy(entity), where);
            const ret = yield this.query(sql);
            return ret.affectedRows;
        });
    }
    find(entity, where, columns, withoutEscapeKey, doEntityClone) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findAll(entity, where, columns, withoutEscapeKey, true, doEntityClone);
        });
    }
    findAll(entity, where, columns, withoutEscapeKey, oneLimit, doEntityClone) {
        return __awaiter(this, void 0, void 0, function* () {
            if (oneLimit && where && typeof where['where'] === 'undefined') {
                where = {
                    $where: Object.assign({ $op: 'and' }, where),
                    $limit: { limit: 1 }
                };
            }
            let sql = utils_1.default.generateSelectSql(utils_1.getTableNameBy(entity), where, columns, withoutEscapeKey);
            const data = yield this.query(sql);
            if (!data || data.length < 1) {
                return oneLimit ? null : [];
            }
            const ret = [];
            const dataLen = data.length;
            const keys = Object.getOwnPropertyNames(data[0]);
            const keyLen = keys.length;
            doEntityClone = doEntityClone && typeof entity['clone'] === 'function';
            for (let i = 0; i < dataLen; i++) {
                if (i > 0 && oneLimit) {
                    break;
                }
                if (doEntityClone) {
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
            return oneLimit ? ret[0] : ret;
        });
    }
    select(entity, where, columns, withoutEscapeKey, oneLimit, doEntityClone) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findAll(entity, where, columns, withoutEscapeKey, oneLimit, doEntityClone);
        });
    }
    getEntity(entity, where, columns, withoutEscapeKey, doEntityClone) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findAll(entity, where, columns, withoutEscapeKey, true, doEntityClone);
        });
    }
    // findById
    // count
    // fetch
    // fetchAll
    // updateById
    /**
     * Pageable {
        getPageNumber
        getPageSize
        getOffset
        getSort
        data
      }
     */
    selectBy(sql, where, oneLimit) {
        return __awaiter(this, void 0, void 0, function* () {
            sql += utils_1.default.generateWhereSql(where);
            return this.query(sql, null, oneLimit);
        });
    }
    count(entity, where) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.find(entity, where, ['count(*) as count'], true);
            return (data && data.count) ? data.count : 0;
        });
    }
    query(sql, valueset, oneLimit) {
        return __awaiter(this, void 0, void 0, function* () {
            printSql(sql);
            return new Promise((resolve, reject) => {
                this.getClient().query(sql, valueset || [], function (err, results, fields) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (oneLimit) {
                        results = results ? results[0] : null;
                    }
                    resolve(results);
                });
            });
        });
    }
}
exports.default = MysqlDao;
