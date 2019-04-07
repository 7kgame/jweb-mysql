import { Pool, PoolConnection } from "mysql";
export default class Utils {
  static generateInsertSqlTemplate(
    tbName: string,
    values: object,
    pool: Pool | PoolConnection
  ): string {
    let template = `INSERT INTO ${pool.escapeId(tbName)}(`;
    for (let k of Object.keys(values)) {
      template += pool.escapeId(k) + ",";
    }
    template = template.slice(0, -1) + ") VALUES(";
    for (let v of Object.values(values)) {
      template += pool.escape(v) + ",";
    }
    template = template.slice(0, -1) + ");";
    return template;
  }
}
