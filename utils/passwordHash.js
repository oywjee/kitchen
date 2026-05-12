const { sha256Hex } = require('./sha256')
const { simpleHash } = require('./legacyHash')

/** 应用内统一加盐，仅存储哈希，不存明文密码 */
const PASSWORD_SALT = 'KITCHEN_PWD_SALT_v1|'

function hashPassword(plain) {
  return sha256Hex(PASSWORD_SALT + String(plain))
}

/**
 * 64 位十六进制视为 SHA-256 哈希；否则视为旧版 simpleHash 字符串（兼容老数据）
 */
function verifyPassword(plain, storedHash) {
  if (!storedHash) return false
  if (/^[0-9a-f]{64}$/i.test(storedHash)) {
    return hashPassword(plain) === storedHash.toLowerCase()
  }
  return simpleHash(plain) === storedHash
}

module.exports = {
  PASSWORD_SALT,
  hashPassword,
  verifyPassword
}
