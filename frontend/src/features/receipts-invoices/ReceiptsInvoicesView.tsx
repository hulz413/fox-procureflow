import { InboxOutlined, ProfileOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Drawer, Modal } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { DEMO_OPERATOR_ROLE_ID, FINANCE_ROLE_ID, PROCUREMENT_ROLE_ID, WAREHOUSE_ROLE_ID, demoUserHasRoleCapability } from '../../demoRoleCapabilities'
import type { Language, UserSummary, ReceiptInvoiceCreateMode, FulfillmentPurchaseOrder, ReceiptCreateFormState, InvoiceCreateFormState, InvoiceEditableLineKey } from '../../domain/types'
import { uploadAttachment, fetchFulfillmentPurchaseOrders, fetchReceipts, fetchInvoices, createReceipt, createInvoice } from '../../api/client'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { useListPagination } from '../../shared/hooks/useListPagination'
import { routeParam } from '../../shared/utils/route'
import { formatCurrency, getViewportCenter, buildReceiptCreateFormDefaults, buildInvoiceCreateFormDefaults, formatReceiptProgress, receiptProgressToneOf, formatInvoiceProgress, invoiceProgressToneOf, roundAmount } from '../../shared/utils/procurement'
import { ListPagination, TruncatedText, DisabledActionTooltip, PanelTitle } from '../../shared/ui/common'
import { ReceiptInvoicePoSelect, ReceiptFormLines, InvoiceFormLines, ReceiptInvoiceAttachmentFields, FulfillmentDetail } from '../../shared/ui/procurementWidgets'
import { shouldConfirmReceiptInvoiceDrawerClose } from './receiptInvoiceGuards'

