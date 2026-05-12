const auth = require('../../utils/auth')

Page({
  data: {
    email: ''
  },

  onLoad() {
    if (!auth.getCurrentUserId()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => wx.switchTab({ url: '/pages/profile/profile' }), 600)
    }
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value })
  },

  onSubmit() {
    const res = auth.updateUserEmail(this.data.email)
    if (!res.ok) {
      wx.showToast({ title: res.message, icon: 'none' })
      return
    }
    wx.showToast({ title: '绑定成功', icon: 'success' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/menu/menu' })
    }, 400)
  }
})
