// src/data/mockVerificationFailed.ts

export interface VerificationFailedData {
  distanceRemaining: number; // in meters
  artifactName: string;
  mapImageUrl: string;
  instructionText: string;
}

export const MOCK_VERIFICATION_FAILED: VerificationFailedData = {
  distanceRemaining: 65,
  artifactName: "Golden Gate",
  mapImageUrl:
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80", // Generic map-like image
  instructionText:
    "To verify your discovery, please move a bit closer to the Golden Gate.",
};