export function ReceiptsInvoicesView({
  activeDemoUser,
  createMode,
  language,
  messages,
  onCreateModeChange,
  selectedCompanyId,
  users,
}: {
  activeDemoUser?: UserSummary
  createMode: ReceiptInvoiceCreateMode | null
  language: Language
  messages: LocalizedMessages
  onCreateModeChange: (mode: ReceiptInvoiceCreateMode | null) => void
  selectedCompanyId: string
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const [modal, modalContextHolder] = Modal.useModal()
  const wasCreateOpen = useRef(false)
  const handledRouteFulfillmentKey = useRef('')
  const routePoId = routeParam(location.search, 'poId')
  const [selectedPoId, setSelectedPoId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [isCreateDirty, setCreateDirty] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const fulfillmentQuery = useQuery({
    queryKey: ['receipts-invoices', 'purchase-orders', selectedCompanyId],
    queryFn: () => fetchFulfillmentPurchaseOrders(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const receiptsQuery = useQuery({
    queryKey: ['receipts', selectedCompanyId],
    queryFn: () => fetchReceipts(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const invoicesQuery = useQuery({
    queryKey: ['invoices', selectedCompanyId],
    queryFn: () => fetchInvoices(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const fulfillmentRows = useMemo(() => fulfillmentQuery.data?.data ?? [], [fulfillmentQuery.data?.data])
  const fulfillmentPagination = useListPagination(fulfillmentRows, selectedCompanyId)
  const receipts = useMemo(() => receiptsQuery.data?.data ?? [], [receiptsQuery.data?.data])
  const invoices = useMemo(() => invoicesQuery.data?.data ?? [], [invoicesQuery.data?.data])
  const selectedPo = fulfillmentRows.find((row) => row.poId === selectedPoId)
  const relatedReceipts = selectedPo ? receipts.filter((receipt) => receipt.poId === selectedPo.poId) : []
  const relatedInvoices = selectedPo ? invoices.filter((invoice) => invoice.poId === selectedPo.poId) : []
  const activeUsers = users.filter((user) => user.active)
  const financeUsers = activeUsers.filter((user) => demoUserHasRoleCapability(user, [FINANCE_ROLE_ID]))
  const receiptUsers = activeUsers.filter((user) =>
    demoUserHasRoleCapability(user, [WAREHOUSE_ROLE_ID, PROCUREMENT_ROLE_ID, DEMO_OPERATOR_ROLE_ID]),
  )
  const activeReceiptUser =
    activeDemoUser?.companyId === selectedCompanyId &&
    demoUserHasRoleCapability(activeDemoUser, [WAREHOUSE_ROLE_ID, PROCUREMENT_ROLE_ID, DEMO_OPERATOR_ROLE_ID])
      ? activeDemoUser
      : undefined
  const activeFinanceUser =
    activeDemoUser?.companyId === selectedCompanyId &&
    demoUserHasRoleCapability(activeDemoUser, [FINANCE_ROLE_ID])
      ? activeDemoUser
      : undefined
  const [receiptForm, setReceiptForm] = useState<ReceiptCreateFormState>(() =>
    buildReceiptCreateFormDefaults(fulfillmentRows, receiptUsers, selectedCompanyId, undefined, activeReceiptUser),
  )
  const [invoiceForm, setInvoiceForm] = useState<InvoiceCreateFormState>(() =>
    buildInvoiceCreateFormDefaults(fulfillmentRows, financeUsers, selectedCompanyId, undefined, activeFinanceUser),
  )

  useEffect(() => {
    if (fulfillmentRows.length === 0) {
      setSelectedPoId(undefined)
      setDetailDrawerOpen(false)
      return
    }

    if (selectedPoId && !fulfillmentRows.some((row) => row.poId === selectedPoId)) {
      setSelectedPoId(undefined)
      setDetailDrawerOpen(false)
    }
  }, [fulfillmentRows, selectedPoId])

  useEffect(() => {
    const didOpenCreateDrawer = Boolean(createMode) && !wasCreateOpen.current
    wasCreateOpen.current = Boolean(createMode)
    if (!didOpenCreateDrawer) {
      return
    }

    setCreateDirty(false)
    setFeedback(null)
    setDetailDrawerOpen(false)
    setReceiptForm(buildReceiptCreateFormDefaults(fulfillmentRows, receiptUsers, selectedCompanyId, undefined, activeReceiptUser))
    setInvoiceForm(buildInvoiceCreateFormDefaults(fulfillmentRows, financeUsers, selectedCompanyId, undefined, activeFinanceUser))
  }, [activeFinanceUser, activeReceiptUser, createMode, financeUsers, fulfillmentRows, receiptUsers, selectedCompanyId])

  const receiptMutation = useMutation({
    mutationFn: createReceipt,
    onError: (error) => {
      setFeedback({
        message: `${messages.receiptInvoice.actionFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: () => {
      setCreateDirty(false)
      setFeedback({ message: messages.receiptInvoice.receiptSuccess, tone: 'success' })
      onCreateModeChange(null)
      void queryClient.invalidateQueries({ queryKey: ['receipts'] })
      void queryClient.invalidateQueries({ queryKey: ['receipts-invoices'] })
      void queryClient.invalidateQueries({ queryKey: ['three-way-matching'] })
    },
  })

  const invoiceMutation = useMutation({
    mutationFn: createInvoice,
    onError: (error) => {
      setFeedback({
        message: `${messages.receiptInvoice.actionFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: () => {
      setCreateDirty(false)
      setFeedback({ message: messages.receiptInvoice.invoiceSuccess, tone: 'success' })
      onCreateModeChange(null)
      void queryClient.invalidateQueries({ queryKey: ['invoices'] })
      void queryClient.invalidateQueries({ queryKey: ['receipts-invoices'] })
      void queryClient.invalidateQueries({ queryKey: ['three-way-matching'] })
    },
  })

  const isError = fulfillmentQuery.isError || receiptsQuery.isError || invoicesQuery.isError
  const isLoading = fulfillmentQuery.isLoading || receiptsQuery.isLoading || invoicesQuery.isLoading
  const drawerMode = createMode ?? (isDetailDrawerOpen ? 'detail' : null)
  const drawerTitle =
    drawerMode === 'receipt'
      ? messages.receiptInvoice.createReceipt
      : drawerMode === 'invoice'
        ? messages.receiptInvoice.createInvoice
        : messages.receiptInvoice.detail

  const closeCreateDrawer = () => {
    setCreateDirty(false)
    onCreateModeChange(null)
  }

  const closeDetailDrawer = () => {
    setDetailDrawerOpen(false)
    setFeedback(null)
  }

  const handleDrawerClose = () => {
    if (shouldConfirmReceiptInvoiceDrawerClose(drawerMode, isCreateDirty)) {
      modal.confirm({
        mousePosition: getViewportCenter(),
        centered: true,
        cancelText: messages.purchaseRequest.continueEdit,
        content: messages.receiptInvoice.discardContent,
        focusable: { autoFocusButton: 'cancel' },
        okType: 'danger',
        okText: messages.receiptInvoice.discardConfirm,
        onOk: closeCreateDrawer,
        rootClassName: 'procure-confirm-modal',
        title: messages.receiptInvoice.discardTitle,
      })
      return
    }

    if (drawerMode === 'receipt' || drawerMode === 'invoice') {
      closeCreateDrawer()
      return
    }

    closeDetailDrawer()
  }

  const openPoDetail = (poId: string) => {
    setSelectedPoId(poId)
    setDetailDrawerOpen(true)
    setFeedback(null)
  }

  useEffect(() => {
    if (!routePoId) {
      return
    }

    const routeKey = `${location.key}:${routePoId}`
    if (handledRouteFulfillmentKey.current === routeKey) {
      return
    }

    if (routePoId === selectedPoId && isDetailDrawerOpen) {
      handledRouteFulfillmentKey.current = routeKey
      return
    }

    if (!fulfillmentRows.some((row) => row.poId === routePoId)) {
      return
    }

    handledRouteFulfillmentKey.current = routeKey
    setSelectedPoId(routePoId)
    setDetailDrawerOpen(true)
    setFeedback(null)
  }, [fulfillmentRows, isDetailDrawerOpen, location.key, routePoId, selectedPoId])

  const openCreateMode = (mode: ReceiptInvoiceCreateMode, po?: FulfillmentPurchaseOrder) => {
    const row = po ?? fulfillmentRows[0]
    if (mode === 'receipt') {
      setReceiptForm(buildReceiptCreateFormDefaults(fulfillmentRows, receiptUsers, selectedCompanyId, row?.poId, activeReceiptUser))
    } else {
      setInvoiceForm(buildInvoiceCreateFormDefaults(fulfillmentRows, financeUsers, selectedCompanyId, row?.poId, activeFinanceUser))
    }
    setCreateDirty(false)
    setFeedback(null)
    onCreateModeChange(mode)
  }

  const updateReceiptPo = (poId: string) => {
    setCreateDirty(true)
    setReceiptForm(buildReceiptCreateFormDefaults(fulfillmentRows, receiptUsers, selectedCompanyId, poId, activeReceiptUser))
  }

  const updateInvoicePo = (poId: string) => {
    setCreateDirty(true)
    setInvoiceForm(buildInvoiceCreateFormDefaults(fulfillmentRows, financeUsers, selectedCompanyId, poId, activeFinanceUser))
  }

  const updateReceiptLine = (poLineId: string, receivedQuantity: number) => {
    setCreateDirty(true)
    setReceiptForm((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.poLineId === poLineId ? { ...line, receivedQuantity } : line,
      ),
    }))
  }

  const updateInvoiceLine = (
    poLineId: string,
    key: InvoiceEditableLineKey,
    value: number,
  ) => {
    setCreateDirty(true)
    setInvoiceForm((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.poLineId === poLineId ? { ...line, [key]: value } : line)),
    }))
  }

  const handleCreateReceipt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void (async () => {
      try {
        let uploadedAttachments = receiptForm.uploadedAttachments
        if (receiptForm.file) {
          const uploadResponse = await uploadAttachment({
            companyId: selectedCompanyId,
            description: receiptForm.fileDescription,
            file: receiptForm.file,
            supplierId: fulfillmentRows.find((row) => row.poId === receiptForm.poId)?.supplierId,
            targetId: receiptForm.poId,
            targetType: 'RECEIPT',
            uploadedBy: receiptForm.receivedBy,
          })
          uploadedAttachments = [uploadResponse.data]
          setReceiptForm((current) => ({
            ...current,
            file: null,
            fileName: uploadResponse.data.originalFileName,
            uploadedAttachments,
          }))
        }
        receiptMutation.mutate({
          attachmentIds: uploadedAttachments.map((attachment) => attachment.attachmentId),
          attachments: uploadedAttachments.length === 0 && receiptForm.fileName.trim()
            ? [{
                contentType: 'image/jpeg',
                description: receiptForm.fileDescription,
                fileName: receiptForm.fileName,
                sizeBytes: 0,
              }]
            : [],
          companyId: selectedCompanyId,
          lines: receiptForm.lines
            .filter((line) => line.receivedQuantity > 0)
            .map((line) => ({
              note: line.note,
              poLineId: line.poLineId,
              receivedQuantity: line.receivedQuantity,
            })),
          note: receiptForm.note,
          poId: receiptForm.poId,
          receivedBy: receiptForm.receivedBy,
          receivedDate: receiptForm.receivedDate,
        })
      } catch (error) {
        setFeedback({
          message: `${messages.receiptInvoice.actionFailed}: ${error instanceof Error ? error.message : ''}`,
          tone: 'danger',
        })
      }
    })()
  }

  const handleCreateInvoice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void (async () => {
      try {
        let uploadedAttachments = invoiceForm.uploadedAttachments
        if (invoiceForm.file) {
          const uploadResponse = await uploadAttachment({
            companyId: selectedCompanyId,
            description: invoiceForm.fileDescription,
            file: invoiceForm.file,
            supplierId: fulfillmentRows.find((row) => row.poId === invoiceForm.poId)?.supplierId,
            targetId: invoiceForm.poId,
            targetType: 'INVOICE',
            uploadedBy: invoiceForm.registeredBy,
          })
          uploadedAttachments = [uploadResponse.data]
          setInvoiceForm((current) => ({
            ...current,
            file: null,
            fileName: uploadResponse.data.originalFileName,
            uploadedAttachments,
          }))
        }
        invoiceMutation.mutate({
          attachmentIds: uploadedAttachments.map((attachment) => attachment.attachmentId),
          attachments: uploadedAttachments.length === 0 && invoiceForm.fileName.trim()
            ? [{
                contentType: 'application/pdf',
                description: invoiceForm.fileDescription,
                fileName: invoiceForm.fileName,
                sizeBytes: 0,
              }]
            : [],
          companyId: selectedCompanyId,
          invoiceDate: invoiceForm.invoiceDate,
          invoiceNumber: invoiceForm.invoiceNumber,
          lines: invoiceForm.lines
            .filter((line) => line.invoicedQuantity > 0)
            .map((line) => ({
              invoicedQuantity: line.invoicedQuantity,
              poLineId: line.poLineId,
              taxAmount: roundAmount(line.taxAmount),
              taxRate: line.taxRate,
              totalAmount: roundAmount(line.totalAmount),
              untaxedAmount: roundAmount(line.untaxedAmount),
            })),
          note: invoiceForm.note,
          poId: invoiceForm.poId,
          registeredBy: invoiceForm.registeredBy,
        })
      } catch (error) {
        setFeedback({
          message: `${messages.receiptInvoice.actionFailed}: ${error instanceof Error ? error.message : ''}`,
          tone: 'danger',
        })
      }
    })()
  }

  return (
    <>
      {modalContextHolder}
      <section className="request-grid rfq-grid">
        <section className="panel request-list-panel">
          <PanelTitle
            actions={(
              <div className="panel-title-actions">
                <DisabledActionTooltip title={fulfillmentRows.length === 0 ? messages.receiptInvoice.noIssuedPo : undefined}>
                  <button
                    className="primary-button"
                    disabled={fulfillmentRows.length === 0}
                    onClick={() => openCreateMode('receipt')}
                    type="button"
                  >
                    <InboxOutlined />
                    <span>{messages.receiptInvoice.createReceipt}</span>
                  </button>
                </DisabledActionTooltip>
                <DisabledActionTooltip title={fulfillmentRows.length === 0 ? messages.receiptInvoice.noIssuedPo : undefined}>
                  <button
                    className="secondary-button"
                    disabled={fulfillmentRows.length === 0}
                    onClick={() => openCreateMode('invoice')}
                    type="button"
                  >
                    <ProfileOutlined />
                    <span>{messages.receiptInvoice.createInvoice}</span>
                  </button>
                </DisabledActionTooltip>
              </div>
            )}
            icon={<InboxOutlined />}
            title={messages.receiptInvoice.list}
          />
          {isError && <div className="data-alert">{messages.receiptInvoice.unavailable}</div>}
          {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
          <div className="table-wrap">
            <table className="request-table">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>{messages.purchaseOrder.supplier}</th>
                  <th>{messages.rfq.totalAmount}</th>
                  <th>{messages.receiptInvoice.receivedQuantity}</th>
                  <th>{messages.receiptInvoice.invoicedQuantity}</th>
                  <th>{messages.receiptInvoice.variance}</th>
                  <th>{messages.purchaseRequest.status}</th>
                </tr>
              </thead>
              <tbody>
                {fulfillmentRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>{isLoading ? messages.receiptInvoice.loading : messages.receiptInvoice.empty}</td>
                  </tr>
                ) : (
                  fulfillmentPagination.pageItems.map((row) => (
                    <tr key={row.poId}>
                      <td>
                        <button
                          className={row.poId === selectedPoId ? 'row-link active' : 'row-link'}
                          onClick={() => openPoDetail(row.poId)}
                          type="button"
                        >
                          <TruncatedText text={row.poId} />
                        </button>
                      </td>
                      <td>
                        <TruncatedText text={row.supplierName} />
                      </td>
                      <td>{formatCurrency(row.poTotalAmount, row.currency, language)}</td>
                      <td>{`${row.receivedQuantity} / ${row.orderedQuantity}`}</td>
                      <td>{`${row.invoicedQuantity} / ${row.orderedQuantity}`}</td>
                      <td className={row.invoiceAmountStatus === 'VARIANCE' ? 'amount-danger' : undefined}>
                        {formatCurrency(row.invoiceAmountVariance, row.currency, language)}
                      </td>
                      <td>
                        <span className={`tag ${receiptProgressToneOf(row.receiptSummary)}`}>
                          {formatReceiptProgress(row.receiptSummary, messages)}
                        </span>
                        <span className={`tag ${invoiceProgressToneOf(row.invoiceSummary)}`}>
                          {formatInvoiceProgress(row.invoiceSummary, messages)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ListPagination
            currentPage={fulfillmentPagination.currentPage}
            messages={messages}
            onPageChange={fulfillmentPagination.setPage}
            onPageSizeChange={fulfillmentPagination.setPageSize}
            pageSize={fulfillmentPagination.pageSize}
            totalItems={fulfillmentPagination.totalItems}
            totalPages={fulfillmentPagination.totalPages}
          />
        </section>
      </section>

      <Drawer
        className="request-drawer rfq-drawer"
        destroyOnClose={false}
        keyboard
        maskClosable
        onClose={handleDrawerClose}
        open={drawerMode !== null}
        title={drawerTitle}
        size={980}
      >
        {drawerMode === 'receipt' ? (
          <form className="request-form rfq-form" onSubmit={handleCreateReceipt}>
            <ReceiptInvoicePoSelect
              fulfillmentRows={fulfillmentRows}
              label={messages.receiptInvoice.sourcePo}
              messages={messages}
              onChange={updateReceiptPo}
              value={receiptForm.poId}
            />
            <label>
              <span>{messages.receiptInvoice.receiver}</span>
              <select
                required
                value={receiptForm.receivedBy}
                onChange={(event) => {
                  setCreateDirty(true)
                  setReceiptForm((current) => ({ ...current, receivedBy: event.target.value }))
                }}
              >
                {receiptUsers.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{messages.receiptInvoice.receivedDate}</span>
              <input
                required
                type="date"
                value={receiptForm.receivedDate}
                onChange={(event) => {
                  setCreateDirty(true)
                  setReceiptForm((current) => ({ ...current, receivedDate: event.target.value }))
                }}
              />
            </label>
            <ReceiptFormLines
              form={receiptForm}
              language={language}
              messages={messages}
              onQuantityChange={updateReceiptLine}
              po={fulfillmentRows.find((row) => row.poId === receiptForm.poId)}
            />
            <ReceiptInvoiceAttachmentFields
              description={receiptForm.fileDescription}
              file={receiptForm.file}
              fileName={receiptForm.fileName}
              messages={messages}
              onDescriptionChange={(value) => {
                setCreateDirty(true)
                setReceiptForm((current) => ({ ...current, fileDescription: value }))
              }}
              onFileChange={(file) => {
                setCreateDirty(true)
                setReceiptForm((current) => ({
                  ...current,
                  file,
                  fileName: file?.name ?? current.fileName,
                  uploadedAttachments: file ? [] : current.uploadedAttachments,
                }))
              }}
              pendingAttachment={receiptForm.uploadedAttachments[0] ?? (receiptForm.fileName
                ? {
                    attachmentId: '',
                    contentType: receiptForm.file?.type || 'image/jpeg',
                    description: receiptForm.fileDescription || null,
                    downloadable: false,
                    downloadDisabledReason: receiptForm.file
                      ? messages.rfq.pendingUploadReason
                      : messages.rfq.metadataOnlyReason,
                    downloadUrl: null,
                    originalFileName: receiptForm.fileName,
                    sizeBytes: receiptForm.file?.size ?? 0,
                    storageStatus: receiptForm.file ? 'PENDING' : 'METADATA_ONLY',
                  }
                : undefined)}
            />
            <label className="form-wide">
              <span>{messages.receiptInvoice.note}</span>
              <textarea
                value={receiptForm.note}
                onChange={(event) => {
                  setCreateDirty(true)
                  setReceiptForm((current) => ({ ...current, note: event.target.value }))
                }}
              />
            </label>
            <button className="primary-button form-wide" disabled={receiptMutation.isPending} type="submit">
              <InboxOutlined />
              <span>{messages.receiptInvoice.createReceipt}</span>
            </button>
          </form>
        ) : drawerMode === 'invoice' ? (
          <form className="request-form rfq-form" onSubmit={handleCreateInvoice}>
            <ReceiptInvoicePoSelect
              fulfillmentRows={fulfillmentRows}
              label={messages.receiptInvoice.sourcePo}
              messages={messages}
              onChange={updateInvoicePo}
              value={invoiceForm.poId}
            />
            <label>
              <span>{messages.receiptInvoice.invoiceNumber}</span>
              <input
                required
                value={invoiceForm.invoiceNumber}
                onChange={(event) => {
                  setCreateDirty(true)
                  setInvoiceForm((current) => ({ ...current, invoiceNumber: event.target.value }))
                }}
              />
            </label>
            <label>
              <span>{messages.receiptInvoice.invoiceDate}</span>
              <input
                required
                type="date"
                value={invoiceForm.invoiceDate}
                onChange={(event) => {
                  setCreateDirty(true)
                  setInvoiceForm((current) => ({ ...current, invoiceDate: event.target.value }))
                }}
              />
            </label>
            <label>
              <span>{messages.receiptInvoice.registeredBy}</span>
              <select
                required
                value={invoiceForm.registeredBy}
                onChange={(event) => {
                  setCreateDirty(true)
                  setInvoiceForm((current) => ({ ...current, registeredBy: event.target.value }))
                }}
              >
                {financeUsers.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </label>
            <InvoiceFormLines
              form={invoiceForm}
              language={language}
              messages={messages}
              onLineChange={updateInvoiceLine}
              po={fulfillmentRows.find((row) => row.poId === invoiceForm.poId)}
            />
            <ReceiptInvoiceAttachmentFields
              description={invoiceForm.fileDescription}
              file={invoiceForm.file}
              fileName={invoiceForm.fileName}
              messages={messages}
              onDescriptionChange={(value) => {
                setCreateDirty(true)
                setInvoiceForm((current) => ({ ...current, fileDescription: value }))
              }}
              onFileChange={(file) => {
                setCreateDirty(true)
                setInvoiceForm((current) => ({
                  ...current,
                  file,
                  fileName: file?.name ?? current.fileName,
                  uploadedAttachments: file ? [] : current.uploadedAttachments,
                }))
              }}
              pendingAttachment={invoiceForm.uploadedAttachments[0] ?? (invoiceForm.fileName
                ? {
                    attachmentId: '',
                    contentType: invoiceForm.file?.type || 'application/pdf',
                    description: invoiceForm.fileDescription || null,
                    downloadable: false,
                    downloadDisabledReason: invoiceForm.file
                      ? messages.rfq.pendingUploadReason
                      : messages.rfq.metadataOnlyReason,
                    downloadUrl: null,
                    originalFileName: invoiceForm.fileName,
                    sizeBytes: invoiceForm.file?.size ?? 0,
                    storageStatus: invoiceForm.file ? 'PENDING' : 'METADATA_ONLY',
                  }
                : undefined)}
            />
            <label className="form-wide">
              <span>{messages.receiptInvoice.note}</span>
              <textarea
                value={invoiceForm.note}
                onChange={(event) => {
                  setCreateDirty(true)
                  setInvoiceForm((current) => ({ ...current, note: event.target.value }))
                }}
              />
            </label>
            <button className="primary-button form-wide" disabled={invoiceMutation.isPending} type="submit">
              <ProfileOutlined />
              <span>{messages.receiptInvoice.createInvoice}</span>
            </button>
          </form>
        ) : selectedPo ? (
          <FulfillmentDetail
            invoices={relatedInvoices}
            language={language}
            messages={messages}
            onCreateInvoice={() => openCreateMode('invoice', selectedPo)}
            onCreateReceipt={() => openCreateMode('receipt', selectedPo)}
            po={selectedPo}
            receipts={relatedReceipts}
            users={users}
          />
        ) : (
          <div className="empty-state">{isLoading ? messages.receiptInvoice.loading : messages.receiptInvoice.empty}</div>
        )}
      </Drawer>
    </>
  )
}
