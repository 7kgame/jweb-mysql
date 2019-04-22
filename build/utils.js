"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("mysql");
exports.getTableNameBy = function (entity) {
    if (typeof entity === 'object') {
        entity = entity.constructor;
    }
    if (entity.name) {
        return entity.name.toLowerCase();
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
    static generateUpdateSql(tbName, valueset, where) {
        let template = `UPDATE ${mysql_1.escapeId(tbName)} SET `;
        for (let [k, v] of Object.entries(valueset)) {
            template += `${mysql_1.escapeId(k)}=${mysql_1.escape(v)},`;
        }
        template = template.slice(0, -1);
        if (where) {
            where['_op'] = where['_op'] || 'and';
            template = Utils.methods.templateAppendWhere(template, where);
        }
        template += ';';
        return template;
    }
    static generateDeleteSql(tbName, where) {
        let template = `DELETE FROM ${mysql_1.escapeId(tbName)}`;
        if (where) {
            where['_op'] = where['_op'] || 'and';
            template = Utils.methods.templateAppendWhere(template, where);
        }
        template += ';';
        return template;
    }
    static generateSelectSql(tbName, options, columns) {
        let template = `SELECT `;
        columns = columns || ['*'];
        for (let item of columns) {
            template += `${mysql_1.escapeId(item)},`;
        }
        template = template.slice(0, -1);
        template += ` FROM ${mysql_1.escapeId(tbName)}`;
        if (options && options['where']) {
            template = Utils.methods.templateAppendWhere(template, options['where']);
        }
        if (options && options['orderby']) {
            template = Utils.methods.templateAppendOrderBy(template, options['orderby']);
            delete options['orderby'];
        }
        if (options && options['limit']) {
            template = Utils.methods.templateAppendLimit(template, options['limit']);
            delete options['limit'];
        }
        if (options && typeof options['where'] === 'undefined') {
            options['_op'] = 'and';
            template = Utils.methods.templateAppendWhere(template, options);
        }
        template += ';';
        return template;
    }
}
Utils.methods = {
    templateAppendWhere(template, where) {
        template += " WHERE ";
        if (Object.keys(where).length > 1 && where['_op'] !== 'and' && where['_op'] !== 'or') {
            throw new Error('must specify _op with \'and\' or \'or\'');
        }
        for (let [k, v] of Object.entries(where)) {
            if (k === '_op') {
                continue;
            }
            var pos = (typeof v === 'string') ? v.toUpperCase().indexOf('LIKE') : -1;
            if (pos !== -1) {
                template += `${mysql_1.escapeId(k)} LIKE ${mysql_1.escape(v.slice(pos + 5))}${where['_op'] ? " " + where['_op'].toUpperCase() + " " : ''}`;
            }
            else {
                template += `${mysql_1.escapeId(k)}=${mysql_1.escape(v)}${where['_op'] ? " " + where['_op'].toUpperCase() + " " : ''}`;
            }
        }
        if (where['_op'] === 'and') {
            template = template.slice(0, -5);
        }
        else if (where['_op'] === 'or') {
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
    templateAppendOrderBy(template, { column, _op }) {
        template += ' ORDER BY ';
        template += `${mysql_1.escapeId(column)} ${_op.toUpperCase()}`;
        return template;
    }
};
exports.default = Utils;
