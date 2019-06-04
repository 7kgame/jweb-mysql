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
      database: dbName
    })
    mysql.connect().then(() => {
      let conn = mysql.getClient()
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
      tbName,
      values
    )
    assert.strictEqual(
      template,
      "INSERT INTO `city`(`Name`, `CountryCode`, `District`, `Population`) VALUES ('ChangSha', 'CHN', 'South', '10000000');"
    )
  })

  it("UPDATE转义后的sql语句", () => {
    let template = Utils.generateUpdateSql(tbName, valueset, where)

    assert.strictEqual(template,
      "UPDATE `city` SET `District` = 'Middle' WHERE `Name` = 'ChangSha';")

    template = Utils.generateUpdateSql(tbName, valueset)
    assert.strictEqual(template,
      "UPDATE `city` SET `District` = 'Middle';")

    template = Utils.generateUpdateSql(tbName, valueset, {Name: "!= Chang"})
    assert.strictEqual(template, "UPDATE `city` SET `District` = 'Middle' WHERE `Name` != 'Chang';")
  })

  it("DELETE转义后的sql语句", () => {
    let template = Utils.generateDeleteSql(tbName, where)
    assert.strictEqual(template, "DELETE FROM `city` WHERE `Name` = 'ChangSha';")

    template = Utils.generateDeleteSql(tbName)
    assert.strictEqual(template, "DELETE FROM `city`;")

    template = Utils.generateDeleteSql(tbName, {Name: "like Chang"})
    assert.strictEqual(template, "DELETE FROM `city` WHERE `Name` like 'Chang';")
  })

  it("SELECT转义后的sql语句", () => {
    let template = Utils.generateSelectSql(tbName, {$where: [{Name: 'ChangSha1'}, {Age: '1', Time: '123', $op: 'or'}]}, ['Name'])
    assert.strictEqual(template, "SELECT `Name` FROM `city` WHERE (`Name` = 'ChangSha1') AND (`Age` = '1' OR `Time` = '123');")

    template = Utils.generateSelectSql(tbName, null, ['District', 'Population'])
    assert.strictEqual(template, "SELECT `District`, `Population` FROM `city`;")

    template = Utils.generateSelectSql(tbName, {$where:{Name: "like Chang", CountryCode: "CHN", $op:'and'}, $orderBy: {column:'Name', op: 'asc'}, $limit:{start:10, limit: 10}}, ['CountryCode'])
    assert.strictEqual(template, "SELECT `CountryCode` FROM `city` WHERE `Name` like 'Chang' AND `CountryCode` = 'CHN' ORDER BY `Name` ASC LIMIT 10, 10;")
  })
  it("简单select查询", () => {
    let template = Utils.generateSelectSql(tbName, {uid: '123'})
    assert.strictEqual(template, "SELECT * FROM `city` WHERE `uid` = '123';")

    template = Utils.generateSelectSql(tbName, {name: 'bright'}, ['age', 'name'])
    assert.strictEqual(template, "SELECT `age`, `name` FROM `city` WHERE `name` = 'bright';")
  })
})