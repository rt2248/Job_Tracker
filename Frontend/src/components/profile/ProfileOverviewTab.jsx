import React, { useMemo } from "react"
import ProfileIdentityCard from "./ProfileIdentityCard"
import ProfileCompletenessCard from "./ProfileCompletenessCard"
import DeveloperSnapshotCard from "./DeveloperSnapshotCard"
import ResumeSection from "./ResumeSection"
import OpportunityPreferencesCard from "./OpportunityPreferencesCard"
import AccountSessionCard from "./AccountSessionCard"
import { calculateProfileCompleteness } from "../../utils/profileCompleteness"

const ProfileOverviewTab = ({
  userData,
  isLoadingUser,
  resume,
  isLoadingResume,
  isUploadingResume,
  isViewingResume,
  isDeletingResume,
  selectedResumeFile,
  onSelectResumeFile,
  onCancelSelectedResume,
  onUploadResume,
  onViewResume,
  onRequestDeleteResume,
  resumeFileInputRef,
  returnPromptsEnabled,
  onToggleReturnPrompts,
  onRequestSignOut,
  onNavigateToEdit,
}) => {
  // Calculate completeness derived strictly from actual profile and resume records
  const completeness = useMemo(() => {
    return calculateProfileCompleteness(userData, resume)
  }, [userData, resume])

  const handleNavigateToSection = (item) => {
    if (!onNavigateToEdit) return
    onNavigateToEdit(item.anchorId)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)] gap-6 lg:gap-8 lg:h-full lg:min-h-0 items-start">
      {/* Left Column — Persistent Stationary Profile Card */}
      <aside
        aria-label="Persistent Profile Card"
        className="w-full lg:h-full lg:overflow-y-auto custom-scrollbar lg:pb-2"
      >
        <ProfileIdentityCard
          userData={userData}
          isLoadingUser={isLoadingUser}
          onNavigateToEdit={() => onNavigateToEdit()}
        />
      </aside>

      {/* Right Column — Independently Scrollable Overview Sections */}
      <div
        data-testid="overview-right-scroll"
        className="w-full min-w-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 pb-4 lg:pb-6 flex flex-col gap-6 sm:gap-8"
      >
        {/* 1. Profile Completeness Ledger */}
        <ProfileCompletenessCard
          completeness={completeness}
          onNavigateToSection={handleNavigateToSection}
        />

        {/* 2. Developer Technical Snapshot & Work History */}
        <DeveloperSnapshotCard
          profileData={userData}
          onNavigateToEdit={() => onNavigateToEdit()}
        />

        {/* 3. Resume & Document Management */}
        <ResumeSection
          resume={resume}
          isLoadingResume={isLoadingResume}
          isUploading={isUploadingResume}
          isViewing={isViewingResume}
          isDeleting={isDeletingResume}
          selectedFile={selectedResumeFile}
          onSelectFile={onSelectResumeFile}
          onCancelSelected={onCancelSelectedResume}
          onUpload={onUploadResume}
          onViewResume={onViewResume}
          onRequestDelete={onRequestDeleteResume}
          fileInputRef={resumeFileInputRef}
        />

        {/* 4. Opportunity & Session Controls Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
          <OpportunityPreferencesCard
            returnPromptsEnabled={returnPromptsEnabled}
            onToggleReturnPrompts={onToggleReturnPrompts}
            className="h-full"
          />

          <AccountSessionCard
            onRequestSignOut={onRequestSignOut}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}

export default ProfileOverviewTab
