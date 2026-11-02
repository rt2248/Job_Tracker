/**
 * Skill Matcher Utility for Job Tracker Insights
 *
 * Implements conservative, rule-based skill normalization, tripartite requirement
 * classification, and match fit evaluation.
 *
 * No external AI services, embeddings, or third-party APIs.
 */

// Curated technical vocabulary mapping variants, abbreviations, and synonyms
// to standardized canonical skill identifiers.
const CANONICAL_SKILL_SYNONYMS = {
    // Web & Languages
    "react": "react",
    "reactjs": "react",
    "react.js": "react",
    "nodejs": "node.js",
    "node.js": "node.js",
    "node": "node.js",
    "javascript": "javascript",
    "js": "javascript",
    "typescript": "typescript",
    "ts": "typescript",
    "python": "python",
    "java": "java",
    "c++": "c++",
    "c#": "c#",
    "swift": "swift",
    "kotlin": "kotlin",
    "go": "go",
    "golang": "go",
    "ruby": "ruby",
    "php": "php",
    "rust": "rust",
    "html": "html",
    "css": "css",

    // Frameworks & Libraries
    "express": "express",
    "expressjs": "express",
    "express.js": "express",
    "vue": "vue",
    "vuejs": "vue",
    "vue.js": "vue",
    "angular": "angular",
    "angularjs": "angular",
    "next.js": "next.js",
    "nextjs": "next.js",
    "tailwind": "tailwind",
    "tailwindcss": "tailwind",
    "tailwind css": "tailwind",
    "redux": "redux",
    "django": "django",
    "flask": "flask",
    "spring": "spring",
    "spring boot": "spring",

    // Databases & Architecture
    "postgresql": "postgresql",
    "postgres": "postgresql",
    "mongodb": "mongodb",
    "mongo": "mongodb",
    "sql": "sql",
    "mysql": "mysql",
    "redis": "redis",
    "graphql": "graphql",
    "rest api": "rest api",
    "restful api": "rest api",
    "api design": "rest api",
    "apis": "rest api",
    "api": "rest api",
    "microservices": "microservices",

    // DevOps & Cloud
    "docker": "docker",
    "kubernetes": "kubernetes",
    "k8s": "kubernetes",
    "aws": "aws",
    "gcp": "gcp",
    "google cloud": "gcp",
    "azure": "azure",
    "linux": "linux",
    "ci/cd": "ci/cd",
    "cicd": "ci/cd",
    "git": "git",
    "github": "git",
    "gitlab": "git",

    // Design & Testing
    "figma": "figma",
    "excel": "excel",
    "jest": "jest",
};

// Sort vocabulary keys by descending character length so that multi-word keys
// (e.g. "rest api", "api design") are evaluated before shorter substrings ("api").
const KNOWN_VOCAB_KEYS = Object.keys(CANONICAL_SKILL_SYNONYMS).sort((a, b) => b.length - a.length);

/**
 * Standardizes a raw skill string to its canonical synonym if recognized.
 * Returns canonical skill string, or null if outside curated vocabulary.
 * @param {string} raw
 * @returns {string|null}
 */
function normalizeSkillToken(raw) {
    if (!raw || typeof raw !== "string") return null;
    const clean = raw.trim().toLowerCase();
    return CANONICAL_SKILL_SYNONYMS[clean] || null;
}

/**
 * Classifies listing tags and requirement strings into three mutually exclusive categories:
 * 1. Identifiable Skills: Curated technical vocabulary matching canonical tools.
 * 2. Qualitative Requirements: Soft skills, logistics, working hours, and degree credentials.
 * 3. Unrecognized Technical Terms: Technical requirements and tools not present in the curated vocabulary.
 *
 * @param {string[]} [tags=[]]
 * @param {string[]} [requirements=[]]
 * @returns {{
 *   identifiableSkills: string[],
 *   qualitativeRequirements: string[],
 *   unrecognizedTechnicalTerms: string[]
 * }}
 */
