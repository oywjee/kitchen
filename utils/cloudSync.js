/**
 * 云数据库同步（需在开发者工具中开通云开发并关联环境）
 *
 * 集合说明：
 * - kitchen_dishes：文档 id 为 default，字段 { dishes: Array, updatedAt }
 * - kitchen_accounts：文档 id 为 userId，字段 { userId, username, email, passwordHash, tableMenu, updatedAt }
 *
 * 控制台「数据库」→ 新建以上集合 →「权限设置」可先设为「所有用户可读、仅创建者可读写」
 * 若多端共享同一家庭数据，可改为「所有用户可读可写」（仅限可信环境）。
 * 为按用户名 / 邮箱查询，请在 kitchen_accounts 对 username、email 建索引。
 */

const COL_DISHES = 'kitchen_dishes'
const COL_ACCOUNTS = 'kitchen_accounts'
const DOC_DEFAULT = 'default'
const KEY_DISHES = 'kitchen_dishes'

function db() {
  return wx.cloud.database()
}

function canUseCloud() {
  return !!(wx.cloud && typeof wx.cloud.database === 'function')
}

function getAccountDoc(userId) {
  return db().collection(COL_ACCOUNTS).doc(userId)
}

function getDishesDoc() {
  return db().collection(COL_DISHES).doc(DOC_DEFAULT)
}

async function findAccountByUsername(username) {
  if (!canUseCloud() || !username) return null
  const res = await db()
    .collection(COL_ACCOUNTS)
    .where({ username })
    .limit(1)
    .get()
  const row = res.data && res.data[0]
  if (!row) return null
  return {
    userId: row.userId,
    username: row.username,
    email: row.email ? String(row.email).trim().toLowerCase() : '',
    passwordHash: row.passwordHash,
    tableMenu: Array.isArray(row.tableMenu) ? row.tableMenu : []
  }
}

async function findAccountByEmail(email) {
  if (!canUseCloud() || !email) return null
  const e = String(email).trim().toLowerCase()
  if (!e) return null
  const res = await db()
    .collection(COL_ACCOUNTS)
    .where({ email: e })
    .limit(1)
    .get()
  const row = res.data && res.data[0]
  if (!row) return null
  return {
    userId: row.userId,
    username: row.username,
    email: row.email ? String(row.email).trim().toLowerCase() : '',
    passwordHash: row.passwordHash,
    tableMenu: Array.isArray(row.tableMenu) ? row.tableMenu : []
  }
}

async function getAccountByUserId(userId) {
  if (!canUseCloud() || !userId) return null
  try {
    const res = await getAccountDoc(userId).get()
    const row = res.data
    if (!row || !row.userId) return null
    return {
      userId: row.userId,
      username: row.username,
      email: row.email ? String(row.email).trim().toLowerCase() : '',
      passwordHash: row.passwordHash,
      tableMenu: Array.isArray(row.tableMenu) ? row.tableMenu : []
    }
  } catch (e) {
    return null
  }
}

async function pushAccountToCloud(user) {
  if (!canUseCloud() || !user || !user.userId) return
  const data = {
    userId: user.userId,
    username: user.username,
    email: (user.email && String(user.email).trim().toLowerCase()) || '',
    passwordHash: user.passwordHash,
    tableMenu: user.tableMenu || [],
    updatedAt: wx.cloud.database().serverDate()
  }
  await getAccountDoc(user.userId).set({ data })
}

async function pushDishesToCloud(dishes) {
  if (!canUseCloud() || !Array.isArray(dishes)) return
  await getDishesDoc().set({
    data: {
      dishes,
      updatedAt: wx.cloud.database().serverDate()
    }
  })
}

const BOOTSTRAP_TIMEOUT_MS = 8000

function raceTimeout(ms, promise) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      }
    )
  })
}

/**
 * 启动时：优先从云端拉取菜单；云端无数据则上传本地默认菜单
 * 整体加超时，避免未开通云开发或网络异常时长时间阻塞触发框架 timeout
 */
async function bootstrapFromCloud() {
  if (!canUseCloud()) return
  try {
    await raceTimeout(BOOTSTRAP_TIMEOUT_MS, bootstrapFromCloudInner())
  } catch (e) {
    const msg = e && e.message ? String(e.message) : ''
    if (msg === 'timeout') {
      console.warn('bootstrapFromCloud: 超时，已跳过云端同步，使用本地数据')
    } else {
      console.warn('bootstrapFromCloud', e)
    }
  }
}

async function bootstrapFromCloudInner() {
  try {
    const res = await getDishesDoc().get()
    const list = res.data && res.data.dishes
    if (Array.isArray(list) && list.length > 0) {
      wx.setStorageSync(KEY_DISHES, list)
      return
    }
  } catch (e) {
    // 文档不存在等情况，走下方上传
  }
  const local = wx.getStorageSync(KEY_DISHES)
  const dishes = Array.isArray(local) && local.length ? local : []
  if (!dishes.length) return
  try {
    await pushDishesToCloud(dishes)
  } catch (e) {
    console.warn('pushDishesToCloud', e)
  }
}

module.exports = {
  canUseCloud,
  COL_DISHES,
  COL_ACCOUNTS,
  findAccountByUsername,
  findAccountByEmail,
  getAccountByUserId,
  pushAccountToCloud,
  pushDishesToCloud,
  bootstrapFromCloud
}
