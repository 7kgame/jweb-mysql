"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("mysql");
const jbean_1 = require("jbean");
exports.getTableNameBy = function (entity, options, supportMulti) {
    if (typeof entity === 'object') {
        entity = entity.constructor;
    }
    if (typeof entity['getTableNames'] === 'function') {
        const where = [].concat((options && options['$options']) ? options['$where'] : options);
        const whereLen = where.length;
        const conditions = {};
        for (let it = 0; it < whereLen; it++) {
            const $whereI = (where[it] && where[it]['toObject']) ? where[it]['toObject']() : where[it];
            if (typeof $whereI !== 'object') {
                continue;
            }
            let op = $whereI['$op'] ? $whereI['$op'].toUpperCase() : null;
            const keys = Object.keys($whereI);
            const keyLen = keys.length;
            for (let itK = 0; itK < keyLen; itK++) {
                const key = keys[itK];
                if (key === '$op') {
                    continue;
                }
                if (typeof conditions[key] === 'undefined') {
                    conditions[key] = [];
                }
                let val = $whereI[key];
                if (keyLen === 2 && op) {
                    conditions[key].push([op, val]);
                }
                else {
                    let compareSymbol = '=';
                    if (typeof val === 'string') {
                        const valInfo = val.split(' ');
                        if (valInfo.length > 1) {
                            val = valInfo.slice(1).join(' ');
                            compareSymbol = valInfo[0];
                        }
                    }
                    conditions[key].push([compareSymbol, val]);
                }
            }
        }
        const tblNames = entity['getTableNames'](conditions, supportMulti, entity);
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
    static generateWhereSql(options, withLock, oneLimit) {
        let template = '';
        let where = options || {};
        if (!where['$where'] && !where['$orderby'] && !where['$limit']) {
            where = { $where: where };
        }
        if (where['$where']) {
            template = Utils.methods.templateAppendWhere(template, where['$where']);
        }
        if (where['$orderby']) {
            template = Utils.methods.templateAppendOrderBy(template, where['$orderby']);
        }
        if (where['$limit']) {
            template = Utils.methods.templateAppendLimit(template, where['$limit']);
        }
        else if (oneLimit) {
            template = Utils.methods.templateAppendLimit(template, { limit: 1 });
        }
        if (withLock) {
            template += ' FOR UPDATE';
        }
        template += ';';
        return template;
    }
    static generateInsertSql(tbName, valueset) {
        valueset = (valueset && valueset['toObject']) ? valueset['toObject']() : valueset;
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
        valueset = (valueset && valueset['toObject']) ? valueset['toObject']() : valueset;
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
    static generateSelectSql(tbName, options, columns, withoutEscapeKey, withLock, oneLimit) {
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
        return template + this.generateWhereSql(options, withLock, oneLimit);
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
        const where = [].concat($where);
        template += " WHERE ";
        const sql = [];
        const whereLen = where.length;
        for (let it = 0; it < whereLen; it++) {
            const $whereI = (where[it] && where[it]['toObject']) ? where[it]['toObject']() : where[it];
            if (typeof $whereI !== 'object') {
                continue;
            }
            let op = $whereI['$op'] ? $whereI['$op'].toUpperCase() : null;
            const keys = Object.keys($whereI);
            const keyLen = keys.length;
            const conds = [];
            let compareSymbol = op;
            for (let itK = 0; itK < keyLen; itK++) {
                const key = keys[itK];
                let val = $whereI[key];
                if (key === '$op') {
                    continue;
                }
                if (keyLen === 2 && op) {
                    if (jbean_1.getObjectType(val) === 'array') {
                        const vals = [];
                        const valLen = val.length;
                        for (let itV = 0; itV < valLen; itV++) {
                            vals.push(mysql_1.escape(val[itV]));
                        }
                        if (op === 'BETWEEN') {
                            val = vals.join(' AND ');
                        }
                        else if (op === 'IN') {
                            val = '(' + vals.join(', ') + ')';
                        }
                        else {
                            val = vals.join(', ');
                        }
                    }
                    else {
                        if (val !== null && ['object', 'function'].indexOf(typeof val) >= 0) {
                            throw new Error('value type is not simple: ' + JSON.stringify($whereI));
                        }
                        val = mysql_1.escape(val);
                    }
                }
                else {
                    if (val !== null && ['object', 'function'].indexOf(typeof val) >= 0) {
                        throw new Error('value type is not simple: ' + JSON.stringify($whereI));
                    }
                    compareSymbol = '=';
                    if (typeof val === 'string') {
                        const valInfo = val.split(' ');
                        if (valInfo.length > 1) {
                            val = valInfo.slice(1).join(' ');
                            compareSymbol = valInfo[0];
                        }
                    }
                    val = mysql_1.escape(val);
                }
                conds.push(`${mysql_1.escapeId(key)} ${compareSymbol} ${val}`);
            }
            if (conds.length > 0) {
                sql.push(conds.join(op ? (' ' + op + '') : ' AND '));
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
