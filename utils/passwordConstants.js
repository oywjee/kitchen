/**
 * 管理员 admin 的密码哈希（SHA-256，与 utils/passwordHash 中盐一致）
 * 源码不包含明文密码；修改管理员密码请重新计算哈希并替换本常量。
 */
module.exports.ADMIN_PASSWORD_SHA256 =
  '2bd3d0622b8b52dd5db870d2236c56a83641215c3d4c794002ae87cba5360388'

module.exports.ADMIN_USER_ID = 'u_admin_kitchen'
module.exports.ADMIN_USERNAME = 'admin'
