/**
 * CV service client instantiation and helper functions.
 */

import { createCvClient, type CvClient } from "./cv-contract";
import { env } from "./env";

let cachedCvClient: CvClient | null = null;

export function getCvClient(): CvClient {
  if (cachedCvClient) return cachedCvClient;

  const e = env();
  cachedCvClient = createCvClient({
    baseUrl: e.CV_SERVICE_URL,
    secret: e.CV_SERVICE_SECRET,
  });

  return cachedCvClient;
}
