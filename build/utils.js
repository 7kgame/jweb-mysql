"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("mysql");
const jbean_1 = require("jbean");
exports.getTableNameBy = function (entity, where, supportMulti) {
    if (typeof entity === 'object') {
        entity = entity.constructor;
    }
    if (typeof entity['getTableNames'] === 'function') {
        let conditions = {};
        if (where && where['$where']) {
            conditions = where['$where'];
        }
        else if (where) {
            conditions = where;
        }
        const keys = Object.keys(conditions);
        const keyLen = keys.length;
        const conditions2 = {};
        for (let i = 0; i < keyLen; i++) {
            const key = keys[i];
            if (key === '$where' || key === '$orderBy' || key === '$limit') {
                continue;
            }
            let val = conditions[keys[i]];
            let compareSymbol = '=';
            if (typeof val === 'string') {
                const valInfo = val.split(' ');
                if (valInfo.length > 1) {
                    val = valInfo.slice(1).join(' ');
                    compareSymbol = valInfo[0];
                }
            }
            conditions2[key] = [val, compareSymbol];
        }
        const tblNames = entity['getTableNames'](conditions2, !!supportMulti, entity);
        if (tblNames && tblNames.length > 0) {
            return tblNames;
        }
    }
    if (!entity['$tableName']) {
        throw new Error('tableName is not found in ' + entity);
    }
    return entity['$tableName'];
};
class Utils {
    static generateWhereSql(options, withLock) {
        let template = '';
        let hasSpecifiedOptionName = false;
        if (options && options['$where']) {
            hasSpecifiedOptionName = true;
            template = Utils.methods.templateAppendWhere(template, options['$where']);
        }
        if (options && options['$orderby']) {
            hasSpecifiedOptionName = true;
            template = Utils.methods.templateAppendOrderBy(template, options['$orderby']);
            delete options['$orderby'];
        }
        if (options && options['$limit']) {
            hasSpecifiedOptionName = true;
            template = Utils.methods.templateAppendLimit(template, options['$limit']);
            delete options['$limit'];
        }
        if (options && !hasSpecifiedOptionName) {
            options['$op'] = 'and';
            template = Utils.methods.templateAppendWhere(template, options);
        }
        if (withLock) {
            template += ' FOR UPDATE';
        }
        template += ';';
        return template;
    }
    static generateInsertSql(tbName, valueset) {
        let template = `INSERT INTO ${mysql_1.escapeId(tbName)}(`;
        for (let k of Object.keys(valueset)) {
            template += mysql_1.escapeId(k) + ", ";
        }
        template = template.slice(0, -2) + ") VALUES (";
        for (let v of Object.values(valueset)) {
            template += mysql_1.escape(v) + ", ";
        }
        template = template.slice(0, -2) + ");";
        return template;
    }
    static generateUpdateSql(tbName, valueset, $where) {
        let template = `UPDATE ${mysql_1.escapeId(tbName)} SET `;
        for (let [k, v] of Object.entries(valueset)) {
            template += `${mysql_1.escapeId(k)} = ${mysql_1.escape(v)}, `;
        }
        template = template.slice(0, -2);
        return template + this.generateWhereSql($where);
    }
    static generateDeleteSql(tbName, $where) {
        let template = `DELETE FROM ${mysql_1.escapeId(tbName)}`;
        return template + this.generateWhereSql($where);
    }
    static generateSelectSql(tbName, options, columns, withoutEscapeKey, withLock) {
        let template = `SELECT `;
        if (columns && columns.length > 0) {
            for (let item of columns) {
                template += withoutEscapeKey ? item : `${mysql_1.escapeId(item)}`;
                template += ', ';
            }
            template = template.slice(0, -2);
        }
        else {
            template += '*';
        }
        template += ` FROM ${mysql_1.escapeId(tbName)}`;
        return template + this.generateWhereSql(options, withLock);
    }
    static makeWhereByPK(entity, id) {
        let ctor;
        if (typeof entity === 'object') {
            ctor = entity.constructor;
        }
        else {
            ctor = entity;
        }
        const meta = jbean_1.BeanFactory.getBeanMeta(ctor);
        if (!meta || !meta.id) {
            throw new Error('primary key is not exist in ' + ctor.name);
        }
        const where = {};
        where[meta.id] = id;
        return where;
    }
}
Utils.methods = {
    templateAppendWhere(template, $where) {
        template += " WHERE ";
        if (jbean_1.getObjectType($where) !== 'array') {
            $where = [$where];
        }
        const sql = [];
        const whereLen = $where.length;
        for (let it = 0; it < whereLen; it++) {
            const $whereI = $where[it];
            if (typeof $whereI !== 'object') {
                continue;
            }
            let op = ' AND ';
            if ($whereI['$op']) {
                op = ' ' + $whereI['$op'].toUpperCase() + ' ';
            }
            const keys = Object.keys($whereI);
            const keyLen = keys.length;
            const conds = [];
            for (let itK = 0; itK < keyLen; itK++) {
                const key = keys[itK];
                let compareSymbol = '=';
                let val = $whereI[key];
                if (key === '$op') {
                    continue;
                }
                if (typeof val === 'string') {
                    const valInfo = val.split(' ');
                    if (valInfo.length > 1) {
                        val = valInfo.slice(1).join(' ');
                        compareSymbol = valInfo[0];
                    }
                }
                conds.push(`${mysql_1.escapeId(key)} ${compareSymbol} ${mysql_1.escape(val)}`);
            }
            if (conds.length > 0) {
                sql.push(conds.join(op));
            }
        }
        if (sql.length < 1) {
            return '';
        }
        else if (sql.length === 1) {
            return template + sql.join(') AND (');
        }
        else {
            return template + '(' + sql.join(') AND (') + ')';
        }
    },
    templateAppendLimit(template, { limit, start }) {
        template += " LIMIT ";
        if (start) {
            template += mysql_1.escape(start) + ", ";
        }
        template += mysql_1.escape(limit);
        return template;
    },
    templateAppendOrderBy(template, { column, op }) {
        template += ' ORDER BY ';
        if (!op) {
            op = 'asc';
        }
        template += `${mysql_1.escapeId(column)} ${op.toUpperCase()}`;
        return template;
    }
};
exports.default = Utils;
