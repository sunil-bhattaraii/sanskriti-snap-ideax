/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

export type Section =
  | "Places"
  | "Quests"
  | "Badges"
  | "Users"
  | "Reviews"
  | "Community"
  | "XP adjustments";

type ArtifactRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  story: string;
  category: string;
  rarity: string;
  tags: string[];
  latitude: number;
  longitude: number;
  altitudeMeters: number | null;
  humanReadableLocation: string;
  storyUnlockRadiusMeters: number;
  verificationRadiusMeters: number;
  xpReward: number;
  requiresSnap: boolean;
  requiresCV: boolean;
  warnings: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DISABLED";
  createdAt: string;
  discoveryCount: number;
};

type QuestRow = {
  id: string;
  name: string;
  description: string;
  artifactIds: string[];
  xpReward: number;
  badgeId: string | null;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
};

type BadgeCondition = {
  type: "FIRST_DISCOVERY" | "DISCOVERY_COUNT" | "QUEST_COMPLETION" | "CATEGORY_COUNT";
  value: number | null;
  questId: string | null;
  category: string | null;
};

type BadgeRow = {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  condition: BadgeCondition;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
};

type UserRow = {
  id: string;
  username: string;
  displayName: string;
  role: "USER" | "EXPERT" | "ADMIN";
  accountStatus: "ACTIVE" | "SUSPENDED" | "DELETED";
  lifetimeXp: number;
  createdAt: string;
};

type ContributionRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  humanReadableLocation: string | null;
  culturalSignificance: string;
  latitude: number;
  longitude: number;
  photos: string[];
  status: string;
  submittedBy: { username: string; displayName: string };
  createdAt: string;
};

type VerificationRow = {
  id: string;
  status: string;
  submittedAt: string;
  verificationImageUrl: string | null;
  flagReason: string | null;
  gps: { status: string; distanceMeters: number | null };
  cv: { status: string; similarityScore: number | null } | null;
  artifact: { name: string };
  user: { username: string; displayName: string };
};

type CommunityRow = {
  id: string;
  status: string;
  imageUrl: string;
  caption: string | null;
  author: { username: string; displayName: string };
  artifact: { name: string } | null;
  createdAt: string;
};

type Row =
  | ArtifactRow
  | QuestRow
  | BadgeRow
  | UserRow
  | ContributionRow
  | VerificationRow
  | CommunityRow;

type PageInfo = { nextCursor: string | null; hasMore: boolean };
type Paged<T> = { items: T[]; page: PageInfo };

/**
 * The artifacts table pages 20 at a time. The endpoint caps `limit` at 100, so
 * the old `limit=100` fetch silently truncated a larger collection at 100 rows
 * with no way to reach the rest.
 */
const PAGE_SIZE = 20;

type ArtifactReferenceItem = {
  id: string;
  imageUrl: string;
  cloudinaryPublicId: string | null;
  isCover: boolean;
  embeddingDimension: number;
  cvModel?: { name: string; version: string };
  createdAt: string;
};

type Dialog =
  | { kind: "artifact" | "quest" | "badge" | "user"; item?: Row }
  | { kind: "references"; item: ArtifactRow }
  | { kind: "xp"; item?: Row }
  | {
    kind:
    | "suspend"
    | "contributionApprove"
    | "contributionReject"
    | "verificationApprove"
    | "verificationReject"
    | "communityHide";
    item: Row;
  };

type ApiPayload<T> = {
  error?: { message?: string; details?: { fields?: Record<string, string[]> } };
} & T;

/**
 * Server errors name the offending fields in `details.fields`. Surfacing them
 * matters for query failures — "Invalid query parameters" alone does not tell
 * the admin that their search term is too long.
 */
function errorMessage(error: ApiPayload<unknown>["error"]): string {
  const base = error?.message ?? "The request could not be completed.";
  const fields = error?.details?.fields;
  if (!fields) return base;
  const parts = Object.entries(fields).map(([field, messages]) =>
    `${field}: ${messages.join(", ")}`,
  );
  return parts.length > 0 ? `${base} (${parts.join("; ")})` : base;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as ApiPayload<T>;
  if (!response.ok) {
    throw new Error(errorMessage(payload.error));
  }
  return payload;
}

const categories = [
  "TEMPLE",
  "SITE",
  "STATUE",
  "CARVING",
  "ARCHITECTURE",
  "MONUMENT",
  "COURTYARD",
  "CULTURAL_OBJECT",
  "OTHER",
] as const;

const rarityOptions = ["Common", "Rare", "Epic", "Legendary"] as const;

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function number(form: FormData, key: string) {
  return Number(form.get(key));
}

function optionalNumber(form: FormData, key: string) {
  const value = text(form, key);
  return value === "" ? undefined : Number(value);
}

