const emailGuard = require('../../utils/emailGuard')
const storage = require('../../utils/storage')
const auth = require('../../utils/auth')
const { decorateTableMenuForDisplay } = require('../../utils/tableDishStatus')

Page({
  data: {
    tableMenu: []
  },

  syncTableView() {
    const app = getApp()
    app.refreshTableFromStorage()
    const raw = app.getTableMenu()
    this.setData({
      tableMenu: decorateTableMenuForDisplay(raw, storage.getDishes())
    })
  },

  onShow() {
    emailGuard.maybePromptBindEmail()
    this.syncTableView()
  },

  async onRefreshTable() {
    wx.showLoading({ title: '同步中', mask: true })
    try {
      let cloudResult = { ok: true, updated: false, message: '' }
      if (auth.getCurrentUserId()) {
        cloudResult = await auth.refreshCurrentUserTableFromCloud()
      }
      wx.hideLoading()
      if (!cloudResult.ok) {
        wx.showToast({ title: cloudResult.message || '刷新失败', icon: 'none' })
        return
      }
      this.syncTableView()
      let title = '已刷新'
      if (auth.getCurrentUserId()) {
        if (cloudResult.message === '未开启云开发') {
          title = '已刷新本地餐桌'
        } else {
          title = cloudResult.updated ? '已从云端同步' : '餐桌已是最新'
        }
      }
      wx.showToast({ title, icon: 'none' })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '刷新失败', icon: 'none' })
    }
  },

  onRemove(e) {
    const { index } = e.currentTarget.dataset
    const app = getApp()
    const list = app.getTableMenu().slice()
    list.splice(index, 1)
    app.setTableMenu(list)
    this.setData({
      tableMenu: decorateTableMenuForDisplay(list, storage.getDishes())
    })
  },

  onClearAll() {
    wx.showModal({
      title: '清空餐桌',
      content: '确定要清空餐桌上的所有菜品吗？',
      confirmText: '清空',
      confirmColor: '#fa5151',
      success: (res) => {
        if (!res.confirm) return
        const app = getApp()
        app.setTableMenu([])
        this.setData({ tableMenu: decorateTableMenuForDisplay([], storage.getDishes()) })
        wx.showToast({ title: '已清空', icon: 'none' })
      }
    })
  }
})
