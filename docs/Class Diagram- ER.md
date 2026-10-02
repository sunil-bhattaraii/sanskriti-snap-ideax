```mermaid
classDiagram
    direction LR

    class User {
        +ObjectId _id
        +string clerkUserId
        +string username
        +string displayName
        +ProfileImage profileImage
        +Role role
        +AccountStatus accountStatus
        +number lifetimeXp
        +NotificationSettings notifications
        +Date createdAt
        +Date updatedAt
    }

    class Artifact {
        +ObjectId _id
        +string name
        +string slug
        +string description
        +string story
        +ArtifactCategory category
        +string[] tags
        +GeoPoint location
        +string humanReadableLocation
        +number altitudeMeters
        +number storyUnlockRadiusMeters
        +number verificationRadiusMeters
        +number xpReward
        +boolean requiresSnap
        +boolean requiresCV
        +CVConfiguration cvConfiguration
        +string[] referenceImageUrls
        +string warnings
        +ArtifactStatus status
        +number discoveryCount
        +ObjectId createdBy
        +ObjectId updatedBy
        +Date createdAt
        +Date updatedAt
    }

    class ArtifactReference {
        +ObjectId _id
        +ObjectId artifactId
        +string imageUrl
        +string cloudinaryPublicId
        +number[] embedding
        +number embeddingDimension
        +CVModel cvModel
        +Date createdAt
        +Date updatedAt
    }

    class VerificationAttempt {
        +ObjectId _id
        +ObjectId userId
        +ObjectId artifactId
        +VerificationImage verificationImage
        +AdditionalPhoto[] additionalPhotos
        +LocationEvidence locationEvidence
        +GPSVerification gpsVerification
        +CVVerification cvVerification
        +VerificationStatus status
        +string rejectionReason
        +Review review
        +Date capturedAt
        +Date submittedAt
        +Date createdAt
        +Date updatedAt
    }

    class Discovery {
        +ObjectId _id
        +ObjectId userId
        +ObjectId artifactId
        +ObjectId verificationAttemptId
        +Date discoveredAt
        +number xpAwarded
        +Date createdAt
    }

    class Quest {
        +ObjectId _id
        +string name
        +string description
        +ObjectId[] artifactIds
        +number xpReward
        +ObjectId badgeId
        +QuestStatus status
        +Date createdAt
        +Date updatedAt
    }

    class UserQuestProgress {
        +ObjectId _id
        +ObjectId userId
        +ObjectId questId
        +ObjectId[] discoveredArtifactIds
        +Date completedAt
        +Date createdAt
        +Date updatedAt
    }

    class Badge {
        +ObjectId _id
        +string name
        +string description
        +string iconUrl
        +BadgeCondition condition
        +BadgeStatus status
        +Date createdAt
        +Date updatedAt
    }

    class UserBadge {
        +ObjectId _id
        +ObjectId userId
        +ObjectId badgeId
        +Date earnedAt
    }

    class XPTransaction {
        +ObjectId _id
        +ObjectId userId
        +number amount
        +XPTransactionType type
        +string referenceType
        +ObjectId referenceId
        +Date createdAt
    }

    class Contribution {
        +ObjectId _id
        +ObjectId submittedBy
        +string name
        +string description
        +string category
        +string[] tags
        +GeoPoint location
        +string humanReadableLocation
        +string culturalSignificance
        +ContributionPhoto[] photos
        +ContributionStatus status
        +Review review
        +ObjectId officialArtifactId
        +Date createdAt
        +Date updatedAt
    }

    class CommunitySnap {
        +ObjectId _id
        +ObjectId userId
        +ObjectId artifactId
        +ObjectId verificationAttemptId
        +Media media
        +string caption
        +CommunitySnapStatus status
        +Date createdAt
        +Date updatedAt
    }

    class Report {
        +ObjectId _id
        +ObjectId reporterId
        +ReportTargetType targetType
        +ObjectId targetId
        +ReportReason reason
        +string description
        +ReportStatus status
        +ObjectId reviewedBy
        +Date reviewedAt
        +Date createdAt
        +Date updatedAt
    }

    class AdminAction {
        +ObjectId _id
        +ObjectId adminId
        +AdminActionType action
        +string targetType
        +ObjectId targetId
        +object metadata
        +Date createdAt
    }


    %% =========================
    %% USER RELATIONSHIPS
    %% =========================

    User "1" --> "0..*" VerificationAttempt : submits
    User "1" --> "0..*" Discovery : owns
    User "1" --> "0..*" UserQuestProgress : has
    User "1" --> "0..*" UserBadge : earns
    User "1" --> "0..*" XPTransaction : receives
    User "1" --> "0..*" Contribution : submits
    User "1" --> "0..*" CommunitySnap : publishes
    User "1" --> "0..*" Report : creates
    User "1" --> "0..*" AdminAction : performs


    %% =========================
    %% ARTIFACT RELATIONSHIPS
    %% =========================

    Artifact "1" --> "0..*" ArtifactReference : has CV references
    Artifact "1" --> "0..*" VerificationAttempt : verified against
    Artifact "1" --> "0..*" Discovery : collected as
    Artifact "1" --> "0..*" CommunitySnap : appears in

    %% Quest contains multiple artifacts
    Quest "1" --> "1..*" Artifact : contains

    %% =========================
    %% VERIFICATION
    %% =========================

    VerificationAttempt "1" --> "0..1" Discovery : produces
    VerificationAttempt "1" --> "0..*" CommunitySnap : may produce

    %% =========================
    %% QUESTS
    %% =========================

    Quest "1" --> "0..*" UserQuestProgress : tracked by
    Quest "0..1" --> "0..1" Badge : awards

    UserQuestProgress "1" --> "0..*" Artifact : tracks discoveries


    %% =========================
    %% BADGES
    %% =========================

    Badge "1" --> "0..*" UserBadge : awarded to


    %% =========================
    %% CONTRIBUTIONS
    %% =========================

    Contribution "0..1" --> "0..1" Artifact : becomes


    %% =========================
    %% REPORTS
    %% =========================

    Report "0..*" --> "0..1" CommunitySnap : may target
    Report "0..*" --> "0..1" VerificationAttempt : may target
    Report "0..*" --> "0..1" Contribution : may target
    Report "0..*" --> "0..1" Artifact : may target```