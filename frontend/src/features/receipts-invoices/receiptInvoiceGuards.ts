import type { ReceiptInvoiceCreateMode } from '../../domain/types'

export function shouldConfirmReceiptInvoiceDrawerClose(
  drawerMode: ReceiptInvoiceCreateMode | 'detail' | null,
  isCreateDirty: boolean,
) {
  return (drawerMode === 'receipt' || drawerMode === 'invoice') && isCreateDirty
}
