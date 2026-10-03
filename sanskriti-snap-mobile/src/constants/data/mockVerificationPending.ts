// src/data/mockVerificationPending.ts

export interface VerificationPendingData {
  submittedImageUri: string;
  placeName: string;
  location: string;
  verificationStatus: "pending" | "verifying" | "analyzing";
  progressPercentage: number;
  currentStep: string;
  estimatedTime?: string;
  xpReward: number;
}

export const MOCK_VERIFICATION_PENDING: VerificationPendingData = {
  submittedImageUri:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
  placeName: "Krishna Mandir",
  location: "Patan, Nepal",
  verificationStatus: "verifying",
  progressPercentage: 45,
  currentStep: "Analyzing visual geometry",
  estimatedTime: "2-3 minutes",
  xpReward: 150,
};
