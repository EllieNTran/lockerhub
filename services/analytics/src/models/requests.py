"""Request models for analytics endpoints."""

from datetime import date
from typing import Optional
from uuid import UUID

from typing import Literal
from pydantic import BaseModel, Field, field_validator
