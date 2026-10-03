# Plan: Admin Panel Enhancements

## 1. Artifacts Pagination and Search
- [ ] Update `sanskriti-snap-backend/src/lib/contracts.ts` to add `AdminArtifactQuery` extending `PaginationQuery` with an optional `q` (string).
- [ ] Update `sanskriti-snap-backend/src/app/api/v1/admin/artifacts/route.ts` to:
    - Replace `StatusQuery` with `AdminArtifactQuery`.
    - Handle the `q` search parameter to filter artifacts by `name` or `slug` using a regex search.
- [ ] Update `sanskriti-snap-backend/src/app/admin/Management.tsx` to add a search input for the "Places" section and pass the query to the `api` function similar to the Users section.

## 2. User Information Editing
- [ ] Implement `sanskriti-snap-backend/src/app/api/v1/admin/users/[id]/route.ts`:
    - Accept `PATCH` request.
    - Validate with a new schema `UpdateUserRequest` (allow `displayName`, `role`).
    - Use `withTransaction` to perform the update and log the action.
- [ ] Update `sanskriti-snap-backend/src/app/admin/Management.tsx`:
    - Add an "Edit" button for each user in the "Users" table.
    - Create a dialog for editing user info (`kind: "user" | "suspend" | ...`).
    - Implement submit logic to call the new API endpoint.
- [ ] Register the new API path in `sanskriti-snap-backend/src/lib/openapi/paths/admin.ts`.
