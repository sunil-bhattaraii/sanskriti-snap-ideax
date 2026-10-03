"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Management, { type Section } from "./admin/Management";
import "./admin.css";

type DashboardStats = {
  users: number;
  publishedArtifacts: number;
  pendingContributions: number;
  flaggedVerifications: number;
  activeQuests: number;
};

type Artifact = {
  id: string;
  name: string;
  status: string;
  category: string;
  humanReadableLocation: string;
  createdAt: string;
  discoveryCount: number;
};

type ApiPayload<T> = {
  error?: { message?: string };
} & T;

async function fetchAdminData<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  const payload = (await response.json()) as ApiPayload<T>;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Unable to load admin data.");
  }

  return payload;
}

async function fetchDashboardData(signal?: AbortSignal) {
  const [overview, artifactList] = await Promise.all([
    fetchAdminData<{ stats: DashboardStats }>(
      "/api/v1/admin/overview",
      signal,
    ),
    fetchAdminData<{ items: Artifact[] }>(
      "/api/v1/admin/artifacts?limit=5",
      signal,
    ),
  ]);

  return { stats: overview.stats, artifacts: artifactList.items };
}

function Icon({
  name,
  size = 20,
}: {
  name: "dashboard" | "landmark" | "review" | "community" | "quest" | "badge" | "refresh" | "arrow" | "pin";
  size?: number;
}) {
  const paths: Record<typeof name, string> = {
    dashboard: "M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z",
    landmark: "M3 21h18M5 18h14M7 18v-7m5 7V7m5 11v-7M4 9l8-6 8 6z",
    review: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    community: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 10v-2a4 4 0 0 0-3-3.87m-1-13.13a4 4 0 0 1 0 7.75",
    quest: "m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6-4.36-4.25 6.03-.88L12 3z",
    badge: "M12 3 4.5 6v5.5c0 4.5 3.2 7.9 7.5 9.5 4.3-1.6 7.5-5 7.5-9.5V6L12 3zm-3 8 2 2 4-4",
    refresh: "M20 7v5h-5M4 17v-5h5m11-1a8 8 0 0 0-14.7-4M4 13a8 8 0 0 0 14.7 4",
    arrow: "M5 12h14m-7-7 7 7-7 7",
    pin: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path d="M6 15h28M9 15l11-8 11 8M12 15v11m8-11v11m8-11v11M7 26h26M4 32h32" />
        <path d="M15 7h10M17 4h6" />
      </svg>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function Dashboard({ displayName }: { displayName: string }) {
  const [activeSection, setActiveSection] = useState<"Overview" | Section>(
    "Overview",
  );
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const applyDashboardData = useCallback(
    (data: { stats: DashboardStats; artifacts: Artifact[] }) => {
      setError(null);
      setStats(data.stats);
      setArtifacts(data.artifacts);
      setLastUpdated(new Date());
    },
    [],
  );

  const showDashboardError = useCallback((loadError: unknown) => {
    if (loadError instanceof Error && loadError.name === "AbortError") return;
    setError(
      loadError instanceof Error
        ? loadError.message
        : "Unable to load admin data.",
    );
  }, []);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetchDashboardData(signal);
      applyDashboardData(data);
    } catch (loadError) {
      showDashboardError(loadError);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [applyDashboardData, showDashboardError]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchDashboardData(controller.signal)
      .then(applyDashboardData)
      .catch(showDashboardError)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [applyDashboardData, showDashboardError]);

  const cards = stats
    ? [
        {
          label: "Community members",
          value: stats.users,
          icon: "community" as const,
          tone: "terracotta",
          note: "Registered explorers",
        },
        {
          label: "Published places",
          value: stats.publishedArtifacts,
          icon: "landmark" as const,
          tone: "gold",
          note: "Discoverable locations",
        },
        {
          label: "Awaiting review",
          value: stats.pendingContributions,
          icon: "review" as const,
          tone: "rose",
          note: "Community submissions",
        },
        {
          label: "Flagged snaps",
          value: stats.flaggedVerifications,
          icon: "pin" as const,
          tone: "slate",
          note: "Verification checks",
        },
        {
          label: "Active quests",
          value: stats.activeQuests,
          icon: "quest" as const,
          tone: "sand",
          note: "Available adventures",
        },
      ]
    : [];

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Sanskriti Snap home">
          <BrandMark />
          <span className="brand-name">
            Sanskriti <strong>Snap</strong>
          </span>
        </a>

        <div className="sidebar-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Admin navigation">
          <button aria-label="Overview" className={`nav-item ${activeSection === "Overview" ? "active" : ""}`} onClick={() => setActiveSection("Overview")} type="button">
            <Icon name="dashboard" />
            <span>Overview</span>
          </button>
          <button aria-label="Places" className={`nav-item ${activeSection === "Places" ? "active" : ""}`} onClick={() => setActiveSection("Places")} type="button">
            <Icon name="landmark" />
            <span>Places</span>
          </button>
          <button aria-label="Review queue" className={`nav-item ${activeSection === "Reviews" ? "active" : ""}`} onClick={() => setActiveSection("Reviews")} type="button">
            <Icon name="review" />
            <span>Review queue</span>
            {stats && stats.pendingContributions + stats.flaggedVerifications > 0 && (
              <span className="nav-count">
                {stats.pendingContributions + stats.flaggedVerifications}
              </span>
            )}
          </button>
          <button aria-label="Community" className={`nav-item ${activeSection === "Community" ? "active" : ""}`} onClick={() => setActiveSection("Community")} type="button">
            <Icon name="community" />
            <span>Community</span>
          </button>
          <button aria-label="Quests" className={`nav-item ${activeSection === "Quests" ? "active" : ""}`} onClick={() => setActiveSection("Quests")} type="button">
            <Icon name="quest" />
            <span>Quests</span>
          </button>
          <button aria-label="Badges" className={`nav-item ${activeSection === "Badges" ? "active" : ""}`} onClick={() => setActiveSection("Badges")} type="button">
            <Icon name="badge" />
            <span>Badges</span>
          </button>
          <button aria-label="Users" className={`nav-item ${activeSection === "Users" ? "active" : ""}`} onClick={() => setActiveSection("Users")} type="button">
            <Icon name="community" />
            <span>Users</span>
          </button>
          <button aria-label="XP adjustments" className={`nav-item ${activeSection === "XP adjustments" ? "active" : ""}`} onClick={() => setActiveSection("XP adjustments")} type="button">
            <Icon name="quest" />
            <span>XP adjustments</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-dot" />
            <span>Admin workspace</span>
          </div>
          <p>Keeping Nepal&apos;s stories close, one discovery at a time.</p>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activeSection}</strong>
          </div>
          <div className="topbar-user">
            <span className="admin-label">Administrator</span>
            <UserButton />
          </div>
        </header>

        {activeSection === "Overview" ? <div className="dashboard-content">
          <section className="welcome-row" id="overview">
            <div>
              <div className="eyebrow">SANSKRITI SNAP · ADMIN</div>
              <h1>Namaste, {displayName}</h1>
              <p className="page-subtitle">
                Here&apos;s what&apos;s happening across your community today.
              </p>
            </div>
            <button
              className="refresh-button"
              onClick={() => {
                setLoading(true);
                void loadDashboard();
              }}
              disabled={loading}
              type="button"
            >
              <Icon name="refresh" size={17} />
              <span>{loading ? "Refreshing..." : "Refresh data"}</span>
            </button>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              <div>
                <strong>Dashboard data unavailable</strong>
                <p>{error}</p>
              </div>
              <button
                className="error-retry"
                onClick={() => {
                  setLoading(true);
                  void loadDashboard();
                }}
                type="button"
              >
                Try again
              </button>
            </div>
          )}

          <section className="stats-grid" aria-label="Platform summary">
            {cards.length
              ? cards.map((card) => (
                  <article className="stat-card" key={card.label}>
                    <div className="stat-card-top">
                      <span className="stat-label">{card.label}</span>
                      <span className={`stat-icon ${card.tone}`}>
                        <Icon name={card.icon} size={19} />
                      </span>
                    </div>
                    <div className="stat-value">
                      {card.value.toLocaleString()}
                    </div>
                    <div className="stat-note">{card.note}</div>
                  </article>
                ))
              : Array.from({ length: 5 }, (_, index) => (
                  <div className="stat-card stat-loading" key={index}>
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
          </section>

          <div className="content-grid">
            <section className="panel artifacts-panel" id="artifacts">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">CONTENT</div>
                  <h2>Recently added places</h2>
                  <p>The latest cultural landmarks in your collection.</p>
                </div>
                <span className="panel-icon">
                  <Icon name="landmark" />
                </span>
              </div>

              {loading && artifacts.length === 0 ? (
                <div className="table-loading" aria-label="Loading places">
                  <span />
                  <span />
                  <span />
                </div>
              ) : artifacts.length > 0 ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Place</th>
                        <th>Category</th>
                        <th>Discoveries</th>
                        <th>Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {artifacts.map((artifact) => (
                        <tr key={artifact.id}>
                          <td>
                            <div className="place-cell">
                              <span className="place-avatar">
                                <Icon name="landmark" size={16} />
                              </span>
                              <span>
                                <strong>{artifact.name}</strong>
                                <small>{artifact.humanReadableLocation}</small>
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="category-pill">
                              {artifact.category.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td className="discovery-count">
                            {artifact.discoveryCount.toLocaleString()}
                          </td>
                          <td className="date-cell">
                            {formatDate(artifact.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">
                    <Icon name="landmark" size={22} />
                  </span>
                  <strong>No places to show yet</strong>
                  <span>Newly added places will appear here.</span>
                </div>
              )}
              <div className="panel-footer">
                <span>
                  {lastUpdated
                    ? `Updated ${lastUpdated.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : "Waiting for data"}
                </span>
                <span className="live-indicator">
                  <span />
                  Live data
                </span>
              </div>
            </section>

            <section className="panel review-panel" id="reviews">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">NEEDS YOUR ATTENTION</div>
                  <h2>Review queue</h2>
                  <p>Items that may need an administrator&apos;s review.</p>
                </div>
                <span className="panel-icon gold-icon">
                  <Icon name="review" />
                </span>
              </div>
              <div className="review-list">
                <div className="review-row">
                  <span className="review-symbol submission-symbol">
                    <Icon name="landmark" size={18} />
                  </span>
                  <span className="review-copy">
                    <strong>Place submissions</strong>
                    <small>Community contributions</small>
                  </span>
                  <span className="review-total">
                    {stats?.pendingContributions.toLocaleString() ?? "--"}
                  </span>
                </div>
                <div className="review-row">
                  <span className="review-symbol verification-symbol">
                    <Icon name="pin" size={18} />
                  </span>
                  <span className="review-copy">
                    <strong>Flagged verifications</strong>
                    <small>Snaps marked for review</small>
                  </span>
                  <span className="review-total">
                    {stats?.flaggedVerifications.toLocaleString() ?? "--"}
                  </span>
                </div>
              </div>
              <div className="review-footer">
                <span>
                  {stats
                    ? `${(
                        stats.pendingContributions + stats.flaggedVerifications
                      ).toLocaleString()} items across both queues`
                    : "Review counts load with your dashboard"}
                </span>
              </div>
            </section>
          </div>

          <section className="bottom-note" id="community">
            <span className="bottom-note-icon">
              <Icon name="community" size={19} />
            </span>
            <div>
              <strong>Built around discovery</strong>
              <p>
                Your community has {stats?.users.toLocaleString() ?? "--"}{" "}
                explorers and {stats?.activeQuests.toLocaleString() ?? "--"}{" "}
                active quests to keep Nepal&apos;s heritage in focus.
              </p>
            </div>
            <a href="#quests" aria-label="See active quests">
              <Icon name="arrow" size={18} />
            </a>
          </section>
          <div id="quests" className="section-anchor" />
        </div> : <div className="dashboard-content management-content">
          <Management key={activeSection} section={activeSection} />
        </div>}
      </main>
    </div>
  );
}

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <BrandMark />
          <span>Loading admin workspace...</span>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <BrandMark />
          <div className="eyebrow">SANSKRITI SNAP · ADMIN</div>
          <h1>Welcome back</h1>
          <p>Sign in with your administrator account to continue.</p>
          <SignInButton mode="modal">
            <button className="sign-in-button" type="button">
              Sign in to dashboard
              <Icon name="arrow" size={18} />
            </button>
          </SignInButton>
          <span className="auth-footnote">
            Access is limited to authorized administrators.
          </span>
        </div>
      </main>
    );
  }

  return (
    <Dashboard
      displayName={
        user.fullName?.trim().split(/\s+/)[0] ??
        user.firstName ??
        "Administrator"
      }
    />
  );
}
