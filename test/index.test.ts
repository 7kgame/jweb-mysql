import MysqlDao from "../lib/index";
import Utils from "../lib/utils";
import * as assert from "assert";
import "mocha";

let mysql;
describe("连接mysql数据库", function() {
  it("获取数据库实例", done => {
    mysql = new MysqlDao({
      user: "root",
      password: "root",
      database: "info_search"
    });
    mysql.connect().then(conn => {
      assert.notStrictEqual(conn, null);
      assert.notStrictEqual(conn, undefined);
      done();
    });
  });
});

describe("向数据库中插入数据", function() {
  let template;
  let tbName = "city";
  let values = {
    Name: "长沙",
    CountryCode: "CHN",
    District: "South",
    Population: "10000000"
  };

  it("得到转义后的sql语句", () => {
    template = Utils.generateInsertSqlTemplate(
      tbName,
      values,
      mysql.getClient()
    );
    assert.strictEqual(
      template,
      "INSERT INTO `city`(`Name`,`CountryCode`,`District`,`Population`) VALUES('长沙','CHN','South','10000000');"
    );
  });

  it("向city表中插入一条数据", done => {
    mysql
      .insert("city", values)
      .then(results => {
        assert(results.affectedRows > 0);
        done();
      })
      .catch(err => {
        console.log(err);
        assert(false);
        done();
      });
  });
});

describe("关闭数据库", () => {
  it("关闭数据库", () => {
    mysql.disconnect();
  });
});
