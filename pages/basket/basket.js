const { mergeIngredientsWithSources } = require('../../utils/ingredients')
const emailGuard = require('../../utils/emailGuard')
const storage = require('../../utils/storage')

Page({
  data: {
    items: [],
    empty: true
  },

  onShow() {
    emailGuard.maybePromptBindEmail()
    const app = getApp()
    app.refreshTableFromStorage()
    const tableMenu = app.getTableMenu()
    const items = mergeIngredientsWithSources(tableMenu, storage.getDishes())
    this.setData({
      items,
      empty: !items.length
    })
  }
})
