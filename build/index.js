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
const defaultOptions = {
    host: '127.0.0.1',
    port: 3306,
    user: '',
    password: '',
    connectionLimit: require('os').cpus().length
};
class MysqlDao {
    constructor(options) {
        this.options = {};
        if (!options) {
            throw new Error('mysql config options is missing');
        }
        for (let k in defaultOptions) {
            if (typeof options[k] !== 'undefined') {
                this.options[k] = options[k];
            }
            else {
                this.options[k] = defaultOptions[k];
            }
        }
    }
    getConnection() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection(function (err, conn) {
                if (err) {
                    return reject(err);
                }
                if (conn) {
                    return resolve(conn);
                }
            });
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options) {
                throw new Error('database config options is missing');
            }
            if (!this.pool) {
                this.pool = mysql_1.createPool(this.options);
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
}
exports.default = MysqlDao;
