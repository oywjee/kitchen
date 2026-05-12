/** 旧版密码摘要（仅兼容已存在用户，新用户请使用 passwordHash.hashPassword） */
function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return 'h' + String(h)
}

module.exports = {
  simpleHash
}
