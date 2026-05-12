const auth = require('./auth')

/**
 * 已登录但未绑定邮箱时，跳转补绑页（避免栈内重复打开）
 */
function maybePromptBindEmail() {
  if (!auth.getCurrentUserId()) return
  if (!auth.needsEmailBind()) return
  const pages = getCurrentPages()
  const hasBind = pages.some((p) => p.route && p.route.indexOf('bind-email') !== -1)
  if (hasBind) return
  wx.navigateTo({ url: '/pages/bind-email/bind-email' })
}

module.exports = {
  maybePromptBindEmail
}
