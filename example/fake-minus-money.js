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

  const jsonResponseData = JSON.stringify(result.data)
  const verifySignResult = common.verifySign(jsonResponseData, result.sign)
  const verifyHashResult = common.verifyHash(result.hash, common.hash(jsonResponseData, common.LINK_SECRET_HMAC))

  if (verifySignResult && verifyHashResult) {
    console.log('OK.')
    return
  }

  console.log('Verify fail.')
}

run()
