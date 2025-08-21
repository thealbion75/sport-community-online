/**
 * MobilePagination Component
 * Touch-friendly pagination component optimized for mobile devices
 */

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MobilePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageSize?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const MobilePagination: React.FC<MobilePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  showPageSize = false,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50]
}) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Generate page numbers to show
  const getVisiblePages = () => {
    const delta = 1; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Always show first page
    range.push(1);

    // Add pages around current page
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // Always show last page if there are multiple pages
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Remove duplicates and sort
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

    // Add dots where there are gaps
    let prev = 0;
    for (const page of uniqueRange) {
      if (page - prev > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(page);
      prev = page;
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Mobile-first pagination controls */}
      <div className="flex items-center justify-between">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="min-h-[44px] touch-manipulation flex-1 max-w-[120px]"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </Button>

        {/* Page indicator and quick jump */}
        <div className="flex items-center gap-2 mx-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Page
          </span>
          
          {/* Mobile: Dropdown for page selection */}
          <div className="block sm:hidden">
            <Select
              value={currentPage.toString()}
              onValueChange={(value) => onPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-16 h-10 touch-manipulation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <SelectItem key={page} value={page.toString()}>
                    {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Page numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {visiblePages.map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                ) : (
                  <Button
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className="min-w-[40px] h-10 touch-manipulation"
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>

          <span className="text-sm text-muted-foreground whitespace-nowrap">
            of {totalPages}
          </span>
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="min-h-[44px] touch-manipulation flex-1 max-w-[120px]"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Page size selector */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="w-20 h-10 touch-manipulation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      )}

      {/* Page info for mobile */}
      <div className="text-center text-xs text-muted-foreground sm:hidden">
        Showing page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default MobilePagination;