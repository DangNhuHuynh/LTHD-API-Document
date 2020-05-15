const common = require('./common')

async function run() {
  const data = {
    userName: 'customer01',
    // accountNumber: '1005398'
  }
  const result = await common.createRequestWithHashing({ endpoint: 'account', data })

  console.log('======RESPONSE======')
  console.log(result)
}

run()
