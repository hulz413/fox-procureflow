import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_LIST_PAGE_SIZE } from '../../domain/types'

export function useListPagination<T>(
  items: T[],
  resetKey: string,
  initialPageSize = DEFAULT_LIST_PAGE_SIZE,
) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const setPageSize = useCallback((nextPageSize: number) => {
    setPageSizeState(nextPageSize)
    setPage(1)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  return {
    currentPage,
    pageItems: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    pageSize,
    setPage,
    setPageSize,
    totalItems: items.length,
    totalPages,
  }
}
