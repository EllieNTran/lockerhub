import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "mt-8",
}: PaginationControlsProps) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const windowStart = Math.floor((currentPage - 1) / 3) * 3 + 1;

    const pages: (number | 'ellipsis-end')[] = [];
    
    if (windowStart === 1) {
      pages.push(1, 2, 3);
      if (totalPages > 4) pages.push('ellipsis-end');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(windowStart, windowStart + 1, windowStart + 2);
      pages.push('ellipsis-end');
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) {
                onPageChange(1);
              }
            }}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
        
        <PaginationItem>
          <PaginationPrevious 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) {
                onPageChange(currentPage - 1);
              }
            }}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
        
        {pageNumbers.map((page, _) => {
          if (page === 'ellipsis-end') {
            return (
              <PaginationItem key="ellipsis-end">
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          
          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page);
                }}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        
        <PaginationItem>
          <PaginationNext 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) {
                onPageChange(currentPage + 1);
              }
            }}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
        
        <PaginationItem>
          <PaginationLast
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) {
                onPageChange(totalPages);
              }
            }}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationControls;
