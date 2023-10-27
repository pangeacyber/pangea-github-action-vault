const process = require('process');
const crypto = require('crypto');

test('test secret is valid', () => {
  // console.log("test secret" + process.env["TEST_SECRET"])
  expect(hashSecret(process.env["TEST_SECRET"])).toBe('70aa52f6b66745c785e81c9714a504a9abbd86b173ff1ec51eacdae37c3c8e7526f37737dad12d491d81dbf59cd74077da7ec08baf4e445bbaa80b14afb250d9')
})

const hashSecret = (secret) => {
  let hash = crypto.createHash('sha512')
  return hash.update(secret).digest('hex')
}