function date(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(value: string) {
  return `status-pill status-${value.toLowerCase()}`;
}

function ActionButton({
  children,
  onClick,
  tone = "quiet",
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "quiet" | "primary" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      className={`action-button action-${tone}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  min,
  max,
  step,
  placeholder,
  help,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  help?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
      />
      {help && <small>{help}</small>}
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  required = false,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        rows={rows}
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
  required = false,
  multiple = false,
  help,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string | string[];
  required?: boolean;
  multiple?: boolean;
  help?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        multiple={multiple}
        size={multiple ? Math.min(Math.max(options.length, 3), 6) : undefined}
      >
        {!required && !multiple && <option value="">None</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {help && <small>{help}</small>}
    </label>
  );
}

function Check({
  label,
  name,
  checked = false,
}: {
  label: string;
  name: string;
  checked?: boolean;
}) {
  return (
    <label className="admin-check">
      <input type="checkbox" name={name} defaultChecked={checked} />
      <span>{label}</span>
    </label>
  );
}

type MediaSignData = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: string;
};

type UploadedImage = {
  url: string;
  publicId: string;
};

async function uploadToCloudinary(
  file: File,
  purpose:
    | "VERIFICATION_SNAP"
    | "VERIFICATION_GALLERY"
    | "PROFILE_IMAGE"
    | "COMMUNITY_SNAP"
    | "CONTRIBUTION_PHOTO" = "VERIFICATION_GALLERY",
): Promise<UploadedImage> {
  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    throw new Error("Choose a JPEG or PNG image.");
  }

  const signRes = await fetch("/api/v1/media/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose, contentType: file.type }),
  });

  if (!signRes.ok) {
    const errorData = (await signRes.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(
      errorData.error?.message ?? "Failed to obtain upload signature.",
    );
  }

  const signData = (await signRes.json()) as MediaSignData;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signData.apiKey);
  formData.append("timestamp", String(signData.timestamp));
  formData.append("signature", signData.signature);
  formData.append("folder", signData.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!uploadRes.ok) {
    const err = (await uploadRes.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(err.error?.message ?? "Cloudinary upload failed.");
  }

  const result = (await uploadRes.json()) as {
    secure_url?: string;
    url?: string;
    public_id: string;
  };

  return {
    url: result.secure_url || result.url || "",
    publicId: result.public_id,
  };
}

function ImageUploadField({
  label,
  name,
  publicIdName,
  defaultValue = "",
  defaultPublicId = "",
  purpose = "VERIFICATION_GALLERY",
  required = false,
  help,
  onUploaded,
}: {
  label: string;
  name: string;
  publicIdName?: string;
  defaultValue?: string | null;
  defaultPublicId?: string | null;
  purpose?:
  | "VERIFICATION_SNAP"
  | "VERIFICATION_GALLERY"
  | "PROFILE_IMAGE"
  | "COMMUNITY_SNAP"
  | "CONTRIBUTION_PHOTO";
  required?: boolean;
  help?: string;
  onUploaded?: (image: UploadedImage) => void;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [publicId, setPublicId] = useState(defaultPublicId ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = await uploadToCloudinary(file, purpose);
      setUrl(uploaded.url);
      setPublicId(uploaded.publicId);
      onUploaded?.(uploaded);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Image upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      void handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="admin-field image-upload-wrapper">
      <span>{label}</span>
      <input type="hidden" name={name} value={url} required={required} />
      {publicIdName && (
        <input type="hidden" name={publicIdName} value={publicId} />
      )}

      {uploading ? (
        <div className="image-upload-loading">
          <div className="upload-spinner" />
          <span>Uploading image to Cloudinary...</span>
        </div>
      ) : url ? (
        <div className="image-upload-preview">
          <img src={url} alt="Preview" className="image-upload-thumb" />
          <div className="image-upload-details">
            <span className="image-upload-url" title={url}>
              {url}
            </span>
            {publicId && (
              <small style={{ fontSize: "9px", color: "#81756f" }}>
                ID: {publicId}
              </small>
            )}
            <div className="image-upload-actions">
              <button
                type="button"
                className="url-toggle-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace image
              </button>
              <button
                type="button"
                className="url-toggle-btn"
                style={{ color: "#a43b22" }}
                onClick={() => {
                  setUrl("");
                  setPublicId("");
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className="image-upload-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="image-upload-dropzone-text">
              Click to choose image or drag & drop
            </span>
            <span className="image-upload-dropzone-subtext">
              PNG, JPG, WEBP via Cloudinary signed upload
            </span>
          </div>

          {!showUrlInput ? (
            <button
              type="button"
              className="url-toggle-btn"
              onClick={() => setShowUrlInput(true)}
            >
              Or enter custom image URL / public ID
            </button>
          ) : (
            <div style={{ display: "grid", gap: "6px" }}>
              <input
                type="text"
                placeholder="https://... or paste image URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {publicIdName && (
                <input
                  type="text"
                  placeholder="Cloudinary Public ID (optional)"
                  value={publicId}
                  onChange={(e) => setPublicId(e.target.value)}
                />
              )}
            </div>
          )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            void handleFile(e.target.files[0]);
          }
        }}
      />

      {uploadError && <small style={{ color: "#a43b22" }}>{uploadError}</small>}
      {help && <small>{help}</small>}
    </div>
  );
}

function MultiImageCvUploader({
  artifactId,
  onCompleted,
  isFirstReference = false,
  showCancel = false,
  onCancel,
}: {
  artifactId: string;
  onCompleted: () => void;
  isFirstReference?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCover, setIsCover] = useState(isFirstReference);
  const [useCvEmbedding, setUseCvEmbedding] = useState(true);
  const [showModelInputs, setShowModelInputs] = useState(false);
  const [modelName, setModelName] = useState("");
  const [modelVersion, setModelVersion] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartProcess = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMessage("Please select at least one image file.");
      return;
    }

    if (
      useCvEmbedding &&
      showModelInputs &&
      Boolean(modelName.trim()) !== Boolean(modelVersion.trim())
    ) {
      setErrorMessage("Enter both a model name and version, or leave both blank.");
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setStatusMessage("Starting upload process...");

    try {
      const total = selectedFiles.length;
      const failedFiles: string[] = [];
      let completedFiles = 0;
      for (let i = 0; i < total; i++) {
        const file = selectedFiles[i];

        try {
          // 1. Upload to Cloudinary
          setStatusMessage(
            `[${i + 1}/${total}] Uploading "${file.name}" to Cloudinary...`,
          );
          const { publicId } = await uploadToCloudinary(
            file,
            "VERIFICATION_GALLERY",
          );

          setStatusMessage(
            useCvEmbedding
              ? `[${i + 1}/${total}] Fetching the CV embedding and saving it for "${file.name}"...`
              : `[${i + 1}/${total}] Saving "${file.name}" as a reference image...`,
          );
          const customModel =
            useCvEmbedding &&
              showModelInputs &&
              modelName.trim() &&
              modelVersion.trim()
              ? { name: modelName.trim(), version: modelVersion.trim() }
              : undefined;
          await api(`/api/v1/admin/artifacts/${artifactId}/references`, {
            method: "POST",
            body: JSON.stringify({
              imagePublicId: publicId,
              isCover: i === 0 ? isCover : false,
              ...(useCvEmbedding ? { generateEmbedding: true } : {}),
              ...(customModel ? { model: customModel } : {}),
            }),
          });
          completedFiles += 1;
        } catch (err) {
          failedFiles.push(
            `${file.name}: ${err instanceof Error ? err.message : "failed"}`,
          );
          console.error("[admin] reference upload failed", {
            artifactId,
            fileName: file.name,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (completedFiles === 0) {
        throw new Error(failedFiles.join("; ") || "No files were uploaded.");
      }
      setSuccessMessage(
        `${completedFiles}/${total} reference image${total > 1 ? "s" : ""} processed successfully${failedFiles.length ? `. Failed: ${failedFiles.join("; ")}` : "."
        }`,
      );
      setStatusMessage(null);
      setSelectedFiles([]);
      onCompleted();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Process failed unexpectedly.",
      );
      setStatusMessage(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-section" onSubmit={(e) => void handleStartProcess(e)}>
      <div className="form-section-header">
        <span>Add Reference Images (Bulk / CV Embeddings)</span>
      </div>

      {statusMessage && (
        <div className="progress-banner">
          <div className="upload-spinner" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="progress-banner error">
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="progress-banner success">
          <span>{successMessage}</span>
        </div>
      )}

      <div
        className="image-upload-dropzone"
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="image-upload-dropzone-text">
          Click to choose images (Single or Bulk)
        </span>
        <span className="image-upload-dropzone-subtext">
          Select one or more images from your computer
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {selectedFiles.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <small style={{ fontWeight: 600, color: "#54463e" }}>
              Selected Images ({selectedFiles.length})
            </small>
            <button
              type="button"
              className="url-toggle-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              + Add more images
            </button>
          </div>
          <div className="multi-image-grid">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="multi-image-item">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="multi-image-thumb"
                />
                {!busy && (
                  <button
                    type="button"
                    className="multi-image-remove"
                    onClick={() => removeFile(idx)}
                    title="Remove"
                  >
                    ×
                  </button>
                )}
                <span className="multi-image-name">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="checks-row" style={{ marginTop: "4px" }}>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={isCover}
            onChange={(e) => setIsCover(e.target.checked)}
            disabled={busy}
          />
          <span>Set primary as cover image</span>
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={useCvEmbedding}
            onChange={(e) => setUseCvEmbedding(e.target.checked)}
            disabled={busy}
          />
          <span>Generate CV embeddings directly via CV service</span>
        </label>
      </div>

      {useCvEmbedding && (
        <div style={{ display: "grid", gap: "6px", marginTop: "2px" }}>
          <div style={{ display: "flex", gap: "14px" }}>
            <button
              type="button"
              className="url-toggle-btn"
              onClick={() => setShowModelInputs((prev) => !prev)}
            >
              {showModelInputs
                ? "▾ Hide custom model inputs"
                : "+ Select custom model (optional)"}
            </button>
          </div>

          {showModelInputs && (
            <div className="form-grid">
              <label className="admin-field">
                <span>Model Name (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. clip-vit-base-patch32"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  disabled={busy}
                />
                <small>Defaults to server standard if omitted</small>
              </label>
              <label className="admin-field">
                <span>Model Version (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. 1.0"
                  value={modelVersion}
                  onChange={(e) => setModelVersion(e.target.value)}
                  disabled={busy}
                />
              </label>
            </div>
          )}

        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginTop: "10px",
        }}
      >
        {showCancel && onCancel && (
          <button
            className="secondary-action"
            type="button"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
        )}
        <button
          className="primary-action"
          type="submit"
          disabled={busy || selectedFiles.length === 0}
        >
          {busy
            ? "Processing..."
            : `Upload & Process ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""
            }`}
        </button>
      </div>
    </form>
  );
}

function ReferencesManager({
  artifact,
  onClose,
  onUpdated,
}: {
  artifact: ArtifactRow;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [references, setReferences] = useState<ArtifactReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadReferences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api<{ items: ArtifactReferenceItem[] }>(
        `/api/v1/admin/artifacts/${artifact.id}/references`,
      );
      setReferences(res.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load references.",
      );
    } finally {
      setLoading(false);
    }
  }, [artifact.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReferences();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReferences]);

  const handleDelete = async (refId: string) => {
    if (!window.confirm("Delete this reference image?")) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api(`/api/v1/admin/artifacts/${artifact.id}/references/${refId}`, {
        method: "DELETE",
      });
      setNotice("Reference deleted.");
      await loadReferences();
      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete reference.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {error && (
        <div className="management-alert" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="management-notice" role="status">
          {notice}
        </div>
      )}

      <div>
        <h3 style={{ margin: "0 0 4px", fontSize: "13px", color: "#382e28" }}>
          Reference Images for {artifact.name}
        </h3>
        <p style={{ margin: 0, fontSize: "11px", color: "#81756f" }}>
          Reference images serve as visual representations and ground-truth
          evidence for CV matching.
        </p>
      </div>

      {loading ? (
        <div className="image-upload-loading">
          <div className="upload-spinner" />
          <span>Loading reference images...</span>
        </div>
      ) : references.length === 0 ? (
        <div
          style={{
            padding: "16px",
            border: "1px dashed #ded4cc",
            borderRadius: "8px",
            textAlign: "center",
            color: "#95877c",
            fontSize: "11px",
          }}
        >
          No reference images uploaded yet for this place.
        </div>
      ) : (
        <div className="reference-grid">
          {references.map((ref) => (
            <div key={ref.id} className="reference-card">
              <img
                src={ref.imageUrl}
                alt="Reference"
                className="reference-card-img"
              />
              <div className="reference-card-body">
                <div className="reference-card-badges">
                  {ref.isCover && (
                    <span className="ref-badge cover">Cover</span>
                  )}
                  {ref.embeddingDimension > 0 ? (
                    <span
                      className="ref-badge"
                      title={`Model: ${ref.cvModel?.name} v${ref.cvModel?.version}`}
                    >
                      {ref.embeddingDimension}D Vector
                    </span>
                  ) : (
                    <span className="ref-badge">No embedding</span>
                  )}
                </div>
                {ref.cloudinaryPublicId && (
                  <small
                    style={{
                      fontSize: "8px",
                      color: "#95877c",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={ref.cloudinaryPublicId}
                  >
                    {ref.cloudinaryPublicId}
                  </small>
                )}
                <div className="reference-card-actions">
                  <ActionButton
                    tone="danger"
                    disabled={busy}
                    onClick={() => void handleDelete(ref.id)}
                  >
                    Delete
                  </ActionButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MultiImageCvUploader
        artifactId={artifact.id}
        isFirstReference={references.length === 0}
        showCancel={true}
        onCancel={onClose}
        onCompleted={() => {
          void loadReferences();
          onUpdated();
        }}
      />
    </div>
  );
}

export default function Management({ section }: { section: Section }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactRow[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [questRows, setQuestRows] = useState<QuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [reviewType, setReviewType] = useState<"contributions" | "verification">(
    "contributions",
  );

  // Multi-image CV state for artifact add/edit dialog
  const [artifactFiles, setArtifactFiles] = useState<File[]>([]);
  const [artifactIsCover, setArtifactIsCover] = useState(true);
  const [artifactUseCv, setArtifactUseCv] = useState(true);
  const [artifactShowModel, setArtifactShowModel] = useState(false);
  const [artifactModelName, setArtifactModelName] = useState("");
  const [artifactModelVersion, setArtifactModelVersion] = useState("");
  const [artifactShowEndpoint, setArtifactShowEndpoint] = useState(false);
  const [artifactCvUrl, setArtifactCvUrl] = useState("http://localhost:8000");
  const [artifactCvSecret, setArtifactCvSecret] = useState("");
  const [modalProgress, setModalProgress] = useState<string | null>(null);
  /**
   * Cursor pagination for the places table. `cursorStack` holds one entry per
   * visited page — null for the first — so Previous is a pop rather than a
   * request to reconstruct a cursor the API does not expose.
   */
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const pageCursor = cursorStack[cursorStack.length - 1] ?? null;

  const loadRows = useCallback(async () => {
    try {
      const search = submittedQuery
        ? `&q=${encodeURIComponent(submittedQuery)}`
        : "";
      let items: Row[] = [];
      if (section === "Places") {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (submittedQuery) params.set("q", submittedQuery);
        if (statusFilter) params.set("status", statusFilter);
        if (pageCursor) params.set("cursor", pageCursor);
        const result = await api<Paged<ArtifactRow>>(
          `/api/v1/admin/artifacts?${params.toString()}`,
        );
        items = result.items;
        setArtifacts(result.items);
        setNextCursor(result.page.nextCursor);
        setHasMore(result.page.hasMore);
      } else if (section === "Quests") {
        const [result, placeResult, badgeResult] = await Promise.all([
          api<{ items: QuestRow[] }>("/api/v1/admin/quests?limit=100"),
          api<{ items: ArtifactRow[] }>("/api/v1/admin/artifacts?limit=100"),
          api<{ items: BadgeRow[] }>("/api/v1/admin/badges?limit=100"),
        ]);
        items = result.items;
        setArtifacts(placeResult.items);
        setBadges(badgeResult.items);
      } else if (section === "Badges") {
        const [result, questResult] = await Promise.all([
          api<{ items: BadgeRow[] }>("/api/v1/admin/badges?limit=100"),
          api<{ items: QuestRow[] }>("/api/v1/admin/quests?limit=100"),
        ]);
        items = result.items;
        setBadges(result.items);
        setRows(result.items);
        setArtifacts([]);
        setQuestRows(questResult.items);
        return;
      } else if (section === "Users" || section === "XP adjustments") {
        const result = await api<{ items: UserRow[] }>(
          `/api/v1/admin/users?limit=100${search}`,
        );
        items = result.items;
        if (section === "XP adjustments") setUsers(result.items);
      } else if (section === "Reviews") {
        const endpoint =
          reviewType === "contributions"
            ? "/api/v1/admin/contributions?limit=100"
            : "/api/v1/admin/verification?limit=100";
        const request = [api<{ items: Row[] }>(endpoint)];
        if (reviewType === "contributions") {
          request.push(
            api<{ items: ArtifactRow[] }>(
              "/api/v1/admin/artifacts?limit=100",
            ).then((result) => {
              setArtifacts(result.items);
              return { items: result.items as Row[] };
            }),
          );
        }
        const [result] = await Promise.all(request);
        items = result.items;
      } else if (section === "Community") {
        const result = await api<{ items: CommunityRow[] }>(
          "/api/v1/admin/community?limit=100",
        );
        items = result.items;
      }

      setRows(items);
      setNotice(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load this section.",
      );
    } finally {
      setLoading(false);
    }
  }, [reviewType, section, submittedQuery, pageCursor, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  // Switching sections must not carry a cursor, a status filter or a search
  // term across: a cursor from the places list is meaningless on the user list,
  // and a stale `q` would silently filter a table the admin never searched.
  // Adjust state during render rather than in an effect: React supports this
  // for "reset state when a prop changes", and an effect here would force a
  // second render pass (react-hooks/set-state-in-effect).
  const [previousSection, setPreviousSection] = useState(section);
  if (previousSection !== section) {
    setPreviousSection(section);
    setCursorStack([null]);
    setStatusFilter("");
    setSubmittedQuery("");
    setQuery("");
  }

  const mutate = async (url: string, method: string, body?: unknown) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api(url, {
        method,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      setDialog(null);
      setNotice("Changes saved.");
      await loadRows();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "The change could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog) return;
    const form = new FormData(event.currentTarget);
    const editing = dialog.item;

    if (dialog.kind === "artifact") {
      const body = {
        name: text(form, "name"),
        ...(text(form, "slug") ? { slug: text(form, "slug") } : {}),
        description: text(form, "description"),
        story: text(form, "story"),
        category: text(form, "category"),
        rarity: text(form, "rarity"),
        tags: text(form, "tags")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        latitude: number(form, "latitude"),
        longitude: number(form, "longitude"),
        ...(optionalNumber(form, "altitudeMeters") === undefined
          ? {}
          : { altitudeMeters: optionalNumber(form, "altitudeMeters") }),
        humanReadableLocation: text(form, "humanReadableLocation"),
        storyUnlockRadiusMeters: number(form, "storyUnlockRadiusMeters"),
        verificationRadiusMeters: number(form, "verificationRadiusMeters"),
        xpReward: number(form, "xpReward"),
        requiresSnap: form.has("requiresSnap"),
        requiresCV: form.has("requiresCV"),
        warnings: text(form, "warnings") || null,
        status: text(form, "status") || "DRAFT",
      };

      setBusy(true);
      setError(null);
      setNotice(null);
      try {
        const artifactRes = await api<{ id: string }>(
          editing
            ? `/api/v1/admin/artifacts/${editing.id}`
            : "/api/v1/admin/artifacts",
          {
            method: editing ? "PATCH" : "POST",
            body: JSON.stringify(body),
          },
        );

        const targetArtifactId = editing ? editing.id : artifactRes.id;

        const refImagePublicId = text(form, "refImagePublicId");
        if (refImagePublicId) {
          const isCover = form.has("refIsCover");
          const rawEmbedding = text(form, "refEmbedding");
          let embeddingVector: number[] | null = null;
          if (rawEmbedding) {
            try {
              if (rawEmbedding.trim().startsWith("[")) {
                const parsed = JSON.parse(rawEmbedding.trim());
                if (
                  Array.isArray(parsed) &&
                  parsed.every((n) => typeof n === "number")
                ) {
                  embeddingVector = parsed;
                }
              } else {
                const parsed = rawEmbedding
                  .split(",")
                  .map((s) => Number(s.trim()))
                  .filter((n) => !Number.isNaN(n));
                if (parsed.length > 0) {
                  embeddingVector = parsed;
                }
              }
            } catch {
              // ignore parse error
            }
          }

          if (embeddingVector && embeddingVector.length > 0) {
            const dim =
              optionalNumber(form, "refEmbeddingDimension") ??
              embeddingVector.length;
            await api(
              `/api/v1/admin/artifacts/${targetArtifactId}/references/embeddings`,
              {
                method: "POST",
                body: JSON.stringify({
                  imagePublicId: refImagePublicId,
                  embedding: embeddingVector,
                  embeddingDimension: dim,
                  model: {
                    name:
                      text(form, "refModelName") || "clip-vit-base-patch32",
                    version: text(form, "refModelVersion") || "1.0",
                  },
                  isCover,
                }),
              },
            );
          } else {
            await api(
              `/api/v1/admin/artifacts/${targetArtifactId}/references`,
              {
                method: "POST",
                body: JSON.stringify({
                  imagePublicId: refImagePublicId,
                  isCover,
                }),
              },
            );
          }
        }

        setDialog(null);
        setNotice("Changes saved.");
        await loadRows();
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : "The change could not be saved.",
        );
      } finally {
        setBusy(false);
      }
      return;
    } else if (dialog.kind === "quest") {
      const body = {
        name: text(form, "name"),
        description: text(form, "description"),
        artifactIds: form.getAll("artifactIds").map(String),
        xpReward: number(form, "xpReward"),
        badgeId: text(form, "badgeId") || null,
        ...(editing ? { status: text(form, "status") || "ACTIVE" } : {}),
      };
      await mutate(
        editing
          ? `/api/v1/admin/quests/${editing.id}`
          : "/api/v1/admin/quests",
        editing ? "PATCH" : "POST",
        body,
      );
    } else if (dialog.kind === "badge") {
      const condition = {
        type: text(form, "conditionType"),
        ...(text(form, "conditionValue")
          ? { value: number(form, "conditionValue") }
          : {}),
        ...(text(form, "conditionQuest")
          ? { questId: text(form, "conditionQuest") }
          : {}),
        ...(text(form, "conditionCategory")
          ? { category: text(form, "conditionCategory") }
          : {}),
      };
      const body = {
        name: text(form, "name"),
        description: text(form, "description"),
        ...(text(form, "iconUrl") ? { iconUrl: text(form, "iconUrl") } : {}),
        condition,
        ...(editing ? { status: text(form, "status") || "ACTIVE" } : {}),
      };
      await mutate(
        editing
          ? `/api/v1/admin/badges/${editing.id}`
          : "/api/v1/admin/badges",
        editing ? "PATCH" : "POST",
        body,
      );
    } else if (dialog.kind === "user") {
      await mutate(`/api/v1/admin/users/${(dialog.item as UserRow).id}`, "PATCH", {
        displayName: text(form, "displayName"),
        role: text(form, "role"),
      });
    } else if (dialog.kind === "suspend") {
      await mutate(`/api/v1/admin/users/${dialog.item.id}/suspend`, "POST", {
        reason: text(form, "reason"),
      });
    } else if (dialog.kind === "xp") {
      await mutate("/api/v1/admin/xp-adjustments", "POST", {
        userId: text(form, "userId"),
        amount: number(form, "amount"),
        reason: text(form, "reason"),
      });
    } else if (dialog.kind === "contributionApprove") {
      await mutate(
        `/api/v1/admin/contributions/${dialog.item.id}/approve`,
        "POST",
        text(form, "artifactId")
          ? {
            artifactId: text(form, "artifactId"),
            note: text(form, "note") || null,
          }
          : {
            artifact: {
              name: (dialog.item as ContributionRow).name,
              description: (dialog.item as ContributionRow).description,
              story: (dialog.item as ContributionRow).culturalSignificance,
              category: (dialog.item as ContributionRow).category,
              tags: (dialog.item as ContributionRow).tags,
              latitude: (dialog.item as ContributionRow).latitude,
              longitude: (dialog.item as ContributionRow).longitude,
              humanReadableLocation:
                (dialog.item as ContributionRow).humanReadableLocation ??
                "Location pending review",
              storyUnlockRadiusMeters: 500,
              verificationRadiusMeters: 100,
              xpReward: 50,
              requiresSnap: true,
              requiresCV: false,
              status: "DRAFT",
            },
            note: text(form, "note") || null,
          },
      );
    } else if (dialog.kind === "contributionReject") {
      await mutate(
        `/api/v1/admin/contributions/${dialog.item.id}/reject`,
        "POST",
        {
          reason: text(form, "reason"),
          note: text(form, "note") || null,
        },
      );
    } else if (dialog.kind === "verificationApprove") {
      await mutate(
        `/api/v1/admin/verification/${dialog.item.id}/approve`,
        "POST",
        { note: text(form, "note") || null },
      );
    } else if (dialog.kind === "verificationReject") {
      await mutate(
        `/api/v1/admin/verification/${dialog.item.id}/reject`,
        "POST",
        {
          reason: text(form, "reason"),
          note: text(form, "note") || null,
        },
      );
    } else if (dialog.kind === "communityHide") {
      await mutate(`/api/v1/admin/community/${dialog.item.id}/hide`, "POST", {
        reason: text(form, "reason"),
      });
    }
  };

  const setLifecycle = async (
    path: string,
    status: string,
    message: string,
  ) => {
    if (!window.confirm(message)) return;
    await mutate(path, "PATCH", { status });
  };

  const isActionable = !busy && !loading;
  const title = section === "XP adjustments" ? "Adjust explorer XP" : section;

  return (
    <section className="management-page">
      <div className="management-heading">
        <div>
          <div className="eyebrow">ADMIN WORKSPACE</div>
          <h1>{title}</h1>
          <p>
            {section === "Places"
              ? "Create and maintain the places explorers can discover."
              : section === "Quests"
                ? "Group discoveries into guided adventures."
                : section === "Badges"
                  ? "Manage the milestones explorers can earn."
                  : section === "Users"
                    ? "Find community members and manage account access."
                    : section === "Reviews"
                      ? "Resolve submissions and flagged verification attempts."
                      : section === "Community"
                        ? "Review public community snaps."
                        : "Record a reasoned adjustment to an explorer's XP ledger."}
          </p>
        </div>
        <div className="management-tools">
          {(section === "Users" || section === "Places") && (
            <form
              className="user-search"
              onSubmit={(event) => {
                event.preventDefault();
                setLoading(true);
                setCursorStack([null]);
                setSubmittedQuery(query.trim());
              }}
            >
              <input
                aria-label={`Search ${section.toLowerCase()}`}
                placeholder={`Search ${section.toLowerCase()}...`}
                maxLength={60}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          )}
          {section === "Places" && (
            <label className="admin-filter">
              <span>Status</span>
              <select
                aria-label="Filter places by status"
                value={statusFilter}
                onChange={(event) => {
                  setLoading(true);
                  setCursorStack([null]);
                  setStatusFilter(event.target.value);
                }}
              >
                <option value="">All statuses</option>
                {["DRAFT", "PUBLISHED", "ARCHIVED", "DISABLED"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}
          {["Places", "Quests", "Badges"].includes(section) && (
            <button
              className="primary-action"
              onClick={() =>
                setDialog({
                  kind:
                    section === "Places"
                      ? "artifact"
                      : section === "Quests"
                        ? "quest"
                        : "badge",
                })
              }
              type="button"
            >
              <span aria-hidden="true">+</span>
              Add {section === "Places" ? "place" : section.slice(0, -1)}
            </button>
          )}
          {section === "XP adjustments" && users.length > 0 && (
            <button
              className="primary-action"
              onClick={() => setDialog({ kind: "xp" })}
              type="button"
            >
              <span aria-hidden="true">+</span>
              New adjustment
            </button>
          )}
          <button
            className="secondary-action"
            type="button"
            onClick={() => {
              setError(null);
              setLoading(true);
              void loadRows();
            }}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {section === "Reviews" && (
        <div className="management-tabs" role="tablist" aria-label="Review queues">
          <button
            className={reviewType === "contributions" ? "selected" : ""}
            onClick={() => { setLoading(true); setReviewType("contributions"); }}
            role="tab"
            aria-selected={reviewType === "contributions"}
            type="button"
          >
            Place submissions
          </button>
          <button
            className={reviewType === "verification" ? "selected" : ""}
            onClick={() => { setLoading(true); setReviewType("verification"); }}
            role="tab"
            aria-selected={reviewType === "verification"}
            type="button"
          >
            Flagged snaps
          </button>
        </div>
      )}

      {error && (
        <div className="management-alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setLoading(true); setError(null); void loadRows(); }}>
            Retry
          </button>
        </div>
      )}
      {notice && <div className="management-notice" role="status">{notice}</div>}

      <div className="management-panel">
        {loading ? (
          <div className="management-loading">
            <span />
            <span />
            <span />
          </div>
        ) : rows.length === 0 ? (
          <div className="management-empty">
            <strong>No {section.toLowerCase()} found</strong>
            <span>
              {section === "Reviews"
                ? "There are no items waiting in this queue."
                : "Try refreshing or create a new item."}
            </span>
          </div>
        ) : (
          <div className="management-table-scroll">
            <table className="management-table">
              <thead>
                {section === "Places" && (
                  <tr><th>Place</th><th>Status</th><th>Discoveries</th><th>Actions</th></tr>
                )}
                {section === "Quests" && (
                  <tr><th>Quest</th><th>Places</th><th>XP</th><th>Status</th><th>Actions</th></tr>
                )}
                {section === "Badges" && (
                  <tr><th>Badge</th><th>Condition</th><th>Status</th><th>Actions</th></tr>
                )}
                {section === "Users" && (
                  <tr><th>Explorer</th><th>Role</th><th>XP</th><th>Account</th><th>Actions</th></tr>
                )}
                {section === "XP adjustments" && (
                  <tr><th>Explorer</th><th>Account</th><th>Lifetime XP</th><th>Action</th></tr>
                )}
                {section === "Reviews" && reviewType === "contributions" && (
                  <tr><th>Submission</th><th>Submitted by</th><th>Location</th><th>Actions</th></tr>
                )}
                {section === "Reviews" && reviewType === "verification" && (
                  <tr><th>Place</th><th>Explorer</th><th>Flag reason</th><th>Actions</th></tr>
                )}
                {section === "Community" && (
                  <tr><th>Snap</th><th>Explorer</th><th>Place</th><th>Status</th><th>Actions</th></tr>
                )}
              </thead>
              <tbody>
                {section === "Places" &&
                  (rows as ArtifactRow[]).map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong><small>{item.humanReadableLocation} · {item.category.replaceAll("_", " ")}</small></td>
                      <td><span className={statusClass(item.status)}>{item.status}</span></td>
                      <td>{item.discoveryCount.toLocaleString()}</td>
                      <td className="table-actions">
                        <ActionButton onClick={() => setDialog({ kind: "artifact", item })}>Edit</ActionButton>
                        <ActionButton onClick={() => setDialog({ kind: "references", item })}>Images</ActionButton>
                        {item.status !== "ARCHIVED" && (
                          <ActionButton
                            tone="danger"
                            disabled={!isActionable}
                            onClick={() => void setLifecycle(`/api/v1/admin/artifacts/${item.id}`, "ARCHIVED", `Archive ${item.name}?`)}
                          >
                            Archive
                          </ActionButton>
                        )}
                      </td>
                    </tr>
                  ))}
                {section === "XP adjustments" &&
                  users.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.displayName}</strong><small>@{item.username}</small></td>
                      <td><span className={statusClass(item.accountStatus)}>{item.accountStatus}</span></td>
                      <td>{item.lifetimeXp.toLocaleString()}</td>
                      <td><ActionButton disabled={!isActionable || item.accountStatus === "DELETED"} onClick={() => setDialog({ kind: "xp", item })}>Adjust XP</ActionButton></td>
                    </tr>
                  ))}
                {section === "Quests" &&
                  (rows as QuestRow[]).map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong><small>{item.description}</small></td>
                      <td>{item.artifactIds.length}</td>
                      <td>{item.xpReward.toLocaleString()}</td>
                      <td><span className={statusClass(item.status)}>{item.status}</span></td>
                      <td className="table-actions">
                        <ActionButton onClick={() => setDialog({ kind: "quest", item })}>Edit</ActionButton>
                        {item.status === "ACTIVE" && (
                          <ActionButton tone="danger" disabled={!isActionable} onClick={() => void setLifecycle(`/api/v1/admin/quests/${item.id}`, "ARCHIVED", `Archive ${item.name}?`)}>
                            Archive
                          </ActionButton>
                        )}
                      </td>
                    </tr>
                  ))}
                {section === "Badges" &&
                  (rows as BadgeRow[]).map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong><small>{item.description}</small></td>
                      <td>{item.condition.type.replaceAll("_", " ")}</td>
                      <td><span className={statusClass(item.status)}>{item.status}</span></td>
                      <td className="table-actions">
                        <ActionButton onClick={() => setDialog({ kind: "badge", item })}>Edit</ActionButton>
                        <ActionButton disabled={!isActionable} onClick={() => void setLifecycle(`/api/v1/admin/badges/${item.id}`, item.status === "ACTIVE" ? "DISABLED" : "ACTIVE", `${item.status === "ACTIVE" ? "Disable" : "Enable"} ${item.name}?`)}>
                          {item.status === "ACTIVE" ? "Disable" : "Enable"}
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                {section === "Users" &&
                  (rows as UserRow[]).map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.displayName}</strong><small>@{item.username}</small></td>
                      <td>{item.role}</td>
                      <td>{item.lifetimeXp.toLocaleString()}</td>
                      <td><span className={statusClass(item.accountStatus)}>{item.accountStatus}</span></td>
                      <td className="table-actions">
                        <ActionButton onClick={() => setDialog({ kind: "user", item })}>Edit</ActionButton>
                        {item.accountStatus === "ACTIVE" ? (
                          <ActionButton tone="danger" onClick={() => setDialog({ kind: "suspend", item })}>Suspend</ActionButton>
                        ) : item.accountStatus === "SUSPENDED" ? (
                          <ActionButton tone="primary" disabled={!isActionable} onClick={() => void mutate(`/api/v1/admin/users/${item.id}/reactivate`, "POST")}>Reactivate</ActionButton>
                        ) : <span className="muted-label">Deleted</span>}
                      </td>
                    </tr>
                  ))}
                {section === "Reviews" && reviewType === "contributions" &&
                  (rows as ContributionRow[]).map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong><small>{item.category.replaceAll("_", " ")} · {item.photos.length} photos</small></td>
                      <td>{item.submittedBy.displayName}<small>@{item.submittedBy.username}</small></td>
                      <td>{item.humanReadableLocation ?? `${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}`}</td>
                      <td className="table-actions">
                        <ActionButton tone="primary" onClick={() => setDialog({ kind: "contributionApprove", item })}>Approve</ActionButton>
                        <ActionButton tone="danger" onClick={() => setDialog({ kind: "contributionReject", item })}>Reject</ActionButton>
                      </td>
                    </tr>
                  ))}
                {section === "Reviews" && reviewType === "verification" &&
                  (rows as VerificationRow[]).map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.artifact.name}</strong><small>{date(item.submittedAt)}</small></td>
                      <td>{item.user.displayName}<small>@{item.user.username}</small></td>
                      <td>{item.flagReason ?? "Flagged for review"}<small>GPS {item.gps.status} · CV {item.cv?.status ?? "N/A"}{item.verificationImageUrl ? <> · <a href={item.verificationImageUrl} target="_blank" rel="noreferrer">View evidence</a></> : null}</small></td>
                      <td className="table-actions">
                        <ActionButton tone="primary" onClick={() => setDialog({ kind: "verificationApprove", item })}>Approve</ActionButton>
                        <ActionButton tone="danger" onClick={() => setDialog({ kind: "verificationReject", item })}>Reject</ActionButton>
                      </td>
                    </tr>
                  ))}
                {section === "Community" &&
                  (rows as CommunityRow[]).map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.caption || "Community snap"}</strong><small>{date(item.createdAt)}</small></td>
                      <td>{item.author.displayName}<small>@{item.author.username}</small></td>
                      <td>{item.artifact?.name ?? "Unlinked"}</td>
                      <td><span className={statusClass(item.status)}>{item.status}</span></td>
                      <td className="table-actions">
                        <a className="action-button action-quiet" href={item.imageUrl} target="_blank" rel="noreferrer">View snap</a>
                        {item.status !== "HIDDEN" && item.status !== "REMOVED" && (
                          <ActionButton tone="danger" onClick={() => setDialog({ kind: "communityHide", item })}>Hide</ActionButton>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {section === "Places" && !loading && rows.length > 0 && (
          <div className="management-pagination">
            <button
              className="secondary-action"
              type="button"
              disabled={cursorStack.length <= 1}
              onClick={() => {
                setLoading(true);
                setCursorStack((stack) => stack.slice(0, -1));
              }}
            >
              Previous
            </button>
            <span>Page {cursorStack.length}</span>
            <button
              className="secondary-action"
              type="button"
              disabled={!hasMore || !nextCursor}
              onClick={() => {
                if (!nextCursor) return;
                setLoading(true);
                setCursorStack((stack) => [...stack, nextCursor]);
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {dialog && (
        <div className="admin-modal-backdrop" role="presentation">
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
          >
            <div className="admin-modal-heading">
              <div>
                <div className="eyebrow">SANSKRITI SNAP · ADMIN</div>
                <h2 id="admin-modal-title">{dialogTitle(dialog)}</h2>
              </div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setDialog(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {error && (
              <div className="management-alert" role="alert">
                {error}
              </div>
            )}
            {dialog.kind === "references" ? (
              <div style={{ padding: "20px 24px" }}>
                <ReferencesManager
                  artifact={dialog.item as ArtifactRow}
                  onClose={() => setDialog(null)}
                  onUpdated={() => void loadRows()}
                />
              </div>
            ) : (
              <form
                className="admin-form"
                onSubmit={(event) => void submit(event)}
              >
                {renderDialog(dialog, artifacts, badges, users, questRows)}
                <div className="admin-form-actions">
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => setDialog(null)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-action"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function dialogTitle(dialog: Dialog) {
  switch (dialog.kind) {
    case "artifact":
      return dialog.item ? "Edit place" : "Add a place";
    case "references":
      return `Reference images · ${(dialog.item as ArtifactRow).name}`;
    case "quest":
      return dialog.item ? "Edit quest" : "Create a quest";
    case "badge":
      return dialog.item ? "Edit badge" : "Create a badge";
    case "user":
      return `Edit ${(dialog.item as UserRow).displayName}`;
    case "suspend":
      return `Suspend ${(dialog.item as UserRow).displayName}`;
    case "xp":
      return "Adjust explorer XP";
    case "contributionApprove":
      return "Approve place submission";
    case "contributionReject":
      return "Reject place submission";
    case "verificationApprove":
      return "Approve flagged snap";
    case "verificationReject":
      return "Reject flagged snap";
    case "communityHide":
      return "Hide community snap";
  }
}

function renderDialog(
  dialog: Dialog,
  artifacts: ArtifactRow[],
  badges: BadgeRow[],
  users: UserRow[],
  quests: QuestRow[],
) {
  const item = dialog.item;
  if (dialog.kind === "artifact") {
    const artifact = item as ArtifactRow | undefined;
    return (
      <>
        <div className="form-grid">
          <Field
            label="Name"
            name="name"
            defaultValue={artifact?.name}
            required
          />
          <Field
            label="Slug (optional)"
            name="slug"
            defaultValue={artifact?.slug}
          />
          <Select
            label="Category"
            name="category"
            required
            defaultValue={artifact?.category ?? "TEMPLE"}
            options={categories.map((value) => ({
              value,
              label: value.replaceAll("_", " "),
            }))}
          />
          <Select
            label="Rarity"
            name="rarity"
            defaultValue={artifact?.rarity ?? "Common"}
            options={rarityOptions.map((value) => ({
              value,
              label: value,
            }))}
          />
          <Field
            label="Latitude"
            name="latitude"
            type="number"
            step={0.000001}
            min={-90}
            max={90}
            defaultValue={artifact?.latitude ?? 27.7172}
            required
          />
          <Field
            label="Longitude"
            name="longitude"
            type="number"
            step={0.000001}
            min={-180}
            max={180}
            defaultValue={artifact?.longitude ?? 85.324}
            required
          />
          <Field
            label="Altitude (m)"
            name="altitudeMeters"
            type="number"
            defaultValue={artifact?.altitudeMeters}
          />
          <Field
            label="Human-readable location"
            name="humanReadableLocation"
            defaultValue={artifact?.humanReadableLocation}
            required
          />
          <Field
            label="Story unlock radius (m)"
            name="storyUnlockRadiusMeters"
            type="number"
            min={1}
            max={5000}
            defaultValue={artifact?.storyUnlockRadiusMeters ?? 500}
            required
          />
          <Field
            label="Verification radius (m)"
            name="verificationRadiusMeters"
            type="number"
            min={1}
            max={5000}
            defaultValue={artifact?.verificationRadiusMeters ?? 100}
            required
          />
          <Field
            label="XP reward"
            name="xpReward"
            type="number"
            min={0}
            max={100000}
            defaultValue={artifact?.xpReward ?? 50}
            required
          />
          <Field
            label="Tags (comma separated)"
            name="tags"
            defaultValue={artifact?.tags.join(", ")}
          />
          {artifact && (
            <Select
              label="Status"
              name="status"
              defaultValue={artifact.status}
              options={["DRAFT", "PUBLISHED", "ARCHIVED", "DISABLED"].map(
                (value) => ({ value, label: value }),
              )}
            />
          )}
          {!artifact && (
            <Select
              label="Initial status"
              name="status"
              defaultValue="DRAFT"
              options={["DRAFT", "PUBLISHED"].map((value) => ({
                value,
                label: value,
              }))}
            />
          )}
        </div>
        <TextArea
          label="Description"
          name="description"
          defaultValue={artifact?.description}
          required
        />
        <TextArea
          label="Story"
          name="story"
          defaultValue={artifact?.story}
          rows={4}
        />
        <TextArea
          label="Warnings (optional)"
          name="warnings"
          defaultValue={artifact?.warnings}
        />
        <div className="checks-row">
          <Check
            label="Require a snap"
            name="requiresSnap"
            checked={artifact?.requiresSnap ?? true}
          />
          <Check
            label="Require visual verification"
            name="requiresCV"
            checked={artifact?.requiresCV ?? false}
          />
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <span>Reference Image & CV Configuration (Optional)</span>
          </div>
          <ImageUploadField
            label="Upload Reference / Cover Image"
            name="refImageUrl"
            publicIdName="refImagePublicId"
            purpose="VERIFICATION_GALLERY"
            help="Uploads directly to Cloudinary. It will be attached as a reference image for this place."
          />
          <Check
            label="Set as cover image"
            name="refIsCover"
            checked={true}
          />
          <div className="form-grid">
            <Field
              label="Embedding Vector (Optional, JSON or comma separated)"
              name="refEmbedding"
              placeholder="[0.012, -0.045, 0.089, ...]"
              help="Pre-computed feature vector for CV verification"
            />
            <Field
              label="Embedding Dimension (Optional)"
              name="refEmbeddingDimension"
              type="number"
              placeholder="Auto (length of vector)"
            />
          </div>
          <div className="form-grid">
            <Field
              label="CV Model Name"
              name="refModelName"
              defaultValue="clip-vit-base-patch32"
            />
            <Field
              label="CV Model Version"
              name="refModelVersion"
              defaultValue="1.0"
            />
          </div>
        </div>
      </>
    );
  }
  if (dialog.kind === "quest") {
    const quest = item as QuestRow | undefined;
    return (
      <>
        <Field
          label="Quest name"
          name="name"
          defaultValue={quest?.name}
          required
        />
        <TextArea
          label="Description"
          name="description"
          defaultValue={quest?.description}
          required
        />
        <Select
          label="Places in this quest"
          name="artifactIds"
          multiple
          required
          defaultValue={quest?.artifactIds}
          options={artifacts.map((place) => ({
            value: place.id,
            label: `${place.name} · ${place.humanReadableLocation}`,
          }))}
          help="Select one or more places. Use Ctrl/Cmd to select multiple."
        />
        <div className="form-grid">
          <Field
            label="XP reward"
            name="xpReward"
            type="number"
            min={0}
            max={100000}
            defaultValue={quest?.xpReward ?? 0}
            required
          />
          <Select
            label="Award a badge (optional)"
            name="badgeId"
            defaultValue={quest?.badgeId ?? ""}
            options={badges.map((badge) => ({
              value: badge.id,
              label: badge.name,
            }))}
          />
          {quest && (
            <Select
              label="Status"
              name="status"
              defaultValue={quest.status}
              options={["ACTIVE", "ARCHIVED"].map((value) => ({
                value,
                label: value,
              }))}
            />
          )}
        </div>
      </>
    );
  }
  if (dialog.kind === "badge") {
    const badge = item as BadgeRow | undefined;
    return (
      <>
        <Field
          label="Badge name"
          name="name"
          defaultValue={badge?.name}
          required
        />
        <TextArea
          label="Description"
          name="description"
          defaultValue={badge?.description}
          required
        />
        <ImageUploadField
          label="Badge icon (Upload or URL)"
          name="iconUrl"
          defaultValue={badge?.iconUrl}
          purpose="VERIFICATION_GALLERY"
          help="Choose an image file to upload to Cloudinary, or enter an image URL."
        />
        <div className="form-grid">
          <Select label="Unlock condition" name="conditionType" required defaultValue={badge?.condition.type ?? "FIRST_DISCOVERY"} options={[
            { value: "FIRST_DISCOVERY", label: "First discovery" },
            { value: "DISCOVERY_COUNT", label: "Discovery count" },
            { value: "QUEST_COMPLETION", label: "Quest completion" },
            { value: "CATEGORY_COUNT", label: "Category count" },
          ]} />
          <Field label="Required count (when applicable)" name="conditionValue" type="number" min={1} defaultValue={badge?.condition.value} />
          <Select label="Quest (when applicable)" name="conditionQuest" defaultValue={badge?.condition.questId ?? ""} options={quests.map((quest) => ({ value: quest.id, label: quest.name }))} />
          <Select label="Category (when applicable)" name="conditionCategory" defaultValue={badge?.condition.category ?? ""} options={categories.map((value) => ({ value, label: value.replaceAll("_", " ") }))} />
          {badge && <Select label="Status" name="status" defaultValue={badge.status} options={["ACTIVE", "DISABLED"].map((value) => ({ value, label: value }))} />}
        </div>
      </>
    );
  }
  if (dialog.kind === "user") {
    const user = item as UserRow;
    return (
      <>
        <Field label="Display name" name="displayName" defaultValue={user.displayName} required />
        <Select label="Role" name="role" defaultValue={user.role} options={["USER", "EXPERT", "ADMIN"].map((value) => ({ value, label: value }))} />
      </>
    );
  }
  if (dialog.kind === "suspend") {
    return <TextArea label="Reason for suspension" name="reason" required rows={4} />;
  }
  if (dialog.kind === "xp") {
    return (
      <>
        <Select label="Explorer" name="userId" required options={users.filter((user) => user.accountStatus !== "DELETED").map((user) => ({ value: user.id, label: `${user.displayName} (@${user.username}) · ${user.lifetimeXp} XP` }))} />
        <Field label="XP change" name="amount" type="number" step={1} defaultValue={0} required help="Use a positive number to award XP or a negative number to remove it." />
        <TextArea label="Reason (required for audit)" name="reason" required rows={3} />
        <p className="form-help">The adjustment is clamped so lifetime XP cannot fall below zero.</p>
      </>
    );
  }
  if (dialog.kind === "contributionApprove") {
    return (
      <>
        <p className="form-help">Approve <strong>{(item as ContributionRow).name}</strong> by linking it to an existing place or creating a new draft place from the submission.</p>
        <Select label="Link to existing place (optional)" name="artifactId" options={artifacts.map((place) => ({ value: place.id, label: place.name }))} help="Leave blank to create a DRAFT place from the submission for a second review." />
        <TextArea label="Review note (optional)" name="note" />
      </>
    );
  }
  if (dialog.kind === "contributionReject" || dialog.kind === "verificationReject") {
    return (
      <>
        <TextArea label="Reason" name="reason" required rows={3} />
        <TextArea label="Reviewer note (optional)" name="note" />
      </>
    );
  }
  if (dialog.kind === "verificationApprove") {
    return (
      <>
        <p className="form-help">Approving this verification may award discovery XP and points if the explorer has not already collected this place.</p>
        <TextArea label="Reviewer note (optional)" name="note" />
      </>
    );
  }
  return <TextArea label="Reason for hiding this snap" name="reason" required rows={3} />;
}
