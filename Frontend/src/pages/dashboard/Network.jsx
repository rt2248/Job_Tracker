import React from "react"
import Card from "../../components/shared/Card"
import Button from "../../components/shared/Button"
import Badge from "../../components/shared/Badge"

const Network = () => {
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl sm:text-2xl text-ink font-semibold tracking-tight">
              Professional Network
            </h1>
            <p className="text-muted text-xs sm:text-sm mt-0.5 font-sans">
              Track contacts, referrals, and recruiters connected to your job search.
            </p>
          </div>
          <Badge variant="indigo" size="md">
            0 Contacts
          </Badge>
        </div>

        {/* Empty Network State Container */}
        <Card className="bg-surface/80 border-border-primary rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-sm my-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo/15 border border-indigo/30 flex items-center justify-center text-indigo mb-4 shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-ink font-display tracking-tight mb-2">
            No Contacts Added Yet
          </h2>
          <p className="text-muted text-xs sm:text-sm max-w-md mb-6 leading-relaxed font-sans">
            Connect with interviewers, recruiters, and referral contacts to manage your outreach effectively.
          </p>
          <Button variant="primary" size="md">
            + Add New Contact
          </Button>
        </Card>

      </div>
    </main>
  )
}

export default Network
