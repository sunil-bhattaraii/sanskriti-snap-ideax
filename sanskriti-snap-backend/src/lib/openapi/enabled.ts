/**
 * Gate for the OpenAPI document and the Scalar reference UI.
 *
 * Both expose the entire API surface plus a live "Try it" console, so they are
 * off in production unless explicitly enabled. In every other environment
 * (notably `next dev`) they are on, which is where smoke-testing happens.
 */
export function docsEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_API_DOCS === "1"
  );
}
