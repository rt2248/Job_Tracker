/**
 * Profile Completeness Utility
 *
 * Computes deterministic, evidence-based profile completeness percentages
 * and checklist statuses strictly using existing fields from user_profiles and users.
 * Never marks missing information as complete.
 */

export const PROFILE_COMPLETENESS_CATEGORIES = [
  {
    id: "personal",
    label: "Personal Information",
    description: "Legal first & last name",
    tab: "edit",
    anchorId: "edit-section-personal",
    check: (user) => Boolean(user?.firstName?.trim() && user?.lastName?.trim()),
  },
  {
    id: "headline",
    label: "Professional Headline",
    description: "Current role or target title",
    tab: "edit",
    anchorId: "edit-section-profile",
    check: (user) => Boolean(user?.headline?.trim()),
  },
  {
    id: "bio",
    label: "Professional Summary / Bio",
    description: "Career overview & focus areas",
    tab: "edit",
    anchorId: "edit-section-profile",
    check: (user) => Boolean(user?.bio?.trim()),
  },
  {
    id: "location",
    label: "Location",
    description: "City, state or primary timezone",
    tab: "edit",
    anchorId: "edit-section-profile",
    check: (user) => Boolean(user?.location?.trim()),
  },
  {
    id: "avatar",
    label: "Profile Picture",
    description: "Verified photo or avatar",
    tab: "edit",
    anchorId: "edit-section-avatar",
    check: (user) => Boolean(user?.avatarUrl?.trim()),
  },
  {
    id: "skills",
    label: "Skills & Technologies",
    description: "Core technical capabilities",
    tab: "edit",
    anchorId: "edit-section-skills",
    check: (user) => Array.isArray(user?.skills) && user.skills.length > 0,
  },
  {
    id: "experience",
    label: "Work Experience",
    description: "Professional career history",
    tab: "edit",
    anchorId: "edit-section-experience",
    check: (user) => Array.isArray(user?.experience) && user.experience.length > 0,
  },
  {
    id: "resume",
    label: "Resume Document",
    description: "Attached PDF for opportunities",
    tab: "overview",
    anchorId: "overview-section-resume",
    check: (user, resume) => Boolean(resume?.filename || user?.resume?.filename),
  },
  {
    id: "links",
    label: "Portfolio & Social Profiles",
    description: "GitHub, LinkedIn, or portfolio link",
    tab: "edit",
    anchorId: "edit-section-links",
    check: (user) => {
      if (user?.portfolioUrl?.trim() || user?.githubUrl?.trim() || user?.linkedinUrl?.trim() || user?.twitterUrl?.trim()) {
        return true;
      }
      const social = user?.socialLinks;
      if (social && typeof social === "object") {
        return Boolean(social.portfolio || social.github || social.linkedin || social.twitter);
      }
      return false;
    },
  },
];

/**
 * Calculates profile completeness score and category breakdown.
 *
 * @param {Object} userData - User profile object from /api/profile/me
 * @param {Object} resumeData - Resume metadata from /api/resume
 * @returns {Object} completeness result
 */
export function calculateProfileCompleteness(userData, resumeData) {
  if (!userData) {
    return {
      score: 0,
      completedCount: 0,
      totalCount: PROFILE_COMPLETENESS_CATEGORIES.length,
      statusLabel: "Profile Incomplete",
      statusVariant: "neutral",
      items: PROFILE_COMPLETENESS_CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        description: cat.description,
        completed: false,
        tab: cat.tab,
        anchorId: cat.anchorId,
      })),
    };
  }

  const items = PROFILE_COMPLETENESS_CATEGORIES.map((cat) => {
    const isCompleted = cat.check(userData, resumeData);
    return {
      id: cat.id,
      label: cat.label,
      description: cat.description,
      completed: isCompleted,
      tab: cat.tab,
      anchorId: cat.anchorId,
    };
  });

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const score = Math.round((completedCount / totalCount) * 100);

  let statusLabel = "Profile Incomplete";
  let statusVariant = "amber";

  if (score >= 90) {
    statusLabel = "All-Star Profile";
    statusVariant = "emerald";
  } else if (score >= 70) {
    statusLabel = "Strong Profile";
    statusVariant = "cyan";
  } else if (score >= 40) {
    statusLabel = "In Progress";
    statusVariant = "amber";
  } else {
    statusLabel = "Getting Started";
    statusVariant = "neutral";
  }

  return {
    score,
    completedCount,
    totalCount,
    statusLabel,
    statusVariant,
    items,
  };
}
