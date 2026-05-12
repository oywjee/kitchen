const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async () => {
  return { ok: true, message: '云函数占位，可在开发者工具中上传部署' }
}
