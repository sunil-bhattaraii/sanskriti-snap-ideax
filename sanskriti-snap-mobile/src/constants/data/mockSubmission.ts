// src/data/mockSubmission.ts

export interface SubmissionData {
  primaryImageUri?: string;
  galleryImages: string[];
  privateNote: string;
  isPublic: boolean;
  xpReward: number;
  placeName: string;
  location: string;
}

export const MOCK_SUBMISSION: SubmissionData = {
  primaryImageUri: undefined, // Will be captured from camera
  galleryImages: [
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=200",
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=200",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200",
  ],
  privateNote: "",
  isPublic: false,
  xpReward: 150,
  placeName: "Krishna Mandir",
  location: "Patan, Nepal",
};
