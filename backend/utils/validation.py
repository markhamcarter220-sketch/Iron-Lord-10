"""Input validation utilities."""

import re
from fastapi import HTTPException


def validate_username(username: str) -> str:
    """Validate username format to prevent injection attacks.

    Args:
        username: The username to validate

    Returns:
        The validated username

    Raises:
        HTTPException: If username format is invalid
    """
    if not re.match(r'^[a-zA-Z0-9_-]{3,20}$', username):
        raise HTTPException(
            status_code=400,
            detail="Invalid username format. Must be 3-20 alphanumeric characters, underscores, or hyphens."
        )
    return username
