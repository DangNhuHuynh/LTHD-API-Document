const fetch = require('node-fetch')
const querystring = require('querystring')

async function _jsonResponse(promise) {
  const response = await promise
  return response.json()
}

function commonJsonHeader() {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

async function request({ url, method, headers, body }) {
  const mergedHeaders = { ...commonJsonHeader(), ...(headers || {}) }

  let response
  if (!method || method === 'GET') {
    if (body) {
      url = url + '?' + querystring.stringify(body || {})
    }
    response = fetch(url, { headers: mergedHeaders })
  } else {
    response = fetch(url, {
      body: JSON.stringify(body),
      method,
      headers: mergedHeaders,
    })
  }
  return _jsonResponse(response)
}

module.exports = {
  request,
}
