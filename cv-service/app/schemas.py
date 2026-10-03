from typing import Annotated

from pydantic import BaseModel, Field, model_validator


class ModelStamp(BaseModel):
    name: str = Field(min_length=1)
    version: str = Field(min_length=1)


# ---- /embed ----------------------------------------------------------------
class EmbedRequest(BaseModel):
    image: str = Field(min_length=1)  # http(s) URL or Cloudinary public id
    model: ModelStamp | None = None


class EmbedResponse(BaseModel):
    embedding: list[float]
    embeddingDimension: int
    model: ModelStamp


# ---- /compare --------------------------------------------------------------
ObjectIdStr = Annotated[str, Field(pattern=r"^[a-fA-F0-9]{24}$")]


class ReferenceIn(BaseModel):
    referenceId: str = Field(min_length=1)
    embedding: list[float]
    embeddingDimension: int = Field(ge=0)


class CompareRequest(BaseModel):
    image: str = Field(min_length=1)
    artifactId: ObjectIdStr | None = None
    references: list[ReferenceIn] | None = None
    topK: int | None = Field(default=None, ge=1)
    model: ModelStamp | None = None

    @model_validator(mode="after")
    def exactly_one_reference_source(self):
        if (self.artifactId is None) == (self.references is None):
            raise ValueError("provide exactly one of artifactId or references")
        return self


class PerReference(BaseModel):
    referenceId: str
    score: float


class CompareResponse(BaseModel):
    similarityScore: float
    topK: int  # effective K (min of requested K and loadable references)
    matchedReferenceIds: list[str]
    referenceCount: int
    model: ModelStamp
    perReference: list[PerReference] | None = None
