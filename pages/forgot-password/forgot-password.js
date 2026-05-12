const auth = require('../../utils/auth')

Page({
  data: {
    username: '',
    email: ''
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value })
  },

  onVerify() {
    const res = auth.verifyUserEmailForRecovery(this.data.username, this.data.email)
    if (!res.ok) {
      wx.showToast({ title: res.message, icon: 'none' })
      return
    }
    wx.showModal({
      title: '验证通过',
      content: res.message,
      showCancel: false
    })
  }
})
