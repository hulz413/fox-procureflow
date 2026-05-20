import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ApprovalNode, ApprovalRecord, UserSummary } from './domain/types'
import { localizedContent } from './i18n/localizedContent'
import { ApprovalProgress } from './shared/ui/procurementWidgets'

const messages = localizedContent.zh

const users: UserSummary[] = [
  {
    active: true,
    companyId: 'company-digital',
    departmentId: 'dept-digital-rd',
    departmentName: '研发部',
    displayName: '林晓晨',
    email: 'lin@example.com',
    positionTitle: '申请人',
    roles: [],
    userId: 'user-digital-applicant',
  },
  {
    active: true,
    companyId: 'company-digital',
    departmentId: 'dept-digital-rd',
    departmentName: '研发部',
    displayName: '周明远',
    email: 'zhou@example.com',
    positionTitle: '部门负责人',
    roles: [],
    userId: 'user-digital-approver',
  },
  {
    active: true,
    companyId: 'company-digital',
    departmentId: 'dept-digital-finance',
    departmentName: '财务部',
    displayName: '陈思雨',
    email: 'chen@example.com',
    positionTitle: '财务',
    roles: [],
    userId: 'user-digital-finance',
  },
]

const nodes: ApprovalNode[] = [
  {
    activatedAt: '2026-05-19T11:50:00',
    approverId: 'user-digital-approver',
    completedAt: '2026-05-19T12:05:00',
    nodeId: 'node-1',
    nodeName: '部门负责人审批',
    status: 'APPROVED',
    stepOrder: 1,
  },
  {
    activatedAt: '2026-05-19T12:05:00',
    approverId: 'user-digital-finance',
    completedAt: null,
    nodeId: 'node-2',
    nodeName: '财务审批',
    status: 'ACTIVE',
    stepOrder: 2,
  },
]

const records: ApprovalRecord[] = [
  {
    action: 'CREATED',
    actorId: 'user-digital-applicant',
    comment: '提交采购申请后自动进入审批流',
    createdAt: '2026-05-19T11:50:00',
    nodeId: null,
    recordId: 'record-created',
  },
  {
    action: 'APPROVED',
    actorId: 'user-digital-approver',
    comment: '存储扩容需求明确，转财务复核',
    createdAt: '2026-05-19T12:05:00',
    nodeId: 'node-1',
    recordId: 'record-approved',
  },
]

afterEach(() => {
  cleanup()
})

describe('ApprovalProgress', () => {
  it('combines path nodes and audit records into one approval progress region', () => {
    render(<ApprovalProgress language="zh" messages={messages} nodes={nodes} records={records} users={users} />)

    expect(screen.getByText(messages.approval.progress)).toBeInTheDocument()
    expect(screen.queryByText(messages.approval.path)).not.toBeInTheDocument()
    expect(screen.queryByText(messages.approval.timeline)).not.toBeInTheDocument()
    expect(screen.getByText(/提交采购申请后自动进入审批流/)).toBeInTheDocument()
    expect(screen.getByText('部门负责人审批')).toBeInTheDocument()
    expect(screen.getByText('财务审批')).toBeInTheDocument()
    expect(screen.getByText(/存储扩容需求明确，转财务复核/)).toBeInTheDocument()
    expect(screen.getByText(messages.approval.active)).toBeInTheDocument()

    const financeStep = screen.getByText('财务审批').closest('.approval-progress-item')
    expect(financeStep).not.toBeNull()
    expect(within(financeStep as HTMLElement).getByText('陈思雨')).toBeInTheDocument()
  })

  it('keeps node-less and orphan audit events visible', () => {
    render(
      <ApprovalProgress
        language="zh"
        messages={messages}
        nodes={nodes}
        records={[
          ...records,
          {
            action: 'WITHDRAWN',
            actorId: 'user-digital-applicant',
            comment: '申请人撤回',
            createdAt: '2026-05-19T12:10:00',
            nodeId: null,
            recordId: 'record-withdrawn',
          },
          {
            action: 'REJECTED',
            actorId: 'user-digital-finance',
            comment: '补充审批说明',
            createdAt: '2026-05-19T12:08:00',
            nodeId: 'missing-node',
            recordId: 'record-orphan',
          },
        ]}
        users={users}
      />,
    )

    expect(screen.getByText(/申请人撤回/)).toBeInTheDocument()
    expect(screen.getByText(/补充审批说明/)).toBeInTheDocument()
    expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0)
  })
})
