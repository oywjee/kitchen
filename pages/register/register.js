const auth = require('../../utils/auth')
const cloudSync = require('../../utils/cloudSync')

Page({
  data: {
    username: '',
    email: '',
    password: '',
    password2: ''
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  onPassword2Input(e) {
    this.setData({ password2: e.detail.value })
  },

  async onSubmit() {
    const { username, password, password2, email } = this.data
    if (password !== password2) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }
    const un = username.trim()
    const em = email.trim()
    if (!auth.isValidEmail(em)) {
      wx.showToast({ title: '请输入有效邮箱', icon: 'none' })
      return
    }
    if (cloudSync.canUseCloud()) {
      wx.showLoading({ title: '校验中', mask: true })
      try {
        const ex = await cloudSync.findAccountByUsername(un)
        if (ex) {
          wx.showToast({ title: '用户名已存在', icon: 'none' })
          return
        }
        const exm = await cloudSync.findAccountByEmail(em)
        if (exm) {
          wx.showToast({ title: '该邮箱已被注册', icon: 'none' })
          return
        }
      } catch (e) {
        // 网络异常时仅走本地校验
      } finally {
        wx.hideLoading()
      }
    }
    const res = auth.register(un, password, em)
    if (!res.ok) {
      wx.showToast({ title: res.message, icon: 'none' })
      return
    }
    if (cloudSync.canUseCloud()) {
      try {
        await cloudSync.pushAccountToCloud(auth.getCurrentUser())
      } catch (e) {
        console.warn('register push cloud', e)
      }
    }
    const app = getApp()
    app.refreshTableFromStorage()
    wx.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => {
      wx.navigateBack()
    }, 500)
  }
})
