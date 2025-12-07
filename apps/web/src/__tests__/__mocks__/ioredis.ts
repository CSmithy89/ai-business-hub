export default class MockIORedis {
  constructor(..._args: any[]) {}
  eval = async () => ({})
  hgetall = async () => ({})
  quit = async () => {}
}
