import { act, render, screen } from "@testing-library/react-native";
import NetInfo from "@react-native-community/netinfo";
import OfflineBanner from "../OfflineBanner";
import { getPendingUploadCount } from "@/services/upload-queue";

jest.mock("@react-native-community/netinfo", () => {
  let listener: ((state: { isConnected: boolean | null }) => void) | null = null;
  return {
    addEventListener: jest.fn((cb: typeof listener) => {
      listener = cb;
      return () => {
        listener = null;
      };
    }),
    __emit: (state: { isConnected: boolean | null }) => listener?.(state),
  };
});

jest.mock("@/services/upload-queue", () => ({
  getPendingUploadCount: jest.fn().mockResolvedValue(0),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 0, left: 0 }),
}));

const emit = (
  NetInfo as unknown as { __emit: (s: { isConnected: boolean }) => void }
).__emit;

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("OfflineBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getPendingUploadCount as jest.Mock).mockResolvedValue(0);
  });

  it("renders nothing while online", async () => {
    await render(<OfflineBanner />);
    await act(async () => emit({ isConnected: true }));
    await flush();
    expect(screen.queryByText("Offline - showing saved data")).toBeNull();
  });

  it("shows a banner with offline copy while disconnected", async () => {
    await render(<OfflineBanner />);
    await act(async () => emit({ isConnected: false }));
    await flush();
    expect(screen.getByText("Offline - showing saved data")).toBeTruthy();
  });

  it("shows how many submissions are queued", async () => {
    (getPendingUploadCount as jest.Mock).mockResolvedValue(2);
    await render(<OfflineBanner />);
    await act(async () => emit({ isConnected: false }));
    await flush();
    expect(screen.getByText("Offline - showing saved data")).toBeTruthy();
    expect(screen.getByText("· 2 queued uploads")).toBeTruthy();
  });

  it("hides again when connectivity returns", async () => {
    await render(<OfflineBanner />);
    await act(async () => emit({ isConnected: false }));
    await flush();
    expect(screen.getByText("Offline - showing saved data")).toBeTruthy();
    await act(async () => emit({ isConnected: true }));
    await flush();
    expect(screen.queryByText("Offline - showing saved data")).toBeNull();
  });
});