"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("mysql");
exports.getTableNameBy = function (entity) {
    if (typeof entity === 'object') {
        entity = entity.constructor;
    }
    if (entity['$tableName']) {
        // console.log('utils.js line 16' + entity['$tableName'])
        return entity['$tableName'];
    }
    else {
        throw new Error('tableName is not found in ' + entity);
    }
};
class Utils {
    static generateInsertSql(tbName, valueset) {
        let template = `INSERT INTO ${mysql_1.escapeId(tbName)}(`;
        for (let k of Object.keys(valueset)) {
            template += mysql_1.escapeId(k) + ",";
        }
        template = template.slice(0, -1) + ") VALUES(";
        for (let v of Object.values(valueset)) {
            template += mysql_1.escape(v) + ",";
        }
        template = template.slice(0, -1) + ");";
        return template;
    }
    static generateUpdateSql(tbName, valueset, $where) {
        let template = `UPDATE ${mysql_1.escapeId(tbName)} SET `;
        for (let [k, v] of Object.entries(valueset)) {
            template += `${mysql_1.escapeId(k)}=${mysql_1.escape(v)},`;
        }
        template = template.slice(0, -1);
        if ($where) {
            $where['$op'] = $where['$op'] || 'and';
            template = Utils.methods.templateAppendWhere(template, $where);
        }
        template += ';';
        return template;
    }
    static generateDeleteSql(tbName, $where) {
        let template = `DELETE FROM ${mysql_1.escapeId(tbName)}`;
        if ($where) {
            $where['$op'] = $where['$op'] || 'and';
            template = Utils.methods.templateAppendWhere(template, $where);
        }
        template += ';';
        return template;
    }
    static generateSelectSql(tbName, options, columns) {
        let template = `SELECT `;
        if (columns) {
            for (let item of columns) {
                template += `${mysql_1.escapeId(item)},`;
            }
            template = template.slice(0, -1);
        }
        else {
            template += '*';
        }
        template += ` FROM ${mysql_1.escapeId(tbName)}`;
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
        template += ';';
        return template;
    }
}
Utils.methods = {
    templateAppendWhere(template, $where) {
        template += " WHERE ";
        if (Object.keys($where).length > 1 && $where['$op'] !== 'and' && $where['$op'] !== 'or') {
            throw new Error('must specify $op with \'and\' or \'or\'');
        }
        for (let [k, v] of Object.entries($where)) {
            if (k === '$op') {
                continue;
            }
            var pos = (typeof v === 'string') ? v.toUpperCase().indexOf('LIKE') : -1;
            if (pos !== -1) {
                template += `${mysql_1.escapeId(k)} LIKE ${mysql_1.escape(v.slice(pos + 5))}${$where['$op'] ? " " + $where['$op'].toUpperCase() + " " : ''}`;
            }
            else {
                template += `${mysql_1.escapeId(k)}=${mysql_1.escape(v)}${$where['$op'] ? " " + $where['$op'].toUpperCase() + " " : ''}`;
            }
        }
        if ($where['$op'] === 'and') {
            template = template.slice(0, -5);
        }
        else if ($where['$op'] === 'or') {
            template = template.slice(0, -4);
        }
        return template;
    },
    templateAppendLimit(template, { limit, start }) {
        template += " LIMIT ";
        if (start) {
            template += mysql_1.escape(start) + ",";
        }
        template += mysql_1.escape(limit);
        return template;
    },
    templateAppendOrderBy(template, { column, $op }) {
        template += ' ORDER BY ';
        template += `${mysql_1.escapeId(column)} ${$op.toUpperCase()}`;
        return template;
    }
};
exports.default = Utils;
