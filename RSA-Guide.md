- [Overview](#overview)
- [Authentication](#authentication)
- [API](#api)
  * [Truy vấn thông tin khách hàng](#1-customer-info)
  * [Nạp tiền vào tài khoản](#2-transfer-money)
  * [Trừ tiền vào tài khoản](#2-minus-money)
- [Danh sách các error](#errors)
- [Example Code](#example-code)

# Overview:
Ngân hàng HPK cung cấp các REST API được kết nối qua giao thức HTTP, các thông tin cơ bản:
- Base Endpoint: *BASE_URL/link-api/*.
- Cơ chế hash: *HMAC sha256* với `secret key` là *9yvs4KZJFQMK22tvTvLPhT7K*.
- Cơ chế mã hoá bất đối xứng: *RSA* với `public key` được đặt trong thư mục storages.

Để kết nối với ngân hàng HPK, ngân hàng đối tác cần cung cấp các thông tin sau:
- Secret key: để hash lại gói tin khi cần verify các request đến từ phía đối tác.
- File RSA public key: dùng để verify signature của các request đến từ phía đối tác.

# Authentication:
Request body của tất cả request có dạng như sau:
```js
const data = {
    ts: Number, // Date.now(), thời gian request được tạo ra,
    recvWindow: Number, // set thời gian request hết hạn ở đơn vị milisecond, Default nếu không set là 5000
    ...otherRequestData // Các field bắt buộc còn lại tuỳ theo api sử dụng
}

const body = {
    data: data, // Request data
    hash: String, // Chuỗi hash lại của request data (đã chuyển thành JSON string) bằng secret key của quý đối tác, dùng để verify request không bị thay đổi bởi Man-in-the-middle
    sign: String, // Chuỗi mã hoá rsa/pgp bằng private key của đối tác lên request data (đã chuyển thành JSON string) 
    partnerId: String // Partner Id của đối tác, được cung cấp khi 2 bên liên kết với nhau
}
```

Cách tạo `hash` và `signature (dành cho các request chuyền tiền)`:
- Hash: là chuỗi kí tự được tạo ra bằng cách sử dụng `HMAC Sha256` lên request data:
```js
const crypto = require('crypto')
const SECRET_HMAC = 'partner_secret_key' // Hash secret key của ngân hàng đối tác

// example request data (converted to JSON string)
const data = JSON.stringify({
    ts: Date.now(),
    recvWindow: 5000,
    accountNumber: '1005398'
})

const hmac = crypto.createHmac('sha256', SECRET_HMAC)
hmac.update(data)
const hash = hmac.digest('hex')
```

- Signature: chữ kí số được tạo ra bằng cách sử dụng cơ chế mã hoá `RSA` với cipher là `aes-256-cbc`
```js
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const privateKeyPath = path.join(__dirname, 'fake_private.pem')
const SECRET_RSA = 'partner_rsa_secret_key' // RSA secret key của ngân hàng đối tác
const encoding = 'utf8'
const algorithm = 'SHA256'

const privateKeyString = fs.readFileSync(privateKeyPath, encoding)
const privateKeyOption = {
  type: 'pkcs1',
  format: 'pem',
  cipher: 'aes-256-cbc',
  passphrase: SECRET_RSA,
}
const privateKeyObject = crypto.createPrivateKey({...privateKeyOption, key: privateKeyString})

// example request data (converted to JSON string)
const data = JSON.stringify({
    ts: Date.now(),
    recvWindow: 5000,
    from: 'fake_people',
    fromAccountNumber: '000000123',
    toAccountNumber: '1974550',
    amount: 10000,
    description: 'Chuyển liên ngân hàng...'
})

let buffer = data
if(!Buffer.isBuffer(data)) {
    buffer = Buffer.from(data, encoding)
}
const sign = crypto.sign(algorithm, buffer, privateKeyObject)
```

# API
### 1. Customer Info
Endpoint: `/account`.

Request data bao gồm:
```js
const data = {
    userName: 'customer01', // 1 trong 2 field userName hoặc accountNumber
    accountNumber: '1005398', // 1 trong 2 field userName hoặc accountNumber
    ts: Date.now(),
    recvWindow: 5000,
  }
```

Response body bao gồm:
```js
const response = {
    message: 'OK',
    data: {
        userName: String,
        name: String,
        phone: String,
        accountNumber: String,
    }
}
```

### 2. Transfer money
Endpoint: `/money-transfer/plus`.

Request data bao gồm:
```js
const data = {
    from: 'fake_people',
    fromAccountNumber: '000000123',
    toAccountNumber: '1005398',
    amount: 10000,
    description: 'Chuyển liên ngân hàng...',
    ts: Date.now(),
    recvWindow: 5000,
}
```

Response body bao gồm:
```js
const response = {
    message: 'OK',
    hash: String, // Ngân hàng HPK sẽ hash lại response data và gửi về cho đối tác, đối tác cần sử dụng secret key của HPK cung cấp để verify lại hash bằng response body
    sign: String, // Ngân hàng HPK sẽ tạo signature của response data và gửi về cho đối tác, đối tác cần sử dụng public key của HPK cung cấp để verify lại signature bằng response body
    data: {
        transaction: {
            id: String,
            accountNumber: String, // Số tài khoản người nhận tiền
            amount: 100000, // Số tiền nhận
        },
        ts: Number, // Date.now()
    }
}
```

### 3. Minus money
Endpoint: `/money-transfer/minus`.

Request data bao gồm:
```js
const data = {
    from: 'fake_people',
    fromAccountNumber: '000000123',
    toAccountNumber: '1005398',
    amount: 10000,
    description: 'Trừ tiền liên ngân hàng...',
    ts: Date.now(),
    recvWindow: 5000,
}
```

Response body bao gồm:
```js
const response = {
    message: 'OK',
    hash: String, // Ngân hàng HPK sẽ hash lại response data và gửi về cho đối tác, đối tác cần sử dụng secret key của HPK cung cấp để verify lại hash bằng response body
    sign: String, // Ngân hàng HPK sẽ tạo signature của response data và gửi về cho đối tác, đối tác cần sử dụng public key của HPK cung cấp để verify lại signature bằng response body
    data: {
        transaction: {
            id: String,
            accountNumber: String, // Số tài khoản người bị trừ tiền
            amount: 100000, // Số tiền bị trừ
        },
        ts: Number, // Date.now()
    }
}
```

# ERRORS:
- Nếu trong response body có kèm field `error` thì tức là quá trình handle request đã xảy ra lỗi, ngân hàng đối tác dựa vào danh sách error
 dưới đây để tìm nguyên nhân của lỗi xảy ra ở trên:   
```js
const ERRORS = {
  PARTNER_DOESNT_EXISTS: {
    code: 10001,
    message: 'Partner doesn\'t exits.',
  },
  INVALID_HASH: {
    code: 10002,
    message: 'Invalid body, hash is different with body content.',
  },
  REQUEST_EXPIRED: {
    code: 10003,
    message: 'Request has expired, request timestamp is $1, server ts is $2',
  },
  PUBLIC_KEY_DOESNT_EXISTS: {
    code: 10004,
    message: 'Public key of partner bank doesn\'t exists.',
  },
  INVALID_SIGNATURE: {
    code: 10005,
    message: 'Invalid signature.',
  },
  INVALID_REQUEST_BODY: {
    code: 20001,
    message: 'Invalid request body.',
  },
  ACCOUNT_DOESNT_EXISTS: {
    code: 20002,
    message: 'Account doesn\'t exits.',
  },
  BALANCE_DOESNT_ENOUGH: {
    code: 20003,
    message: 'balance doesn\'t enough to exec this transaction.',
  },
  UNKNOWN: {
    code: 99999,
    message: 'UNKNOWN ERROR.',
  }
}
```

# Example Code
Code mẫu nằm trong folder [example](https://github.com/DangNhuHuynh/LTHD-API-Document/tree/master/example), ngân hàng đối tác có thể sử dụng để tham khảo (hoặc sử dụng luôn) để implement phần liên kết API với ngân hàng HPK.
```bash
cd example
npm install

# Get customer info
node fake-fetch-link-account.js

# Transfer money (plus money)
node fake-plus-money.js

# Transfer money (minus money)
fake-minus-money.js
```
