"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Inbox,
  LucideIcon,
} from "lucide-react";

export interface ColumnDef<T> {
  id?: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface IPaginationData {
  total_items: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  showing_start: number;
  showing_end: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyField?: keyof T;
  title?: string;
  titleIcon?: LucideIcon;
  subtitle?: string;
  headerActions?: React.ReactNode;
  // Multi-level group header custom node (optional)
  customHeaderRow?: React.ReactNode;
  // Selection
  enableSelection?: boolean;
  selectedIds?: string[];
  onToggleSelectAll?: () => void;
  onToggleSelectOne?: (id: string) => void;
  // Row Click & Active Highlight for Detail Drawer / Section
  selectedRowId?: string | null;
  onRowClick?: (item: T) => void;
  // Pagination
  pagination?: IPaginationData;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  // Loading & Empty States
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data = [],
  columns,
  keyField = "id" as keyof T,
  title,
  titleIcon: TitleIcon,
  subtitle,
  headerActions,
  customHeaderRow,
  enableSelection = false,
  selectedIds = [],
  onToggleSelectAll,
  onToggleSelectOne,
  selectedRowId,
  onRowClick,
  pagination,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
  isLoading = false,
  emptyMessage = "Tidak ada data yang ditemukan",
  className = "",
}: DataTableProps<T>) {
  const isAllSelected =
    data.length > 0 &&
    data.every((item) => selectedIds.includes(String(item[keyField])));

  const totalPages = pagination?.total_pages || Math.ceil((pagination?.total_items || data.length) / pageSize) || 1;
  const currPage = pagination?.current_page || currentPage;
  const showingStart = pagination?.showing_start || (data.length > 0 ? (currPage - 1) * pageSize + 1 : 0);
  const showingEnd = pagination?.showing_end || Math.min(currPage * pageSize, pagination?.total_items || data.length);
  const totalItems = pagination?.total_items ?? data.length;

  // Generate page numbers for pagination bar (sliding window around current page)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currPage - 1, currPage, currPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs transition-colors ${className}`}
    >
      {/* Optional Top Table Toolbar Bar */}
      {(title || headerActions) && (
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0b1120]">
          <div className="flex items-center gap-2.5">
            {TitleIcon && (
              <div className="size-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 text-[#0073ea] flex items-center justify-center shrink-0">
                <TitleIcon className="size-4" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
          {/* Custom Header Row (e.g. for multi-level group headers) OR Standard Header Row */}
          <thead>
            {customHeaderRow ? (
              customHeaderRow
            ) : (
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0e1628]/80 text-slate-500 dark:text-slate-400 font-semibold">
                {enableSelection && (
                  <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200/60 dark:border-slate-800/60">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={onToggleSelectAll}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0073ea] focus:ring-[#0073ea] size-3.5 cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col, idx) => {
                  const alignClass =
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                      ? "text-right"
                      : "text-left";
                  const isLast = idx === columns.length - 1;
                  return (
                    <th
                      key={col.id || String(col.accessorKey) || idx}
                      style={{ width: col.width }}
                      className={`py-2.5 px-3 ${alignClass} ${
                        !isLast ? "border-r border-slate-200/60 dark:border-slate-800/60" : ""
                      } ${col.headerClassName || ""}`}
                    >
                      {col.header}
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: pageSize || 5 }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} className="animate-pulse">
                  {enableSelection && (
                    <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/50">
                      <div className="size-3.5 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((_, cIdx) => (
                    <td
                      key={`skel-c-${cIdx}`}
                      className="py-3 px-3 border-r border-slate-100 dark:border-slate-800/50"
                    >
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + (enableSelection ? 1 : 0)}
                  className="py-12 px-4 text-center text-slate-400 dark:text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="size-8 text-slate-300 dark:text-slate-600" />
                    <span className="text-xs font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              // Actual Data Rows
              data.map((row, rIdx) => {
                const idVal = String(row[keyField] ?? rIdx);
                const isSelected = selectedIds.includes(idVal);
                const isActiveForDetail = selectedRowId === idVal;

                return (
                  <tr
                    key={idVal}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors ${
                      isActiveForDetail
                        ? "bg-blue-500/10 dark:bg-blue-500/15 border-l-4 border-l-[#0073ea] font-medium"
                        : "hover:bg-blue-50/40 dark:hover:bg-slate-800/50"
                    } ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    {/* Selection Checkbox Cell */}
                    {enableSelection && (
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="py-2.5 px-3 w-10 text-center border-r border-slate-100 dark:border-slate-800/50"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectOne && onToggleSelectOne(idVal)}
                          className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0073ea] focus:ring-[#0073ea] size-3.5 cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Column Cells */}
                    {columns.map((col, cIdx) => {
                      const alignClass =
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left";
                      const isLast = cIdx === columns.length - 1;

                      let cellContent: React.ReactNode = null;
                      if (col.cell) {
                        cellContent = col.cell(row, rIdx);
                      } else if (col.accessorKey) {
                        cellContent = String(row[col.accessorKey] ?? "-");
                      }

                      return (
                        <td
                          key={col.id || String(col.accessorKey) || cIdx}
                          className={`py-2.5 px-3 ${alignClass} ${
                            !isLast ? "border-r border-slate-100 dark:border-slate-800/50" : ""
                          } ${col.className || ""}`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Signature Report-Style Pagination Footer */}
      {onPageChange && (
        <div className="px-4 py-3 border-t border-slate-200/90 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0e1628]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Left: Showing info */}
          <div className="text-slate-500 dark:text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {showingStart}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {showingEnd}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {totalItems.toLocaleString()}
            </span>{" "}
            entries
          </div>

          {/* Center / Right: Page Size & Navigation Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Rows Per Page Dropdown */}
            {onPageSizeChange && (
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span>Rows:</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="appearance-none pl-2.5 pr-6 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-[#0073ea] cursor-pointer"
                  >
                    {pageSizeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Pagination Navigation Buttons */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                type="button"
                disabled={currPage <= 1}
                onClick={() => onPageChange(1)}
                title="First Page"
                className="size-7 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronsLeft className="size-3.5" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                disabled={currPage <= 1}
                onClick={() => onPageChange(Math.max(1, currPage - 1))}
                title="Previous Page"
                className="size-7 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              {/* Numbered Pills */}
              {getPageNumbers().map((p, idx) => {
                if (typeof p === "string") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-slate-400 dark:text-slate-600 select-none"
                    >
                      ...
                    </span>
                  );
                }
                const isActive = p === currPage;
                return (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`size-7 rounded-md font-semibold text-xs flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#0073ea] text-white shadow-xs font-bold"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                type="button"
                disabled={currPage >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currPage + 1))}
                title="Next Page"
                className="size-7 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronRight className="size-3.5" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                disabled={currPage >= totalPages}
                onClick={() => onPageChange(totalPages)}
                title="Last Page"
                className="size-7 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronsRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
