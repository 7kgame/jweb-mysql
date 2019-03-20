import { createPool, Pool, PoolConnection } from 'mysql'

const defaultOptions = {
  host: '127.0.0.1',
  port: 3306,
  user: '',
  password: '',
  connectionLimit: require('os').cpus().length
}

export default class MysqlDao {

  private options = {}
  private pool: Pool
  private connection: PoolConnection

  constructor (options) {
    if ( !options ) {
      throw new Error('mysql config options is missing')
    }
    for (let k in defaultOptions) {
      if ( typeof options[k] !== 'undefined' ) {
        this.options[k] = options[k]
      } else {
        this.options[k] = defaultOptions[k]
      }
    }
  }

  private getConnection(): Promise<PoolConnection> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection(function(err, conn) {
        if ( err ) {
          return reject(err)
        }
        if ( conn ) {
          return resolve(conn)
        }
      })
    })
  }

  public async connect (): Promise<PoolConnection> {
    if ( !this.options ) {
      throw new Error('database config options is missing')
    }
    if ( !this.pool ) {
      this.pool = createPool(this.options)
    }
    this.connection = await this.getConnection()
    return this.connection
  }

  public getClient (): PoolConnection {
    return this.connection
  }

  public async disconnect (): Promise<void> {
    if ( this.pool ) {
      await this.pool.end()
    }
  }
}
