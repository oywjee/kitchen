const { simpleHash } = require('./legacyHash')
const { hashPassword, verifyPassword } = require('./passwordHash')
const {
  ADMIN_PASSWORD_SHA256,
  ADMIN_USER_ID,
  ADMIN_USERNAME
} = require('./passwordConstants')

const KEY_USERS = 'kitchen_users'
const KEY_CURRENT_USER = 'kitchen_current_user_id'

function isValidEmail(str) {
  const s = (str || '').trim()
  if (!s || s.length > 120) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function getUsers() {
  return wx.getStorageSync(KEY_USERS) || []
}

function setUsers(users) {
  wx.setStorageSync(KEY_USERS, users)
}

function getCurrentUserId() {
  return wx.getStorageSync(KEY_CURRENT_USER) || ''
}

function setCurrentUserId(userId) {
  if (userId) {
    wx.setStorageSync(KEY_CURRENT_USER, userId)
  } else {
    wx.removeStorageSync(KEY_CURRENT_USER)
  }
}

function findUserByName(username) {
  return getUsers().find((u) => u.username === username)
}

function findUserByEmail(email) {
  const e = (email || '').trim().toLowerCase()
  if (!e) return null
  return getUsers().find((u) => ((u.email || '').trim().toLowerCase() === e))
}

/** 保证存在固定管理员账号（密码仅为哈希，与 passwordConstants 一致） */
function ensureAdminAccount() {
  const users = getUsers()
  const prev = users.find((u) => u.username === ADMIN_USERNAME)
  const tableMenu = prev && Array.isArray(prev.tableMenu) ? prev.tableMenu.slice() : []
  const without = users.filter((u) => u.username !== ADMIN_USERNAME)
  without.push({
    userId: ADMIN_USER_ID,
    username: ADMIN_USERNAME,
    passwordHash: ADMIN_PASSWORD_SHA256,
    email: (prev && prev.email && isValidEmail(prev.email)) ? prev.email.trim().toLowerCase() : 'admin@reserved.local',
    tableMenu
  })
  setUsers(without)
}

function isMenuAdmin() {
  const u = getCurrentUser()
  return !!(u && u.username === ADMIN_USERNAME)
}

/** 非管理员且未绑定有效邮箱时需补绑 */
function needsEmailBind() {
  const u = getCurrentUser()
  if (!u) return false
  if (u.username === ADMIN_USERNAME) return false
  return !isValidEmail(u.email)
}

function register(username, password, email) {
  username = (username || '').trim()
  email = (email || '').trim()
  if (!username || !password) {
    return { ok: false, message: '请输入用户名和密码' }
  }
  if (!isValidEmail(email)) {
    return { ok: false, message: '请输入有效邮箱' }
  }
  const emailNorm = email.toLowerCase()
  if (findUserByEmail(emailNorm)) {
    return { ok: false, message: '该邮箱已被注册' }
  }
  if (username.toLowerCase() === ADMIN_USERNAME) {
    return { ok: false, message: '该用户名为系统保留' }
  }
  if (findUserByName(username)) {
    return { ok: false, message: '用户名已存在' }
  }
  const userId = 'u_' + Date.now()
  const users = getUsers()
  users.push({
    userId,
    username,
    email: emailNorm,
    passwordHash: hashPassword(password),
    tableMenu: []
  })
  setUsers(users)
  setCurrentUserId(userId)
  return { ok: true, userId }
}

function updateUserEmail(email) {
  const uid = getCurrentUserId()
  if (!uid) return { ok: false, message: '未登录' }
  if (!isValidEmail(email)) {
    return { ok: false, message: '请输入有效邮箱' }
  }
  const emailNorm = email.trim().toLowerCase()
  const other = findUserByEmail(emailNorm)
  if (other && other.userId !== uid) {
    return { ok: false, message: '该邮箱已被其他账号使用' }
  }
  const users = getUsers()
  const idx = users.findIndex((x) => x.userId === uid)
  if (idx === -1) return { ok: false, message: '用户数据异常' }
  users[idx].email = emailNorm
  setUsers(users)
  const cloudSync = require('./cloudSync')
  if (cloudSync.canUseCloud()) {
    cloudSync.pushAccountToCloud(users[idx]).catch(() => {})
  }
  return { ok: true }
}

function login(username, password) {
  username = (username || '').trim()
  const u = findUserByName(username)
  if (!u || !verifyPassword(password, u.passwordHash)) {
    return { ok: false, message: '用户名或密码错误' }
  }
  setCurrentUserId(u.userId)
  return { ok: true, userId: u.userId, username: u.username }
}

function mergeOrAddUserFromCloud(remote) {
  const users = getUsers()
  const row = {
    userId: remote.userId,
    username: remote.username,
    passwordHash: remote.passwordHash,
    email: (remote.email && String(remote.email).trim()) || '',
    tableMenu: Array.isArray(remote.tableMenu) ? remote.tableMenu.slice() : []
  }
  const idx = users.findIndex((x) => x.userId === row.userId)
  if (idx >= 0) users[idx] = row
  else users.push(row)
  setUsers(users)
}

/**
 * 登录：先校验本地；支持从云端拉取餐桌并以云端为准；支持仅云端注册过的账号换机登录
 */
async function attemptLogin(username, password) {
  username = (username || '').trim()
  if (!username || !password) {
    return { ok: false, message: '请输入用户名和密码' }
  }
  const cloudSync = require('./cloudSync')

  const local = findUserByName(username)
  if (local && verifyPassword(password, local.passwordHash)) {
    setCurrentUserId(local.userId)
    if (cloudSync.canUseCloud()) {
      try {
        const remote = await cloudSync.getAccountByUserId(local.userId)
        if (remote && Array.isArray(remote.tableMenu)) {
          const users = getUsers()
          const idx = users.findIndex((x) => x.userId === local.userId)
          if (idx >= 0) {
            users[idx].tableMenu = remote.tableMenu.slice()
            if (remote.email) users[idx].email = String(remote.email).trim().toLowerCase()
            setUsers(users)
          }
        } else {
          const u2 = getUsers().find((x) => x.userId === local.userId)
          if (u2) await cloudSync.pushAccountToCloud(u2)
        }
      } catch (e) {
        console.warn('attemptLogin cloud pull', e)
      }
    }
    return { ok: true, userId: local.userId, username: local.username }
  }

  if (cloudSync.canUseCloud()) {
    try {
      const remote = await cloudSync.findAccountByUsername(username)
      if (remote && verifyPassword(password, remote.passwordHash)) {
        mergeOrAddUserFromCloud(remote)
        setCurrentUserId(remote.userId)
        return { ok: true, userId: remote.userId, username: remote.username }
      }
    } catch (e) {
      console.warn('attemptLogin cloud', e)
    }
  }

  return { ok: false, message: '用户名或密码错误' }
}

/**
 * 从云端拉取当前登录用户的餐桌并写入本地（多设备同账号时用于同步）
 */
async function refreshCurrentUserTableFromCloud() {
  const uid = getCurrentUserId()
  if (!uid) return { ok: false, message: '未登录' }
  const cloudSync = require('./cloudSync')
  if (!cloudSync.canUseCloud()) {
    return { ok: true, updated: false, message: '未开启云开发' }
  }
  try {
    const remote = await cloudSync.getAccountByUserId(uid)
    if (remote && Array.isArray(remote.tableMenu)) {
      const users = getUsers()
      const idx = users.findIndex((x) => x.userId === uid)
      if (idx >= 0) {
        users[idx].tableMenu = remote.tableMenu.slice()
        if (remote.email) users[idx].email = String(remote.email).trim().toLowerCase()
        setUsers(users)
        return { ok: true, updated: true }
      }
    }
  } catch (e) {
    console.warn('refreshCurrentUserTableFromCloud', e)
    return { ok: false, message: '网络异常，请稍后重试' }
  }
  return { ok: true, updated: false }
}

function logout() {
  setCurrentUserId('')
}

function getCurrentUser() {
  const uid = getCurrentUserId()
  if (!uid) return null
  return getUsers().find((x) => x.userId === uid) || null
}

/** 忘记密码：校验用户名与已绑定邮箱是否一致（不重置密码，需管理员或后续邮件能力） */
function verifyUserEmailForRecovery(username, email) {
  const u = findUserByName((username || '').trim())
  if (!u) return { ok: false, message: '用户不存在' }
  if (!isValidEmail(email)) return { ok: false, message: '邮箱格式不正确' }
  const mine = (u.email || '').trim().toLowerCase()
  if (!mine) return { ok: false, message: '该账号未绑定邮箱，请先登录补绑' }
  if (mine !== email.trim().toLowerCase()) return { ok: false, message: '用户名与绑定邮箱不匹配' }
  return { ok: true, message: '信息已验证，请联系管理员重置密码或使用后续邮件找回功能' }
}

module.exports = {
  getUsers,
  setUsers,
  getCurrentUserId,
  setCurrentUserId,
  register,
  login,
  attemptLogin,
  refreshCurrentUserTableFromCloud,
  logout,
  getCurrentUser,
  ensureAdminAccount,
  isMenuAdmin,
  needsEmailBind,
  updateUserEmail,
  isValidEmail,
  verifyUserEmailForRecovery,
  findUserByEmail,
  simpleHash
}
