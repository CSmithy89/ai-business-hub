export default class MockIORedis {
  constructor(..._args: any[]) {}
  async eval(_script?: string, _keys?: any, ..._args: any[]) {
    return {}
  }
  async hgetall(_key: string) {
    return {}
  }
  async quit() {
    return 'OK'
  }
  async flushdb() {
    return 'OK'
  }
  async connect() {
    return undefined
  }
}
