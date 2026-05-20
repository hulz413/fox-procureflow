import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { queryClient } from './app/queryClient'
import { workspaceRoutes } from './app/routes'
import { antdLocales, themeConfig } from './app/theme'
import { Workspace } from './app/workspace/Workspace'
import type { Language } from './domain/types'
import { getInitialLanguage } from './i18n/context'

function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const toggleLanguage = () => {
    setLanguage((current) => (current === 'zh' ? 'en' : 'zh'))
  }

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  return (
    <ConfigProvider theme={themeConfig} locale={antdLocales[language]}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {workspaceRoutes.map((route) => (
              <Route
                element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
                key={route}
                path={route}
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  )
}

export default App
