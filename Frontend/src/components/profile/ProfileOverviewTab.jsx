import React from "react"
import ProfileIdentityCard from "./ProfileIdentityCard"
import DeveloperSnapshotCard from "./DeveloperSnapshotCard"
import ResumeSection from "./ResumeSection"
import OpportunityPreferencesCard from "./OpportunityPreferencesCard"
import AccountSessionCard from "./AccountSessionCard"

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Identity Card */}
      <div className="lg:col-span-5 self-start space-y-6">
        <ProfileIdentityCard
          userData={userData}
          isLoadingUser={isLoadingUser}
        />
      </div>

      {/* Right Column: Developer Snapshot, Resume, Preferences */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <DeveloperSnapshotCard
          profileData={userData}
          onNavigateToEdit={onNavigateToEdit}
        />

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

        <OpportunityPreferencesCard
          returnPromptsEnabled={returnPromptsEnabled}
          onToggleReturnPrompts={onToggleReturnPrompts}
        />

        <AccountSessionCard
          onRequestSignOut={onRequestSignOut}
        />
      </div>
    </div>
  )
}

export default ProfileOverviewTab
