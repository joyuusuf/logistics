"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  align?: "left" | "right";
  /** Hide on smaller screens when no mobile card renderer is provided. */
  hideBelow?: "md" | "lg" | "xl";
}

export interface FilterOption {
  value: string;
  label: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  searchFn?: (row: T, query: string) => boolean;
  filters?: FilterOption[];
  filterFn?: (row: T, value: string) => boolean;
  defaultFilter?: string;
  defaultSort?: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  mobileCard?: (row: T) => React.ReactNode;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
  bare?: boolean;
}

const hideClass = { md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" };

/**
 * Generic table with search, filter chips, sorting, pagination, row actions,
 * empty states and an optional card layout on mobile.
 */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  searchPlaceholder = "Search",
  searchFn,
  filters,
  filterFn,
  defaultFilter = "all",
  defaultSort,
  pageSize = 10,
  onRowClick,
  rowActions,
  mobileCard,
  toolbar,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  className,
  bare,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState(defaultFilter);
  const [sort, setSort] = React.useState(defaultSort);
  const [page, setPage] = React.useState(1);

  const counts = React.useMemo(() => {
    if (!filters || !filterFn) return {};
    return Object.fromEntries(filters.map((f) => [f.value, f.value === "all" ? data.length : data.filter((r) => filterFn(r, f.value)).length]));
  }, [data, filters, filterFn]);

  const rows = React.useMemo(() => {
    let out = data;
    if (filters && filterFn && filter !== "all") out = out.filter((r) => filterFn(r, filter));
    const q = query.trim().toLowerCase();
    if (q && searchFn) out = out.filter((r) => searchFn(r, q));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const get = col.sortValue;
        out = [...out].sort((a, b) => {
          const va = get(a);
          const vb = get(b);
          const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [data, filters, filterFn, filter, query, searchFn, sort, columns]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);

  React.useEffect(() => setPage(1), [query, filter]);

  const toggleSort = (key: string) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  };

  const Wrapper = bare ? "div" : Card;

  return (
    <Wrapper className={cn("overflow-hidden", className)}>
      {(searchFn || filters || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {searchFn && (
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} className="h-9 pr-8 pl-9" aria-label={searchPlaceholder} />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-ink" aria-label="Clear search">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )}
            {toolbar && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{toolbar}</div>}
          </div>
          {filters && (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 scrollbar-thin" role="tablist" aria-label="Filter">
              {filters.map((f) => (
                <button
                  key={f.value}
                  role="tab"
                  aria-selected={filter === f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors",
                    filter === f.value ? "border-navy bg-navy text-white" : "border-line bg-white text-ink-soft hover:border-line-strong",
                  )}
                >
                  {f.label}
                  {counts[f.value] !== undefined && <span className={cn("tabular text-xs", filter === f.value ? "text-white/70" : "text-muted")}>{counts[f.value]}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState title={query || filter !== "all" ? "No matching results" : emptyTitle} description={query || filter !== "all" ? "Try a different search term or filter." : emptyDescription} action={query || filter !== "all" ? undefined : emptyAction} />
      ) : (
        <>
          {mobileCard && <ul className="divide-y divide-line md:hidden">{visible.map((row) => <li key={getRowId(row)}>{mobileCard(row)}</li>)}</ul>}
          <div className={cn("overflow-x-auto scrollbar-thin", mobileCard && "hidden md:block")}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface/70">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={cn("px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-muted", c.align === "right" && "text-right", c.hideBelow && hideClass[c.hideBelow], c.className)}
                      aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                    >
                      {c.sortValue ? (
                        <button type="button" onClick={() => toggleSort(c.key)} className={cn("inline-flex items-center gap-1 hover:text-ink", c.align === "right" && "flex-row-reverse")}>
                          {c.header}
                          {sort?.key === c.key ? sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-50" />}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                  {rowActions && <th className="w-12 px-4 py-2.5" aria-label="Actions" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((row) => (
                  <tr
                    key={getRowId(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-surface/70")}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 align-middle", c.align === "right" && "text-right", c.hideBelow && hideClass[c.hideBelow], c.className)}>
                        {c.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {rows.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted">
          <span className="tabular">
            {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon-sm" onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Previous page">
              <ChevronLeft />
            </Button>
            <span className="px-2 font-semibold text-ink tabular">
              {current} / {pages}
            </span>
            <Button variant="secondary" size="icon-sm" onClick={() => setPage(current + 1)} disabled={current === pages} aria-label="Next page">
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </Wrapper>
  );
}
