/**
 * 判断餐桌上的条目是否仍存在于当前菜单（按 id 对齐；无 id 的旧数据视为未下架）
 */
function isTableItemOffMenu(tableItem, menuDishes) {
  if (!tableItem || !tableItem.id) return false
  if (!Array.isArray(menuDishes)) return false
  return !menuDishes.some((d) => d && d.id === tableItem.id)
}

function decorateTableMenuForDisplay(tableMenu, menuDishes) {
  return (tableMenu || []).map((item) => ({
    ...item,
    delisted: isTableItemOffMenu(item, menuDishes)
  }))
}

module.exports = {
  isTableItemOffMenu,
  decorateTableMenuForDisplay
}
