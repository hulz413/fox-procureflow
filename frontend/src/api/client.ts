import type { ApiEnvelope, HealthEnvelope, DemoDataResetResult, DemoContext, CompanyContext, DepartmentSummary, UserSummary, CategorySummary, SupplierSummary, BudgetAccountSummary, ApprovalTask, ApprovalDetail, ApprovalActionPayload, PurchaseRequestListItem, PurchaseRequestDetail, CreatePurchaseRequestDraftPayload, RfqQuote, RfqListItem, RfqDetail, RfqComparisonRow, CreateRfqPayload, UpsertRfqQuotePayload, UploadedAttachment, PurchaseOrderListItem, PurchaseOrderDetail, CreatePurchaseOrderPayload, PurchaseOrderActionPayload, CancelPurchaseOrderPayload, ThreeWayMatchStatus, ProcurementDashboardScope, ProcurementDashboard, GlobalSearchResponse, FulfillmentPurchaseOrder, ReceiptListItem, InvoiceListItem, CreateReceiptPayload, CreateInvoicePayload, ThreeWayMatchListItem, ThreeWayMatchDetail, RecalculateMatchPayload, HandleMatchActionPayload, AiAssistantResponse } from '../domain/types'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export async function fetchApi<T>(path: string): Promise<ApiEnvelope<T>> {
  return requestApi<T>(path)
}

async function requestApi<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
    ...init,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message =
      errorBody && typeof errorBody.message === 'string'
        ? errorBody.message
        : `Request failed with ${response.status}`
    throw new Error(message)
  }

  return response.json() as Promise<ApiEnvelope<T>>
}

async function postApi<T>(path: string, body?: unknown): Promise<ApiEnvelope<T>> {
  return requestApi<T>(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    method: 'POST',
  })
}

async function putApi<T>(path: string, body?: unknown): Promise<ApiEnvelope<T>> {
  return requestApi<T>(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    method: 'PUT',
  })
}

export async function fetchHealth(): Promise<HealthEnvelope> {
  return fetchApi('/api/health')
}

export async function fetchMasterDataContext() {
  return fetchApi<DemoContext>('/api/master-data/context')
}

export async function fetchCompanies() {
  return fetchApi<CompanyContext[]>('/api/master-data/companies')
}

export async function fetchDepartments(companyId: string) {
  return fetchApi<DepartmentSummary[]>(`/api/master-data/companies/${companyId}/departments`)
}

export async function fetchUsers(companyId: string) {
  return fetchApi<UserSummary[]>(`/api/master-data/companies/${companyId}/users`)
}

export async function fetchSuppliers() {
  return fetchApi<SupplierSummary[]>('/api/master-data/suppliers')
}

export async function fetchCategories() {
  return fetchApi<CategorySummary[]>('/api/master-data/categories')
}

export async function fetchBudgetAccounts(companyId: string) {
  return fetchApi<BudgetAccountSummary[]>(`/api/master-data/companies/${companyId}/budget-accounts`)
}

export async function resetDemoData() {
  return postApi<DemoDataResetResult>('/api/demo-data/reset')
}

export async function fetchPurchaseRequests(companyId: string) {
  return fetchApi<PurchaseRequestListItem[]>(`/api/purchase-requests?companyId=${encodeURIComponent(companyId)}`)
}

export async function fetchPurchaseRequestDetail(requestId: string) {
  return fetchApi<PurchaseRequestDetail>(`/api/purchase-requests/${encodeURIComponent(requestId)}`)
}

export async function createPurchaseRequestDraft(payload: CreatePurchaseRequestDraftPayload) {
  return postApi<PurchaseRequestDetail>('/api/purchase-requests/drafts', payload)
}

export async function submitPurchaseRequest(requestId: string) {
  return postApi<PurchaseRequestDetail>(`/api/purchase-requests/${encodeURIComponent(requestId)}/submit`)
}

export async function deletePurchaseRequestDraft(requestId: string, actorId: string) {
  const params = new URLSearchParams({ actorId })
  return requestApi<{ requestId: string; deleted: boolean }>(
    `/api/purchase-requests/${encodeURIComponent(requestId)}?${params.toString()}`,
    { method: 'DELETE' },
  )
}

