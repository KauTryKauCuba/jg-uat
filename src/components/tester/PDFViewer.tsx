"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle } from "lucide-react"
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  fileUrl: string
}

export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [error, setError] = useState<string | null>(null)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
    setError(null)
  }

  function onDocumentLoadError(error: Error) {
    setError("Failed to load PDF. Please make sure the file exists and is valid.")
  }

  function previousPage() {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }

  function nextPage() {
    if (numPages) {
      setPageNumber((prev) => Math.min(prev + 1, numPages))
    }
  }

  function zoomIn() {
    setScale((prev) => Math.min(prev + 0.25, 2.0))
  }

  function zoomOut() {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-100">
      {/* Scrollable PDF Container */}
      <div className="flex-1 overflow-auto flex justify-center p-8 pb-20">
        {!fileUrl ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <AlertCircle className="w-8 h-8 mb-2 text-gray-400" />
            <p>No reference document attached</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-600 max-w-md text-center">
            <AlertCircle className="w-10 h-10 mb-3 text-red-500" />
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0EA5E9] rounded-full animate-spin mb-4" />
                <p>Loading document...</p>
              </div>
            }
          >
            <div className="bg-white shadow-md mb-4 transition-transform duration-200 origin-top flex justify-center">
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="max-w-full"
              />
            </div>
          </Document>
        )}
      </div>

      {/* Control Bar (Fixed to bottom of this panel) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-4 py-3 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 text-gray-600 hover:text-[#0EA5E9] hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-600 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.0}
            className="p-1.5 text-gray-600 hover:text-[#0EA5E9] hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {numPages && (
          <div className="flex items-center gap-4">
            <button
              onClick={previousPage}
              disabled={pageNumber <= 1}
              className="p-1.5 text-gray-600 hover:text-[#0EA5E9] hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className="p-1.5 text-gray-600 hover:text-[#0EA5E9] hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
