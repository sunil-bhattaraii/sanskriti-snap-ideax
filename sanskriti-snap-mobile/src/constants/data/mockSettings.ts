// src/data/mockSettings.ts

export interface PolicyContent {
  lastUpdated: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
}

export const PRIVACY_POLICY: PolicyContent = {
  lastUpdated: "January 15, 2024",
  sections: [
    {
      title: "Information We Collect",
      content:
        "We collect information you provide directly to us, including your username, email address, and location data when you discover heritage sites.",
    },
    {
      title: "How We Use Your Information",
      content:
        "We use the information we collect to provide, maintain, and improve our services, including tracking your discoveries and progress.",
    },
    {
      title: "Data Security",
      content:
        "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access.",
    },
    {
      title: "Your Rights",
      content:
        "You have the right to access, update, or delete your personal information at any time through your account settings.",
    },
  ],
};

export const TERMS_OF_SERVICE: PolicyContent = {
  lastUpdated: "January 15, 2024",
  sections: [
    {
      title: "Acceptance of Terms",
      content:
        "By accessing and using Sanskriti Snap, you accept and agree to be bound by the terms and provision of this agreement.",
    },
    {
      title: "User Conduct",
      content:
        "You agree to use the app in accordance with all applicable laws and regulations. You must not misuse the app or submit false information.",
    },
    {
      title: "Intellectual Property",
      content:
        "All content, features, and functionality of the app are owned by Sanskriti Snap and are protected by copyright and intellectual property laws.",
    },
    {
      title: "Limitation of Liability",
      content:
        "Sanskriti Snap shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the app.",
    },
  ],
};

export const SUPPORT_CATEGORIES = [
  {
    id: "1",
    title: "FAQs",
    description: "Find answers to common questions",
    icon: "help-circle-outline",
  },
  {
    id: "2",
    title: "Contact Support",
    description: "Get in touch with our support team",
    icon: "mail-outline",
  },
  {
    id: "3",
    title: "Report a Bug",
    description: "Help us improve by reporting issues",
    icon: "bug-outline",
  },
  {
    id: "4",
    title: "Feature Request",
    description: "Suggest new features for the app",
    icon: "lightbulb-outline",
  },
];
