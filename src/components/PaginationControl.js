"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getPages(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const filtered = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < filtered.length; i++) {
    const curr = filtered[i];
    const prev = filtered[i - 1];

    if (prev && curr - prev > 1) result.push("...");
    result.push(curr);
  }
  return result;
}

export default function PaginationControl({ page, totalPages, onPageChange }) {
  const safePage = clamp(page, 1, totalPages);
  const pages = getPages(safePage, totalPages);

  const goTo = (nextPage) => {
    const p = clamp(nextPage, 1, totalPages);
    // mantenemos tu firma (event, value) como MUI:
    onPageChange?.(null, p);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex justify-center">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                goTo(safePage - 1);
              }}
              aria-disabled={safePage === 1}
              className={safePage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {pages.map((p, idx) =>
            p === "..." ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === safePage}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(p);
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                goTo(safePage + 1);
              }}
              aria-disabled={safePage === totalPages}
              className={safePage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
