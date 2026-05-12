const storage = require('./utils/storage')
const cloudSync = require('./utils/cloudSync')

App({
  globalData: {
    tableMenu: []
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true
      })
    }
    storage.ensureDefaultDishes()
    const auth = require('./utils/auth')
    auth.ensureAdminAccount()
    if (cloudSync.canUseCloud()) {
      // 延后到首帧后，减轻与首屏渲染争用；超时逻辑在 cloudSync 内
      wx.nextTick(() => {
        cloudSync.bootstrapFromCloud().catch(() => {})
      })
    }
    this.refreshTableFromStorage()
  },

  refreshTableFromStorage() {
    this.globalData.tableMenu = storage.getTableMenu()
  },

  getTableMenu() {
    return this.globalData.tableMenu
  },

  setTableMenu(list) {
    this.globalData.tableMenu = list.slice()
    storage.setTableMenu(this.globalData.tableMenu)
  }
})
