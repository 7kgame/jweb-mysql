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
const promise_1 = require("mysql2/promise");
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
        // 重写，支持客户端配置参数，而不只是使用默认参数
        Object.assign(this.options, defaultOptions);
        for (let k in options) {
            if (typeof options[k] !== 'undefined') {
                this.options[k] = options[k];
            }
        }
    }
    getConnection() {
        return this.pool.getConnection();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options) {
                throw new Error('database config options is missing');
            }
            if (!this.pool) {
                this.pool = yield promise_1.createPool(this.options);
            }
            this.connection = yield this.getConnection();
            return this.connection;
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
            let template = utils_1.default.generateInsertSql(utils_1.getTableNameBy(entity), valueset);
            const ret = yield this.query(template);
            return ret[0].insertId;
        });
    }
    update(entity, where) {
        return __awaiter(this, void 0, void 0, function* () {
            const valueset = entity['toObject'] ? entity['toObject']() : entity;
            let template = utils_1.default.generateUpdateSql(utils_1.getTableNameBy(entity), valueset, where);
            const ret = yield this.query(template);
            return ret[0].affectedRows;
        });
    }
    delete(entity, where) {
        return __awaiter(this, void 0, void 0, function* () {
            let template = utils_1.default.generateDeleteSql(utils_1.getTableNameBy(entity), where);
            const ret = yield this.query(template);
            return ret[0].affectedRows;
        });
    }
    select(entity, where, columns) {
        return __awaiter(this, void 0, void 0, function* () {
            let template = utils_1.default.generateSelectSql(utils_1.getTableNameBy(entity), where, columns);
            const data = yield this.query(template);
            if (!data) {
                return [];
            }
            const ret = [];
            data[0].forEach(item => {
                if (typeof entity['clone'] === 'function') {
                    ret.push(entity['clone'](item));
                }
                else {
                    ret.push(JSON.parse(JSON.stringify(item)));
                }
            });
            return ret;
        });
    }
    getEntity(entity, where, columns) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof where['where'] === 'undefined') {
                where = {
                    where: Object.assign({ $op: 'and' }, where),
                    limit: { limit: 1 }
                };
            }
            let template = utils_1.default.generateSelectSql(utils_1.getTableNameBy(entity), where, columns);
            const data = yield this.query(template);
            if (!data || data.length < 1) {
                return null;
            }
            if (typeof entity['clone'] === 'function') {
                return entity['clone'](data[0]);
            }
            else {
                return JSON.parse(JSON.stringify(data[0]));
            }
        });
    }
    query(sql, valueset) {
        return __awaiter(this, void 0, void 0, function* () {
            printSql(sql);
            return this.getClient().query(sql, valueset || []);
        });
    }
}
exports.default = MysqlDao;
