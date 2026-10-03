from fastapi.responses import JSONResponse


class CvError(Exception):
    """Typed service error. Serialised as {"code": ..., "message": ...}."""

    def __init__(self, code: str, status: int, message: str):
        super().__init__(message)
        self.code = code
        self.status = status
        self.message = message


def error_response(code: str, status: int, message: str) -> JSONResponse:
    # Nested under "error" to match the contract's CvServiceError shape
    # (cv-contract.ts 155). The Next.js client treats any non-2xx as a
    # technical failure without parsing this body, so a flat shape would go
    # unnoticed until something else started reading it.
    return JSONResponse(
        status_code=status,
        content={"error": {"code": code, "message": message}},
    )
