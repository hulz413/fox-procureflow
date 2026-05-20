import type { Language, DemoContext } from '../domain/types'

const englishContext = {
  groupName: 'Xinghe Holdings Group',
  supplierPoolScope: 'Group Shared Supplier Pool',
  companyNames: {
    'company-digital': 'Xinghe Digital Technology Co., Ltd.',
    'company-manufacturing': 'Xinghe Intelligent Manufacturing Co., Ltd.',
  },
  companyScopes: {
    'company-digital': 'IT equipment, software subscriptions, office procurement',
    'company-manufacturing': 'Production consumables, equipment spare parts, logistics services',
  },
  dataBoundary: {
    groupShared: 'Supplier pool, category templates, group-level dashboard summaries',
    companyIsolated: 'Requests, approvals, RFQs, POs, receiving, invoices, and matching results',
  },
} as const

export function localizeContext(context: DemoContext, language: Language): DemoContext {
  if (language === 'zh') {
    return context
  }

  const companies = context.companies.map((company) => ({
    ...company,
    companyName:
      englishContext.companyNames[company.companyId as keyof typeof englishContext.companyNames] ??
      company.companyName,
    businessScope:
      englishContext.companyScopes[company.companyId as keyof typeof englishContext.companyScopes] ??
      company.businessScope,
  }))
  const activeCompany =
    companies.find((company) => company.companyId === context.activeCompany.companyId) ??
    companies[0] ??
    context.activeCompany

  return {
    ...context,
    groupName: englishContext.groupName,
    activeCompany,
    companies,
    supplierPoolScope: englishContext.supplierPoolScope,
    dataBoundary: englishContext.dataBoundary,
  }
}

export function getInitialLanguage(): Language {
  return new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'zh'
}