function parseAndClassifyListing(tags = [], requirements = []) {
    const identifiableSkills = new Set();
    const qualitativeRequirements = [];
    const unrecognizedTechnicalTerms = [];

    // 1. Process discrete structured tags (highest confidence)
    if (Array.isArray(tags)) {
        for (const tag of tags) {
            if (!tag || typeof tag !== "string") continue;
            const canonical = normalizeSkillToken(tag);
            if (canonical) {
                identifiableSkills.add(canonical);
            } else if (tag.trim()) {
                unrecognizedTechnicalTerms.push(tag.trim());
            }
        }
    }

    // 2. Parse unstructured requirement sentences
    if (Array.isArray(requirements)) {
        for (const req of requirements) {
            if (!req || typeof req !== "string") continue;
            const normReq = req.toLowerCase();
            let matchedVocabInSentence = false;

            for (const vocabKey of KNOWN_VOCAB_KEYS) {
                // Context-sensitive guard: "go" requires programming context
                if (vocabKey === "go") {
                    if (/\b(golang|go\s+programming|go\s+language)\b/i.test(normReq)) {
                        identifiableSkills.add("go");
                        matchedVocabInSentence = true;
                    }
                    continue;
                }

                const escaped = vocabKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const boundaryRegex = new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i");
                if (boundaryRegex.test(normReq)) {
                    identifiableSkills.add(CANONICAL_SKILL_SYNONYMS[vocabKey]);
                    matchedVocabInSentence = true;
                }
            }

            // If no curated skill matched, categorize as qualitative vs unrecognized technical term
            if (!matchedVocabInSentence) {
                const isToolOrTechSentence = /\b(experience with|knowledge of|hands-on with|proficient in|skilled in|using|tools?|technolog(?:y|ies)|frameworks?|libraries|platforms?)\b/i.test(normReq);
                const isQualitativeSentence = /\b(communication|interviews|reporting|flexible|hours|collaborat|team|leadership|problem-solving|critical thinking|degree|bachelor|master|phd|diploma|relocat|part-time|full-time|written|verbal|presentation)\b/i.test(normReq);

                if (isQualitativeSentence && !isToolOrTechSentence) {
                    qualitativeRequirements.push(req.trim());
                } else {
                    unrecognizedTechnicalTerms.push(req.trim());
                }
            }
        }
    }

    return {
        identifiableSkills: Array.from(identifiableSkills),
        qualitativeRequirements,
        unrecognizedTechnicalTerms,
    };
}

/**
 * Computes skill fit percentage and returns matched and missing skills.
 * Evaluates strictly against identifiable skills.
 *
 * @param {string[]} [userDeclaredSkills=[]]
 * @param {string[]} [identifiableSkills=[]]
 * @returns {{
 *   totalIdentifiable: number,
 *   matchedSkills: string[],
 *   missingSkills: string[],
 *   matchPercentage: number|null
 * }}
 */
function computeMatchFit(userDeclaredSkills = [], identifiableSkills = []) {
    const userNormalized = new Set(
        (Array.isArray(userDeclaredSkills) ? userDeclaredSkills : [])
            .map(normalizeSkillToken)
            .filter(Boolean)
    );

    const matchedSkills = [];
    const missingSkills = [];

    const targetSkills = Array.isArray(identifiableSkills) ? identifiableSkills : [];

    for (const skill of targetSkills) {
        if (userNormalized.has(skill)) {
            matchedSkills.push(skill);
        } else {
            missingSkills.push(skill);
        }
    }

    const total = targetSkills.length;
    const matchPercentage = total > 0 ? Math.round((matchedSkills.length / total) * 100) : null;

    return {
        totalIdentifiable: total,
        matchedSkills,
        missingSkills,
        matchPercentage,
    };
}

module.exports = {
    CANONICAL_SKILL_SYNONYMS,
    normalizeSkillToken,
    parseAndClassifyListing,
    computeMatchFit,
};
