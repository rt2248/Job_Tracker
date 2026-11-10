import React from "react"
import Button from "../shared/Button"
import { formatDate } from "../../utils/formatDate"
import { cn } from "../../utils/cn"

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "—"
  if (bytes === 0) return "0 KB"
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

const ResumeHeader = () => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center text-cyan border border-border-subtle shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">
          Resume & Career Document
        </h3>
        <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
          Active document attached to your job opportunities and application pipeline.
        </p>
      </div>
    </div>
    <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
      <span className="text-xs font-mono font-semibold text-muted bg-surface-secondary px-2.5 py-1 rounded-md border border-border-subtle">
        PDF · Max 5MB
      </span>
    </div>
  </div>
)

const ResumeLoadingState = () => (
  <div className="flex items-center justify-center py-8">
    <div className="flex items-center gap-2.5 text-sm text-muted font-sans">
      <svg className="animate-spin h-4 w-4 text-cyan" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span>Loading resume details...</span>
    </div>
  </div>
)

const StagedReplacementBanner = ({ selectedFile, isUploading, onUpload, onCancel }) => (
  <div className="p-4 rounded-lg border border-dashed border-cyan/50 bg-cyan/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-cyan font-mono font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
        Staged Replacement Ready
      </div>
      <p className="text-sm font-mono text-ink font-semibold truncate mt-1" title={selectedFile.name}>
        {selectedFile.name} <span className="text-muted font-sans font-normal">({formatFileSize(selectedFile.size)})</span>
      </p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <Button variant="primary" size="sm" onClick={onUpload} isLoading={isUploading} className="h-8 text-xs font-semibold px-3">
        Confirm Replace
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={isUploading} className="h-8 text-xs text-muted hover:text-ink px-2.5">
        Cancel
      </Button>
    </div>
  </div>
)

const ActiveResumeCard = ({
  resume,
  isViewing,
  isUploading,
  isDeleting,
  onViewResume,
  onReplaceClick,
  onRequestDelete,
}) => (
  <div className="p-4 sm:p-5 rounded-lg bg-surface-secondary/40 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="flex items-start gap-3.5 min-w-0">
      <div className="w-11 h-11 rounded-lg bg-surface flex items-center justify-center text-cyan shrink-0 border border-border-subtle shadow-xs">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-base font-mono text-ink font-bold truncate max-w-sm sm:max-w-md" title={resume.filename}>
            {resume.filename}
          </p>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan/15 text-cyan border border-cyan/40">
            PDF
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted font-sans">
          <span className="font-mono text-ink-secondary">{formatFileSize(resume.size)}</span>
          <span>·</span>
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
        className="h-8.5 text-xs sm:text-sm px-3 gap-1.5"
        title="View resume in new tab"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        View
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onReplaceClick}
        disabled={isUploading || isViewing || isDeleting}
        className="h-8.5 text-xs sm:text-sm px-3"
      >
        Replace
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onRequestDelete}
        disabled={isUploading || isViewing || isDeleting}
        className="h-8.5 text-xs sm:text-sm px-3 cursor-pointer"
      >
        Remove
      </Button>
    </div>
  </div>
)

const ResumeEmptyState = ({ selectedFile, isUploading, onUpload, onCancel, onUploadClick }) => {
  if (selectedFile) {
    return (
      <div className="p-4 rounded-lg border border-dashed border-cyan/50 bg-cyan/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
        <div className="min-w-0">
          <span className="text-xs uppercase tracking-wider text-cyan font-mono font-bold block">Selected Resume Document</span>
          <p className="text-sm font-mono text-ink font-medium truncate mt-0.5" title={selectedFile.name}>
            {selectedFile.name} <span className="text-muted font-sans font-normal">({formatFileSize(selectedFile.size)})</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="primary" size="sm" onClick={onUpload} isLoading={isUploading} className="h-8 text-xs sm:text-sm font-semibold px-3">
            Upload Resume
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isUploading} className="h-8 text-xs sm:text-sm text-muted hover:text-ink px-2.5">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 sm:p-10 rounded-lg border border-dashed border-border-primary bg-surface-secondary/20 hover:bg-surface-secondary/30 transition-colors flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-center text-muted mb-3">
        <svg className="w-6 h-6 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p className="text-base sm:text-lg font-bold text-ink font-display">No resume uploaded</p>
      <p className="text-xs sm:text-sm text-muted mt-1 max-w-sm font-sans leading-relaxed">
        Upload your resume in PDF format (up to 5 MB) to attach when tracking opportunities and applications.
      </p>
      <Button variant="outline" size="sm" onClick={onUploadClick} className="mt-4 text-xs sm:text-sm font-medium gap-1.5 h-9 px-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 4v16m8-8H4" />
        </svg>
        Upload Resume
      </Button>
    </div>
  )
}

export default function ResumeSection({
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
  className,
}) {
  return (
    <section
      id="overview-section-resume"
      aria-label="Resume Document Management"
      className={cn(
        "bg-surface border border-border-primary rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6",
        className
      )}
    >
      <ResumeHeader />

      {isLoadingResume ? (
        <ResumeLoadingState />
      ) : resume ? (
        <div className="flex flex-col gap-3">
          <ActiveResumeCard
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
    </section>
  )
}
