import MysqlDao from "../lib/index"
import * as assert from "assert"
import "mocha"

let mysql: MysqlDao
class User {
  uid: string
  name: string
  age: number
  constructor(uid, name, age) {
    this.uid = uid
    this.name = name
    this.age = age
  }
}

User.prototype['toObject'] = function () {
  const fields = Object.getOwnPropertyNames(this)
  const obj = {}
  fields.forEach(field => {
    if (this[field] !== undefined) {
      obj[field] = this[field]
    }
  })
  return obj
}
User['clone'] = function (data: object) {
  if (!data) {
    return null
  }
  const clz: any = User
  const entity = new clz()
  const fields = Object.getOwnPropertyNames(entity)
  fields.forEach(field => {
    if (typeof data[field] !== 'undefined') {
      entity[field] = data[field]
    }
  })
  return entity
}
User['$tableName'] = 'user'

describe("连接mysql数据库", function() {
  it("获取数据库实例", done => {
    mysql = new MysqlDao({
      user: "root",
      password: "",
      database: 'test'
    })
    mysql.connect().then(() => {
      let conn = mysql.getClient()
      assert.notStrictEqual(conn, null)
      assert.notStrictEqual(conn, undefined)
      done()
    }).catch(err => {
      console.log(err)
      done()
    })
  })
})

describe("向数据库中插入数据", function() {
  let user = new User('123456789', 'wuming', 21)
  it("向user表中插入一条数据", done => {
    mysql
      .insert(user)
      .then(results => {
        assert(results !== undefined)
        done()
      })
      .catch(err => {
        console.log(err)
        assert(false)
        done()
      })
  })

})

describe("数据库更新", function() {
  let user = new User('123456789', 'wumingliang' + (Math.floor(Math.random() * 1000)), 18)
  it("更新数据", done => {
    mysql.update(user, {uid: '123456789'}).then(res => {
      assert(res.affected > 0)
      done()
    })
  })
})

describe("数据库查询", () => {
  it("查询一条数据", done => {
    mysql.findAll(User, {$where:{uid: '123456789'}}).then(res => {
      assert(res.length > 0)
      done()
    }).catch(err => done())
  })

  it("order by查询&模糊查询", done => {
    mysql.findAll(User, {$where:{uid: 'like 123%'}, $orderBy: {column:'uid', op:'asc'}}, ['uid', 'age']).then(res => {
      assert(res.length > 0)
      done()
    })
  })

  it("limit查询&没有where", done => {
    mysql.findAll(User, {$limit:{limit:10}}).then(res => {
      assert(res.length > 0)
      done()
    })
  })
  it("find", done => {
    mysql.find(User, {uid: 123456789}).then(res => {
      assert.strictEqual(res.uid, 123456789)
      done()
    })
  })
})

describe("数据库删除", () => {
  it("删除数据", done => {
    mysql.delete(User, {uid: '123456789'}).then(res => {
      assert(res.affected > 0)
      done()
    })
  })
})
