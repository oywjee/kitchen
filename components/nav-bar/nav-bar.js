Component({
  properties: {
    title: {
      type: String,
      value: '暴富厨房'
    },
    bgColor: {
      type: String,
      value: '#ededed'
    },
    /** 显示左上角返回（如调整菜单子页） */
    showBack: {
      type: Boolean,
      value: false
    },
    /** 非空时用 wx.switchTab 跳转（如 /pages/menu/menu） */
    backSwitchTabUrl: {
      type: String,
      value: ''
    },
    /** 左上角返回按钮文案 */
    backLabel: {
      type: String,
      value: '返回'
    }
  },

  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    padSide: 96
  },

  lifetimes: {
    attached() {
      const menuButton = wx.getMenuButtonBoundingClientRect()
      const sys = wx.getSystemInfoSync()
      const statusBarHeight = sys.statusBarHeight
      const navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height
      const rightGap = sys.windowWidth - menuButton.right
      const padSide = menuButton.width + rightGap
      this.setData({ statusBarHeight, navBarHeight, padSide })
    }
  },

  methods: {
    onBackTap() {
      const url = (this.properties.backSwitchTabUrl || '').trim()
      if (url) {
        const path = url.startsWith('/') ? url : `/${url}`
        wx.switchTab({ url: path })
        return
      }
      wx.navigateBack({
        fail: () => {
          wx.switchTab({ url: '/pages/profile/profile' })
        }
      })
    }
  }
})
