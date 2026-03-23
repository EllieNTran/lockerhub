"""Unit tests for user services."""

import pytest
from unittest.mock import patch
from ..conftest import create_user_dict


@pytest.mark.unit
class TestGetAllUsers:
    """Tests for get_all_users service."""

    @pytest.mark.asyncio
    async def test_get_all_users_success(self, mock_db, sample_user_data):
        """Test retrieving all users.

        Verifies that fetching all users returns a list with correct user IDs,
        emails, and employee names.
        """
        from src.services.users.get_all_users import get_all_users

        mock_db.fetch.return_value = [sample_user_data]

        with patch("src.services.users.get_all_users.db", mock_db):
            result = await get_all_users()

            assert len(result) == 1
            assert result[0].user_id == sample_user_data["user_id"]
            assert result[0].email == sample_user_data["email"]
            assert result[0].employee_name == sample_user_data["employee_name"]

    @pytest.mark.asyncio
    async def test_get_all_users_multiple(
        self,
        mock_db,
    ):
        """Test retrieving multiple users.

        Verifies that fetching multiple users returns all users with their
        correct staff numbers differentiated.
        """
        from src.services.users.get_all_users import get_all_users

        user1 = create_user_dict(staff_number="123456", email="test1@example.com")
        user2 = create_user_dict(staff_number="654321", email="test2@example.com")

        mock_db.fetch.return_value = [user1, user2]

        with patch("src.services.users.get_all_users.db", mock_db):
            result = await get_all_users()

            assert len(result) == 2
            assert result[0].staff_number == "123456"
            assert result[1].staff_number == "654321"


@pytest.mark.unit
class TestGetUser:
    """Tests for get_user service."""

    @pytest.mark.asyncio
    async def test_get_user_success(self, mock_db, sample_user_data, sample_user_id):
        """Test retrieving a specific user.

        Verifies that fetching a user by ID returns the correct user with
        matching user ID and email.
        """
        from src.services.users.get_user import get_user

        mock_db.fetch.return_value = [sample_user_data]

        with patch("src.services.users.get_user.db", mock_db):
            result = await get_user(sample_user_id)

            assert result.user_id == sample_user_data["user_id"]
            assert result.email == sample_user_data["email"]

    @pytest.mark.asyncio
    async def test_get_user_not_found(self, mock_db):
        """Test retrieving a non-existent user.

        Verifies that attempting to fetch a user that doesn't exist
        raises a ValueError with the message 'User not found'.
        """
        from src.services.users.get_user import get_user

        mock_db.fetch.return_value = []

        with patch("src.services.users.get_user.db", mock_db):
            with pytest.raises(ValueError, match="User not found"):
                await get_user("non-existent-id")
