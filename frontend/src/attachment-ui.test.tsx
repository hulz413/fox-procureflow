import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  AttachmentInlineAction,
  AttachmentList,
  GlobalSearchDialog,
  NotificationPanel,
  ReceiptInvoiceAttachmentFields,
  localizedContent,
  shouldConfirmReceiptInvoiceDrawerClose,
} from './App'

const messages = localizedContent.zh

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })

  class TestResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: TestResizeObserver,
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  )
}

describe('attachment UI', () => {
  it('shows RFQ pending upload rows with disabled download tooltip reasons', () => {
    render(
      <AttachmentList
        attachments={[
          {
            attachmentId: '',
            contentType: 'application/pdf',
            description: '报价单',
            downloadable: false,
            downloadDisabledReason: messages.rfq.pendingUploadReason,
            downloadUrl: null,
            originalFileName: '供应商报价.pdf',
            sizeBytes: 120,
            storageStatus: 'PENDING',
          },
        ]}
        messages={messages}
      />,
    )

    const downloadButton = screen.getByRole('button', { name: new RegExp(messages.rfq.downloadAttachment) })
    expect(screen.getByText('供应商报价.pdf')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
    expect(downloadButton).toBeDisabled()
    expect(downloadButton.parentElement).toHaveAttribute('title', messages.rfq.pendingUploadReason)
  })

  it('reports receipt and invoice file selections for upload forms', () => {
    const onDescriptionChange = vi.fn()
    const onFileChange = vi.fn()
    render(
      <ReceiptInvoiceAttachmentFields
        description="初始说明"
        file={null}
        fileName=""
        messages={messages}
        onDescriptionChange={onDescriptionChange}
        onFileChange={onFileChange}
      />,
    )

    const file = new File(['receipt-proof'], 'receipt-proof.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(messages.receiptInvoice.attachmentFile), {
      target: { files: [file] },
    })
    fireEvent.change(screen.getByLabelText(messages.receiptInvoice.attachmentDescription), {
      target: { value: '更新后的附件说明' },
    })

    expect(onFileChange).toHaveBeenCalledWith(file)
    expect(onDescriptionChange).toHaveBeenCalledWith('更新后的附件说明')
  })

  it('opens refreshed downloadable attachment metadata through the backend URL', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(
      <AttachmentInlineAction
        attachment={{
          attachmentId: 'ATT-READY-001',
          contentType: 'application/pdf',
          createdAt: '2026-05-19T10:00:00',
          description: '已上传附件',
          downloadable: true,
          downloadDisabledReason: null,
          downloadUrl: '/api/attachments/ATT-READY-001/download?companyId=company-digital',
          fileName: '已上传附件.pdf',
          sizeBytes: 256,
          storageObjectKey: 'companies/company-digital/test/ATT-READY-001.pdf',
          storageStatus: 'READY',
        }}
        messages={messages}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /已上传附件\.pdf/ }))

    expect(openSpy).toHaveBeenCalledWith(
      'http://localhost:8080/api/attachments/ATT-READY-001/download?companyId=company-digital',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('requires confirmation when receipt or invoice upload edits are unsaved', () => {
    expect(shouldConfirmReceiptInvoiceDrawerClose('receipt', true)).toBe(true)
    expect(shouldConfirmReceiptInvoiceDrawerClose('invoice', true)).toBe(true)
    expect(shouldConfirmReceiptInvoiceDrawerClose('detail', true)).toBe(false)
    expect(shouldConfirmReceiptInvoiceDrawerClose('receipt', false)).toBe(false)
  })

  it('dismisses a demo notification from the notification panel', () => {
    const onDismiss = vi.fn()
    const onSelect = vi.fn()
    const notification = messages.notificationCenter.items[0]
    render(
      <NotificationPanel
        messages={messages}
        notifications={[notification]}
        onDismiss={onDismiss}
        onSelect={onSelect}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: `${messages.notificationCenter.dismiss}: ${notification.title}` }))

    expect(screen.getByText(notification.title)).toBeInTheDocument()
    expect(onDismiss).toHaveBeenCalledWith(notification.id)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('opens a demo notification target from the notification panel', () => {
    const onDismiss = vi.fn()
    const onSelect = vi.fn()
    const notification = messages.notificationCenter.items[1]
    render(
      <NotificationPanel
        messages={messages}
        notifications={[notification]}
        onDismiss={onDismiss}
        onSelect={onSelect}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: `${notification.title}: ${notification.description}` }))

    expect(onDismiss).toHaveBeenCalledWith(notification.id)
    expect(onSelect).toHaveBeenCalledWith(notification)
  })

  it('searches global results and opens the keyboard-selected target', async () => {
    const onOpenResult = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            companyId: 'company-digital',
            companyName: '星河数字科技有限公司',
            generatedAt: '2026-05-19T12:00:00',
            groups: [
              {
                label: '采购订单',
                results: [
                  {
                    amount: 178540,
                    companyId: 'company-digital',
                    companyName: '星河数字科技有限公司',
                    currency: 'CNY',
                    id: 'PO-20260518-0301',
                    matchedFields: ['PO-20260518-0301'],
                    occurredAt: '2026-05-19T11:20:00',
                    ownershipScope: 'COMPANY',
                    status: 'DRAFT',
                    subtitle: 'RFQ-20260518-0301 · 上海云舟信息技术有限公司',
                    supplierName: '上海云舟信息技术有限公司',
                    targetParams: { poId: 'PO-20260518-0301' },
                    targetPath: '/purchase-orders',
                    title: '移动工作站采购订单',
                    type: 'PURCHASE_ORDER',
                  },
                  {
                    amount: 24295,
                    companyId: 'company-digital',
                    companyName: '星河数字科技有限公司',
                    currency: 'CNY',
                    id: 'PO-20260518-0302',
                    matchedFields: ['PO-20260518-0302'],
                    occurredAt: '2026-05-19T11:25:00',
                    ownershipScope: 'COMPANY',
                    status: 'ISSUED',
                    subtitle: 'RFQ-20260518-0302 · 杭州诚采办公用品有限公司',
                    supplierName: '杭州诚采办公用品有限公司',
                    targetParams: { poId: 'PO-20260518-0302' },
                    targetPath: '/purchase-orders',
                    title: '办公耗材采购订单',
                    type: 'PURCHASE_ORDER',
                  },
                ],
                type: 'PURCHASE_ORDER',
              },
            ],
            query: 'PO',
          },
          success: true,
          timestamp: '2026-05-19T12:00:00',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        },
      ),
    )

    renderWithQueryClient(
      <GlobalSearchDialog
        companyId="company-digital"
        language="zh"
        messages={messages}
        onClose={vi.fn()}
        onOpenResult={onOpenResult}
        open
      />,
    )

    const input = screen.getByLabelText(messages.globalSearch.title)
    fireEvent.change(input, { target: { value: 'PO' } })

    expect(await screen.findByText('移动工作站采购订单')).toBeInTheDocument()
    expect(screen.getByText('办公耗材采购订单')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/api/global-search?companyId=company-digital&query=PO')

    expect(screen.getByRole('button', { name: /移动工作站采购订单/ })).not.toHaveClass('active')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /移动工作站采购订单/ })).toHaveClass('active')
    })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /办公耗材采购订单/ })).toHaveClass('active')
    })

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onOpenResult).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'PO-20260518-0302',
        targetPath: '/purchase-orders',
        targetParams: { poId: 'PO-20260518-0302' },
      }),
    )
  })
})
