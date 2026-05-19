import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  AttachmentInlineAction,
  AttachmentList,
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
})

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
})