export async function fetchApprovalTasks(companyId: string, approverId: string) {
  return fetchApi<ApprovalTask[]>(
    `/api/approvals/tasks?companyId=${encodeURIComponent(companyId)}&approverId=${encodeURIComponent(approverId)}`,
  )
}

export async function fetchApprovalDetail(approvalId: string, companyId?: string) {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
  return fetchApi<ApprovalDetail>(`/api/approvals/${encodeURIComponent(approvalId)}${query}`)
}

export async function fetchApprovalByRequest(requestId: string, companyId?: string) {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
  return fetchApi<ApprovalDetail>(`/api/approvals/by-request/${encodeURIComponent(requestId)}${query}`)
}

export async function approveApproval(approvalId: string, payload: ApprovalActionPayload) {
  return postApi<ApprovalDetail>(`/api/approvals/${encodeURIComponent(approvalId)}/approve`, payload)
}

export async function rejectApproval(approvalId: string, payload: ApprovalActionPayload) {
  return postApi<ApprovalDetail>(`/api/approvals/${encodeURIComponent(approvalId)}/reject`, payload)
}

export async function withdrawApproval(approvalId: string, payload: ApprovalActionPayload) {
  return postApi<ApprovalDetail>(`/api/approvals/${encodeURIComponent(approvalId)}/withdraw`, payload)
}

export async function fetchRfqs(companyId: string) {
  return fetchApi<RfqListItem[]>(`/api/rfqs?companyId=${encodeURIComponent(companyId)}`)
}

export async function fetchRfqDetail(rfqId: string, companyId?: string) {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
  return fetchApi<RfqDetail>(`/api/rfqs/${encodeURIComponent(rfqId)}${query}`)
}

export async function createRfq(payload: CreateRfqPayload) {
  return postApi<RfqDetail>('/api/rfqs', payload)
}

export async function upsertRfqQuote(rfqId: string, supplierId: string, payload: UpsertRfqQuotePayload) {
  return putApi<RfqQuote>(`/api/rfqs/${encodeURIComponent(rfqId)}/quotes/${encodeURIComponent(supplierId)}`, payload)
}

export async function uploadAttachment({
  companyId,
  description,
  file,
  supplierId,
  targetId,
  targetType,
  uploadedBy,
}: {
  companyId: string
  description?: string
  file: File
  supplierId?: string
  targetId: string
  targetType: 'RFQ_QUOTE' | 'RECEIPT' | 'INVOICE'
  uploadedBy?: string
}) {
  const formData = new FormData()
  formData.append('companyId', companyId)
  formData.append('targetType', targetType)
  formData.append('targetId', targetId)
  if (supplierId) {
    formData.append('supplierId', supplierId)
  }
  if (uploadedBy) {
    formData.append('uploadedBy', uploadedBy)
  }
  if (description) {
    formData.append('description', description)
  }
  formData.append('file', file)

  const response = await fetch(`${apiBaseUrl}/api/attachments`, {
    body: formData,
    method: 'POST',
  })
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message =
      errorBody && typeof errorBody.message === 'string'
        ? errorBody.message
        : `Request failed with ${response.status}`
    throw new Error(message)
  }
  return response.json() as Promise<ApiEnvelope<UploadedAttachment>>
}

export async function fetchRfqComparison(rfqId: string, companyId?: string) {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
  return fetchApi<RfqComparisonRow[]>(`/api/rfqs/${encodeURIComponent(rfqId)}/comparison${query}`)
}

export async function fetchPurchaseOrders(companyId: string) {
  return fetchApi<PurchaseOrderListItem[]>(`/api/purchase-orders?companyId=${encodeURIComponent(companyId)}`)
}

export async function fetchPurchaseOrderDetail(poId: string, companyId?: string) {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
  return fetchApi<PurchaseOrderDetail>(`/api/purchase-orders/${encodeURIComponent(poId)}${query}`)
}

export async function createPurchaseOrder(payload: CreatePurchaseOrderPayload) {
  return postApi<PurchaseOrderDetail>('/api/purchase-orders', payload)
}

export async function publishPurchaseOrder(poId: string, payload: PurchaseOrderActionPayload) {
  return postApi<PurchaseOrderDetail>(`/api/purchase-orders/${encodeURIComponent(poId)}/publish`, payload)
}

