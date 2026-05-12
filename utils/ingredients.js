const { isTableItemOffMenu } = require('./tableDishStatus')

function sourceDishLabel(dish, menuDishes) {
  const base = (dish && dish.name) || '未命名菜品'
  if (menuDishes && isTableItemOffMenu(dish, menuDishes)) {
    return `${base}（已下架）`
  }
  return base
}

/**
 * 根据餐桌菜品合并材料份数，并记录每种材料来自哪些菜品
 * @param {Array<{ name?: string, ingredients?: string[], id?: string }>} tableMenu
 * @param {Array<{ id?: string }>} [menuDishes] 当前菜单；传入时来源菜品中会对已下架项标注「已下架」
 * @returns {Array<{ name: string, count: number, sourceText: string }>}
 */
function mergeIngredientsWithSources(tableMenu, menuDishes) {
  const map = {}
  function bump(materialName, dishName) {
    if (!map[materialName]) {
      map[materialName] = { count: 0, byDish: {} }
    }
    map[materialName].count += 1
    map[materialName].byDish[dishName] = (map[materialName].byDish[dishName] || 0) + 1
  }
  ;(tableMenu || []).forEach((dish) => {
    const dishName = sourceDishLabel(dish, menuDishes)
    const list = (dish && dish.ingredients) || []
    list.forEach((raw) => {
      const name = String(raw).trim()
      if (!name) return
      bump(name, dishName)
    })
  })
  return Object.keys(map)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map((name) => {
      const { count, byDish } = map[name]
      const parts = Object.keys(byDish)
        .sort((x, y) => x.localeCompare(y, 'zh-CN'))
        .map((dn) => (byDish[dn] > 1 ? `${dn}（${byDish[dn]}份）` : dn))
      const sourceText = parts.join('、')
      return { name, count, sourceText }
    })
}

/** 仅返回名称与份数（无来源文案） */
function mergeIngredients(tableMenu, menuDishes) {
  return mergeIngredientsWithSources(tableMenu, menuDishes).map(({ name, count }) => ({ name, count }))
}

module.exports = {
  mergeIngredients,
  mergeIngredientsWithSources
}
