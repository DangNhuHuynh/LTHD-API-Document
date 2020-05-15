const common = require('./common')

async function run() {
  const data = {
    from: 'fake_people',
    fromAccountNumber: '000000123',
    toAccountNumber: '1974550',
    amount: 10000,
    description: 'Chuyển liên ngân hàng...'
  }
  const result = await common.createRequestWithSignature({ endpoint: 'money-transfer/minus', data })

  console.log('======RESPONSE======')
  console.log(result)

  // TODO: verify hash & signature of response use HPK Secret Key & HPK RSA Public Key
}

run()
