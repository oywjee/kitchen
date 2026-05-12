const storage = require('../../utils/storage')
const auth = require('../../utils/auth')
const emailGuard = require('../../utils/emailGuard')

Page({
  data: {
    categories: [],
    selectedCategory: '',
    dishesInCategory: [],
    canEditMenu: false
  },

  onShow() {
    emailGuard.maybePromptBindEmail()
    this.setData({ canEditMenu: auth.isMenuAdmin() })
    this.loadMenu()
  },

  loadMenu() {
    const dishes = storage.getDishes()
    const catSet = {}
    dishes.forEach((d) => {
      catSet[d.category] = true
    })
    const categories = Object.keys(catSet).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    const selectedCategory =
      this.data.selectedCategory && categories.includes(this.data.selectedCategory)
        ? this.data.selectedCategory
        : categories[0] || ''
    const dishesInCategory = dishes.filter((d) => d.category === selectedCategory)
    this.setData({ categories, selectedCategory, dishesInCategory })
  },

  onSelectCategory(e) {
    const { category } = e.currentTarget.dataset
    const dishes = storage.getDishes()
    const dishesInCategory = dishes.filter((d) => d.category === category)
    this.setData({ selectedCategory: category, dishesInCategory })
  },

  onAddDishToTable(e) {
    const { id } = e.currentTarget.dataset
    const dishes = storage.getDishes()
    const dish = dishes.find((d) => d.id === id)
    if (!dish) return
    const app = getApp()
    const list = app.getTableMenu().slice()
    list.push({
      id: dish.id,
      category: dish.category,
      name: dish.name,
      ingredients: (dish.ingredients || []).slice()
    })
    app.setTableMenu(list)
    wx.showToast({ title: '已加入餐桌', icon: 'success', duration: 1500 })
  },

  goMenuEdit() {
    if (!auth.isMenuAdmin()) {
      wx.showToast({ title: '仅管理员可调整菜单', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/menu-edit/menu-edit' })
  }
})
