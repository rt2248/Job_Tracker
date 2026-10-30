import React from "react"
import Card from "../shared/Card"
import Button from "../shared/Button"
import { formatDate } from "../../utils/formatDate"

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "—"
  if (bytes === 0) return "0 KB"
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

const ResumeHeader = () => (
  <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-ink border border-border-subtle">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div>
        <h3 className="text-base font-semibold font-display text-ink">Resume & Attachment</h3>
        <p className="text-[11px] text-muted font-sans">Attached resume for opportunity tracking and applications</p>
      </div>
    </div>
    <span className="text-[11px] font-mono text-muted bg-surface-secondary px-2.5 py-1 rounded-md border border-border-primary/50">
      PDF • Max 5MB
    </span>
  </div>
)

const ResumeLoadingState = () => (
  <div className="flex items-center justify-center py-8">
    <div className="flex items-center gap-2.5 text-xs text-muted font-sans">
      <svg className="animate-spin h-4 w-4 text-ink" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span>Loading resume details...</span>
    </div>
  </div>
)

const StagedReplacementBanner = ({ selectedFile, isUploading, onUpload, onCancel }) => (
  <div className="p-3.5 rounded-xl border border-dashed border-border-primary bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
    <div className="min-w-0">
      <span className="text-[11px] uppercase tracking-wider text-muted font-mono block">Selected Replacement</span>
      <p className="text-xs font-mono text-ink font-medium truncate mt-0.5" title={selectedFile.name}>
        {selectedFile.name} <span className="text-muted font-sans font-normal">({formatFileSize(selectedFile.size)})</span>
      </p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <Button variant="primary" size="sm" onClick={onUpload} isLoading={isUploading} className="h-8 text-xs">
        Confirm Replace
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={isUploading} className="h-8 text-xs text-muted hover:text-ink">
        Cancel
      </Button>
    </div>
  </div>
)

const ActiveResumeRow = ({
  resume,
  isViewing,
  isUploading,
  isDeleting,
  onViewResume,
  onReplaceClick,
  onRequestDelete,
}) => (
  <div className="p-4 rounded-xl bg-surface-secondary/60 border border-border-primary flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-ink shrink-0 border border-border-subtle shadow-sm">
        <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-mono text-ink font-medium truncate" title={resume.filename}>
          {resume.filename}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-muted font-sans mt-0.5">
          <span>{formatFileSize(resume.size)}</span>
          <span>•</span>
          <span>Uploaded {formatDate(resume.uploadedAt)}</span>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
      <Button
        variant="secondary"
        size="sm"
        onClick={onViewResume}
        isLoading={isViewing}
        disabled={isUploading || isDeleting}
        className="h-8 text-xs px-3"
        title="View resume in new tab"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        View
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onReplaceClick}
        disabled={isUploading || isViewing || isDeleting}
        className="h-8 text-xs px-3"
      >
        Replace
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onRequestDelete}
        disabled={isUploading || isViewing || isDeleting}
        className="h-8 text-xs px-3 cursor-pointer"
      >
        Remove
      </Button>
    </div>
  </div>
)

const ResumeEmptyState = ({ selectedFile, isUploading, onUpload, onCancel, onUploadClick }) => {
  if (selectedFile) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-border-primary bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
        <div className="min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-muted font-mono block">Selected Resume</span>
          <p className="text-xs font-mono text-ink font-medium truncate mt-0.5" title={selectedFile.name}>
            {selectedFile.name} <span className="text-muted font-sans font-normal">({formatFileSize(selectedFile.size)})</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="primary" size="sm" onClick={onUpload} isLoading={isUploading} className="h-8 text-xs">
            Upload Resume
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isUploading} className="h-8 text-xs text-muted hover:text-ink">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 rounded-xl border border-dashed border-border-primary bg-surface-secondary/20 flex flex-col items-center justify-center text-center">
      <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-center text-muted mb-3 shadow-inner">
        <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-ink">No resume uploaded</p>
      <p className="text-xs text-muted mt-0.5 max-w-sm font-sans">
        Upload your resume in PDF format (up to 5 MB) to attach when tracking opportunities.
      </p>
      <Button variant="outline" size="sm" onClick={onUploadClick} className="mt-4 text-xs font-medium">
        + Upload Resume
      </Button>
    </div>
  )
}

const ResumeSection = ({
  resume,
  isLoadingResume,
  isUploading,
  isViewing,
  isDeleting,
  selectedFile,
  onSelectFile,
  onCancelSelected,
  onUpload,
  onViewResume,
  onRequestDelete,
  fileInputRef,
}) => {
  return (
    <Card className="bg-surface border-border-primary rounded-2xl p-5 sm:p-6 shadow-sm">
      <ResumeHeader />

      {isLoadingResume ? (
        <ResumeLoadingState />
      ) : resume ? (
        <div className="flex flex-col gap-3">
          <ActiveResumeRow
            resume={resume}
            isViewing={isViewing}
            isUploading={isUploading}
            isDeleting={isDeleting}
            onViewResume={onViewResume}
            onReplaceClick={() => fileInputRef.current?.click()}
            onRequestDelete={onRequestDelete}
          />
          {selectedFile && (
            <StagedReplacementBanner
              selectedFile={selectedFile}
              isUploading={isUploading}
              onUpload={onUpload}
              onCancel={onCancelSelected}
            />
          )}
        </div>
      ) : (
        <ResumeEmptyState
          selectedFile={selectedFile}
          isUploading={isUploading}
          onUpload={onUpload}
          onCancel={onCancelSelected}
          onUploadClick={() => fileInputRef.current?.click()}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onSelectFile}
      />
    </Card>
  )
}

export default ResumeSection
