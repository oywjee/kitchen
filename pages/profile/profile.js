const auth = require('../../utils/auth')
const emailGuard = require('../../utils/emailGuard')

Page({
  data: {
    loggedIn: false,
    username: '',
    password: '',
    userEmail: ''
  },

  onShow() {
    this.syncLoginState()
    emailGuard.maybePromptBindEmail()
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  syncLoginState() {
    const u = auth.getCurrentUser()
    const email = u && auth.isValidEmail(u.email) ? u.email : ''
    this.setData({
      loggedIn: !!u,
      username: u ? u.username : '',
      password: '',
      userEmail: email
    })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  async onLogin() {
    const { username, password } = this.data
    wx.showLoading({ title: '登录中', mask: true })
    try {
      const res = await auth.attemptLogin(username, password)
      if (!res.ok) {
        wx.showToast({ title: res.message, icon: 'none' })
        return
      }
      const app = getApp()
      app.refreshTableFromStorage()
      this.syncLoginState()
      wx.showToast({ title: '登录成功', icon: 'success' })
    } finally {
      wx.hideLoading()
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },

  goForgot() {
    wx.navigateTo({ url: '/pages/forgot-password/forgot-password' })
  },

  goBindEmail() {
    wx.navigateTo({ url: '/pages/bind-email/bind-email' })
  },

  onLogout() {
    auth.logout()
    const app = getApp()
    app.refreshTableFromStorage()
    this.syncLoginState()
    wx.showToast({ title: '已退出', icon: 'none' })
  }
})
