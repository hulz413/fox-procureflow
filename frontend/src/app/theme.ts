import type { ThemeConfig } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import type { Language } from '../domain/types'

export const antdLocales: Record<Language, typeof zhCN> = {
  zh: zhCN,
  en: enUS,
}

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#2f7a4d',
    colorInfo: '#2f7a4d',
    colorSuccess: '#5b8468',
    colorWarning: '#8f7a45',
    colorError: '#95605c',
    colorText: '#1e2723',
    colorTextSecondary: '#707771',
    colorBgBase: '#f5f6f4',
    colorBgContainer: '#ffffff',
    colorBorder: '#dde2dc',
    borderRadius: 8,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    wireframe: false,
  },
  components: {
    Button: {
      borderRadius: 7,
      controlHeight: 34,
      primaryShadow: 'none',
    },
    Card: {
      borderRadiusLG: 8,
      boxShadowTertiary: 'none',
    },
    Layout: {
      bodyBg: '#f5f6f4',
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Table: {
      headerBg: '#f8f9f7',
      borderColor: '#dde2dc',
    },
    Tag: {
      borderRadiusSM: 12,
    },
  },
}