export async function cancelPurchaseOrder(poId: string, payload: CancelPurchaseOrderPayload) {
  return postApi<PurchaseOrderDetail>(`/api/purchase-orders/${encodeURIComponent(poId)}/cancel`, payload)
}

export async function fetchFulfillmentPurchaseOrders(companyId: string) {
  return fetchApi<FulfillmentPurchaseOrder[]>(`/api/receipts-invoices/purchase-orders?companyId=${encodeURIComponent(companyId)}`)
}

export async function fetchReceipts(companyId: string, poId?: string) {
  const poQuery = poId ? `&poId=${encodeURIComponent(poId)}` : ''
  return fetchApi<ReceiptListItem[]>(`/api/receipts?companyId=${encodeURIComponent(companyId)}${poQuery}`)
}

export async function fetchInvoices(companyId: string, poId?: string) {
  const poQuery = poId ? `&poId=${encodeURIComponent(poId)}` : ''
  return fetchApi<InvoiceListItem[]>(`/api/invoices?companyId=${encodeURIComponent(companyId)}${poQuery}`)
}

export async function createReceipt(payload: CreateReceiptPayload) {
  return postApi<unknown>('/api/receipts', payload)
}

export async function createInvoice(payload: CreateInvoicePayload) {
  return postApi<unknown>('/api/invoices', payload)
}

export async function fetchThreeWayMatches(companyId: string, status?: ThreeWayMatchStatus) {
  const statusQuery = status ? `&status=${encodeURIComponent(status)}` : ''
  return fetchApi<ThreeWayMatchListItem[]>(`/api/three-way-matching?companyId=${encodeURIComponent(companyId)}${statusQuery}`)
}

export async function fetchThreeWayMatchExceptions(companyId: string) {
  return fetchApi<ThreeWayMatchListItem[]>(`/api/three-way-matching/exceptions?companyId=${encodeURIComponent(companyId)}`)
}

export async function fetchThreeWayMatchDetail(matchId: string, companyId: string) {
  return fetchApi<ThreeWayMatchDetail>(
    `/api/three-way-matching/${encodeURIComponent(matchId)}?companyId=${encodeURIComponent(companyId)}`,
  )
}

export async function recalculateThreeWayMatch(payload: RecalculateMatchPayload) {
  return postApi<ThreeWayMatchDetail>('/api/three-way-matching/recalculate', payload)
}

export async function handleThreeWayMatchAction(matchId: string, payload: HandleMatchActionPayload) {
  return postApi<ThreeWayMatchDetail>(`/api/three-way-matching/${encodeURIComponent(matchId)}/actions`, payload)
}

export async function previewAiPurchaseRequestDraft(payload: { companyId: string; actorId: string; intent: string }) {
  return postApi<AiAssistantResponse>('/api/ai-assistant/purchase-request-draft-preview', payload)
}

export async function reviewAiPurchaseRequestRisk(payload: { companyId: string; actorId: string; requestId: string }) {
  return postApi<AiAssistantResponse>('/api/ai-assistant/purchase-request-risk-review', payload)
}

export async function explainAiRfqQuotes(payload: { companyId: string; actorId: string; rfqId: string }) {
  return postApi<AiAssistantResponse>('/api/ai-assistant/rfq-quote-explanation', payload)
}

export async function explainAiMatchingException(payload: { companyId: string; actorId: string; matchId: string }) {
  return postApi<AiAssistantResponse>('/api/ai-assistant/three-way-matching-explanation', payload)
}

export async function fetchProcurementDashboard(scope: ProcurementDashboardScope, actorId: string, companyId?: string) {
  const query = new URLSearchParams({ scope, actorId })
  if (scope === 'COMPANY' && companyId) {
    query.set('companyId', companyId)
  }

  return fetchApi<ProcurementDashboard>(`/api/procurement-dashboard?${query.toString()}`)
}

export async function fetchGlobalSearch(companyId: string, query: string) {
  const params = new URLSearchParams({ companyId, query })
  return fetchApi<GlobalSearchResponse>(`/api/global-search?${params.toString()}`)
}
