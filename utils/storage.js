const auth = require('./auth')
const cloudSync = require('./cloudSync')

const KEY_DISHES = 'kitchen_dishes'
const KEY_TABLE_LOCAL = 'kitchen_table_local'

function readUsers() {
  return auth.getUsers()
}

function writeUsers(users) {
  auth.setUsers(users)
}

function getCurrentUserId() {
  return auth.getCurrentUserId()
}

function ensureDefaultDishes() {
  const existing = wx.getStorageSync(KEY_DISHES)
  if (existing && existing.length) return
  const defaults = [
    { id: 'd1', category: '肉类', name: '青椒肉丝', ingredients: ['青椒', '猪肉', '蒜'] },
    { id: 'd2', category: '肉类', name: '红烧肉', ingredients: ['五花肉', '冰糖', '姜'] },
    { id: 'd3', category: '水产', name: '清蒸鲈鱼', ingredients: ['鲈鱼', '葱', '姜'] },
    { id: 'd4', category: '蔬菜', name: '蒜蓉青菜', ingredients: ['青菜', '蒜'] },
    { id: 'd5', category: '汤羹', name: '番茄蛋汤', ingredients: ['番茄', '鸡蛋', '葱'] },
    { id: 'd6', category: '主食', name: '蛋炒饭', ingredients: ['米饭', '鸡蛋', '葱'] }
  ]
  wx.setStorageSync(KEY_DISHES, defaults)
}

function getDishes() {
  ensureDefaultDishes()
  return wx.getStorageSync(KEY_DISHES) || []
}

function setDishes(list) {
  wx.setStorageSync(KEY_DISHES, list)
  if (cloudSync.canUseCloud()) {
    cloudSync.pushDishesToCloud(list).catch(() => {})
  }
}

function getTableMenu() {
  const uid = getCurrentUserId()
  if (!uid) {
    return wx.getStorageSync(KEY_TABLE_LOCAL) || []
  }
  const users = readUsers()
  const u = users.find((x) => x.userId === uid)
  if (!u) {
    return wx.getStorageSync(KEY_TABLE_LOCAL) || []
  }
  return (u && u.tableMenu) ? u.tableMenu.slice() : []
}

function persistUserTable(uid, list) {
  const users = readUsers()
  const idx = users.findIndex((x) => x.userId === uid)
  if (idx === -1) {
    wx.setStorageSync(KEY_TABLE_LOCAL, list.slice())
    return
  }
  users[idx].tableMenu = list.slice()
  writeUsers(users)
}

function setTableMenu(list) {
  const uid = getCurrentUserId()
  if (!uid) {
    wx.setStorageSync(KEY_TABLE_LOCAL, list)
    return
  }
  persistUserTable(uid, list)
  if (cloudSync.canUseCloud()) {
    const u = auth.getCurrentUser()
    if (u) cloudSync.pushAccountToCloud(u).catch(() => {})
  }
}

function clearLocalTable() {
  wx.setStorageSync(KEY_TABLE_LOCAL, [])
}

module.exports = {
  ensureDefaultDishes,
  getDishes,
  setDishes,
  getTableMenu,
  setTableMenu,
  clearLocalTable
}
