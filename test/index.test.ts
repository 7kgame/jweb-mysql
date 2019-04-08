import MysqlDao from "../lib/index"
import Utils from "../lib/utils"
import * as assert from "assert"
import "mocha"

let mysql, dbName = "world"
describe("连接mysql数据库", function() {
  it("获取数据库实例", done => {
    mysql = new MysqlDao({
      user: "root",
      password: "root"
    })
    mysql.connect().then(conn => {
      assert.notStrictEqual(conn, null)
      assert.notStrictEqual(conn, undefined)
      done()
    })
  })
})

describe("向数据库中插入数据", function() {
  let tbName = "city"
  let values = {
    Name: "WuHan",
    CountryCode: "CHN",
    District: "South",
    Population: "10000000"
  }

  it("向city表中插入一条数据", done => {
    mysql
      .insert(dbName, tbName, values)
      .then(results => {
        assert(results.affectedRows > 0)
        done()
      })
      .catch(err => {
        assert(false)
        done()
      })
  })

})

describe("数据库更新", function() {
  it("更新数据", done => {
    mysql.update(dbName, 'city', {Population: 7000000}, {Name: 'ChangSha'}).then(res => {
      assert(res.affectedRows > 0)
      done()
    })
  })
})

describe("数据库删除", () => {
  it("删除数据", done => {
    mysql.delete(dbName, 'city', {Name: 'ChangSha'}).then(res => {
      done()
      assert(res.affectedRows > 0)
    })
  })
})

describe("数据库查询", () => {
  it("查询一条数据", done => {
    mysql.select(dbName, 'city', ['*'], {where:{Name: 'Wuhan'}}).then(res => {
      assert(res.length > 0)
      done()
    }).catch(err => done())
  })

  it("order by查询&模糊查询", done => {
    mysql.select(dbName, 'city', ['Name', 'CountryCode'], {where:{Name: 'like Ch%'}, orderby: {column:'Name', op:'asc'}}).then(res => {
      assert(res.length > 0)
      done()
    })
  })

  it("limit查询&没有where", done => {
    mysql.select(dbName, 'city', ['*'], {limit:{limit:10}}).then(res => {
      done()
    })
  })
})
describe("关闭数据库", () => {
  it("关闭数据库", (done) => {
    mysql.disconnect().then(res => {
      done()
    })
  })
})
