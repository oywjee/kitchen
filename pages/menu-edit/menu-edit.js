const storage = require('../../utils/storage')
const auth = require('../../utils/auth')
const emailGuard = require('../../utils/emailGuard')

function groupDishes(dishes) {
  const map = {}
  dishes.forEach((d) => {
    if (!map[d.category]) map[d.category] = []
    map[d.category].push(d)
  })
  return Object.keys(map)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map((category) => ({ category, list: map[category] }))
}

Page({
  data: {
    sections: [],
    formOpen: false,
    categoryOptions: [],
    categoryIndex: 0,
    newCategory: '',
    dishName: '',
    ingredientsText: ''
  },

  onShow() {
    if (!auth.isMenuAdmin()) {
      wx.showToast({ title: '仅管理员可调整菜单', icon: 'none' })
      wx.navigateBack({
        fail: () => wx.switchTab({ url: '/pages/menu/menu' })
      })
      return
    }
    emailGuard.maybePromptBindEmail()
    this.refresh()
  },

  refresh() {
    const dishes = storage.getDishes()
    const sections = groupDishes(dishes)
    const catSet = {}
    dishes.forEach((d) => {
      catSet[d.category] = true
    })
    const categoryOptions = Object.keys(catSet).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    const opts = categoryOptions.length ? categoryOptions.concat(['— 新建类别 —']) : ['— 新建类别 —']
    this.setData({
      sections,
      categoryOptions: opts,
      categoryIndex: Math.min(this.data.categoryIndex, Math.max(0, opts.length - 1))
    })
  },

  onDelete(e) {
    const { id } = e.currentTarget.dataset
    const dishes = storage.getDishes().filter((d) => d.id !== id)
    storage.setDishes(dishes)
    this.refresh()
    wx.showToast({ title: '已删除', icon: 'none' })
  },

  toggleForm() {
    this.setData({ formOpen: !this.data.formOpen })
  },

  onCategoryPick(e) {
    this.setData({ categoryIndex: Number(e.detail.value) })
  },

  onNewCategoryInput(e) {
    this.setData({ newCategory: e.detail.value })
  },

  onNameInput(e) {
    this.setData({ dishName: e.detail.value })
  },

  onIngredientsInput(e) {
    this.setData({ ingredientsText: e.detail.value })
  },

  onSaveNew() {
    const { categoryOptions, categoryIndex, newCategory, dishName, ingredientsText } = this.data
    const lastLabel = '— 新建类别 —'
    const picked = categoryOptions[categoryIndex]
    let category = ''
    if (picked === lastLabel) {
      category = (newCategory || '').trim()
    } else {
      category = (picked || '').trim()
    }
    const name = (dishName || '').trim()
    if (!category) {
      wx.showToast({ title: '请填写类别', icon: 'none' })
      return
    }
    if (!name) {
      wx.showToast({ title: '请填写菜品名称', icon: 'none' })
      return
    }
    const ingredients = ingredientsText
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const dishes = storage.getDishes().slice()
    dishes.push({
      id: 'd_' + Date.now(),
      category,
      name,
      ingredients
    })
    storage.setDishes(dishes)
    this.setData({
      formOpen: false,
      newCategory: '',
      dishName: '',
      ingredientsText: ''
    })
    this.refresh()
    wx.showToast({ title: '已保存', icon: 'success' })
  }
})
