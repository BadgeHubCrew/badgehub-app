import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav
      className="mt-10 flex justify-center"
      aria-label="Pagination"
      data-testid="pagination"
    >
      <div className="join">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="join-item btn"
          data-testid="pagination-prev"
        >
          <span className="sr-only">Previous</span>
          «
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`join-item btn${page === currentPage ? " btn-active" : ""}`}
            data-testid={`pagination-page-${page}`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() =>
            currentPage < totalPages && onPageChange(currentPage + 1)
          }
          disabled={currentPage === totalPages}
          className="join-item btn"
          data-testid="pagination-next"
        >
          <span className="sr-only">Next</span>
          »
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
