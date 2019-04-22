import Utils from '../lib/utils'
import MysqlDao from '../lib/index'
import * as assert from 'assert'
import 'mocha'

let dbName = "world"
let tbName = "city"
let mysql
describe("连接mysql数据库", function() {
  it("获取数据库实例", done => {
    mysql = new MysqlDao({
      user: "root",
      password: "root",
    })
    mysql.connect().then(conn => {
      assert.notStrictEqual(conn, null)
      assert.notStrictEqual(conn, undefined)
      done()
    })
  })
})

describe("测试工具类", () => {
  let values = {
    Name: "ChangSha",
    CountryCode: "CHN",
    District: "South",
    Population: "10000000"
  }
  let valueset = {
    District: 'Middle'
  }
  let where = {
    Name: 'ChangSha'
  }
  it("INSERT转义后的sql语句", () => {
    let template = Utils.generateInsertSql(
      dbName,
      tbName,
      values
    )
    assert.strictEqual(
      template,
      "INSERT INTO `world`.`city`(`Name`,`CountryCode`,`District`,`Population`) VALUES('ChangSha','CHN','South','10000000');"
    )
  })

  it("UPDATE转义后的sql语句", () => {
    let template = Utils.generateUpdateSql(dbName, tbName, valueset, where)

    assert.strictEqual(template,
      "UPDATE `world`.`city` SET `District`='Middle' WHERE `Name`='ChangSha';")

    template = Utils.generateUpdateSql(dbName, tbName, valueset)
    assert.strictEqual(template,
      "UPDATE `world`.`city` SET `District`='Middle';")

    template = Utils.generateUpdateSql(dbName, tbName, valueset, {Name: "like Chang"})
    assert.strictEqual(template, "UPDATE `world`.`city` SET `District`='Middle' WHERE `Name` LIKE 'Chang';")
  })

  it("DELETE转义后的sql语句", () => {
    let template = Utils.generateDeleteSql(dbName, tbName, where)
    assert.strictEqual(template, "DELETE FROM `world`.`city` WHERE `Name`='ChangSha';")

    template = Utils.generateDeleteSql(dbName, tbName)
    assert.strictEqual(template, "DELETE FROM `world`.`city`;")

    template = Utils.generateDeleteSql(dbName, tbName, {Name: "like Chang"})
    assert.strictEqual(template, "DELETE FROM `world`.`city` WHERE `Name` LIKE 'Chang';")
  })

  it("SELECT转义后的sql语句", () => {
    let template = Utils.generateSelectSql(dbName, [tbName], ['Name'], {where: {Name:'ChangSha'}})
    assert.strictEqual(template, "SELECT `Name` FROM `world`.`city` WHERE `Name`='ChangSha';")

    template = Utils.generateSelectSql(dbName, [tbName], ['District', 'Population'])
    assert.strictEqual(template, "SELECT `District`,`Population` FROM `world`.`city`;")

    template = Utils.generateSelectSql(dbName, [tbName, 'country'], ['CountryCode'], {where:{Name: "like Chang", CountryCode: "CHN", op:'and'}, orderby: {column:'Name', op: 'asc'}, limit:{start:10, limit: 10}})
    assert.strictEqual(template, "SELECT `CountryCode` FROM `world`.`city`,`world`.`country` WHERE `Name` LIKE 'Chang' AND `CountryCode`='CHN' ORDER BY `Name` ASC LIMIT 10,10;")
  })
})