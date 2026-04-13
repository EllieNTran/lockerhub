"""Unit tests for PostgreSQL event listener."""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json


class TestEventListener:
    """Tests for the EventListener class."""

    @pytest.mark.asyncio
    async def test_start_success(self):
        """
        Verify successful listener start.
        Mock database pool and connection.
        Expect listener to be registered and marked as listening.
        """
        from src.events.listener import EventListener

        mock_connection = MagicMock()
        mock_connection.add_listener = AsyncMock()

        mock_pool = MagicMock()
        mock_pool.acquire = AsyncMock(return_value=mock_connection)

        listener = EventListener()

        with patch("src.events.listener.db") as mock_db:
            mock_db.get_pool.return_value = mock_pool
            await listener.start()

        assert listener.listening is True
        assert listener.connection == mock_connection
        mock_connection.add_listener.assert_called_once_with(
            "booking_event", listener._handle_booking_event
        )

    @pytest.mark.asyncio
    async def test_start_already_listening(self):
        """
        Verify error when listener is already running.
        Listener is already marked as listening.
        Expect RuntimeError to be raised.
        """
        from src.events.listener import EventListener

        listener = EventListener()
        listener.listening = True

        with pytest.raises(RuntimeError, match="already running"):
            await listener.start()

    @pytest.mark.asyncio
    async def test_start_connection_failure(self):
        """
        Verify error handling when connection fails.
        Mock pool.acquire to raise exception.
        Expect exception to be raised and connection cleaned up.
        """
        from src.events.listener import EventListener

        mock_pool = MagicMock()
        mock_pool.acquire = AsyncMock(side_effect=Exception("Connection failed"))

        listener = EventListener()

        with patch("src.events.listener.db") as mock_db:
            mock_db.get_pool.return_value = mock_pool
            with pytest.raises(Exception, match="Connection failed"):
                await listener.start()

        assert listener.listening is False
        assert listener.connection is None

    @pytest.mark.asyncio
    async def test_start_add_listener_failure(self):
        """
        Verify error handling when add_listener fails.
        Mock connection.add_listener to raise exception.
        Expect exception to be raised and connection released.
        """
        from src.events.listener import EventListener

        mock_connection = MagicMock()
        mock_connection.add_listener = AsyncMock(
            side_effect=Exception("Failed to add listener")
        )

        mock_pool = MagicMock()
        mock_pool.acquire = AsyncMock(return_value=mock_connection)
        mock_pool.release = AsyncMock()

        listener = EventListener()

        with patch("src.events.listener.db") as mock_db:
            mock_db.get_pool.return_value = mock_pool
            with pytest.raises(Exception, match="Failed to add listener"):
                await listener.start()

        assert listener.connection is None

    @pytest.mark.asyncio
    async def test_start_cleanup_failure(self):
        """
        Verify error handling when connection cleanup fails during start failure.
        Mock add_listener to fail, and pool.release to also fail.
        Expect original exception to be raised, cleanup error to be silently caught.
        """
        from src.events.listener import EventListener

        mock_connection = MagicMock()
        mock_connection.add_listener = AsyncMock(
            side_effect=Exception("Failed to add listener")
        )

        mock_pool = MagicMock()
        mock_pool.acquire = AsyncMock(return_value=mock_connection)
        mock_pool.release = AsyncMock(side_effect=Exception("Failed to release"))

        listener = EventListener()

        with patch("src.events.listener.db") as mock_db:
            mock_db.get_pool.return_value = mock_pool
            with pytest.raises(Exception, match="Failed to add listener"):
                await listener.start()

        assert listener.connection is None

    @pytest.mark.asyncio
    async def test_stop_success(self):
        """
        Verify successful listener stop.
        Listener is running with active connection.
        Expect listener to be removed and connection released.
        """
        from src.events.listener import EventListener

        mock_connection = MagicMock()
        mock_connection.remove_listener = AsyncMock()

        mock_pool = MagicMock()
        mock_pool.release = AsyncMock()

        listener = EventListener()
        listener.listening = True
        listener.connection = mock_connection

        with patch("src.events.listener.db") as mock_db:
            mock_db.get_pool.return_value = mock_pool
            await listener.stop()

        assert listener.listening is False
        assert listener.connection is None
        mock_connection.remove_listener.assert_called_once()
        mock_pool.release.assert_called_once_with(mock_connection)

    @pytest.mark.asyncio
    async def test_stop_not_listening(self):
        """
        Verify warning when stopping non-listening listener.
        Listener is not marked as listening.
        Expect warning without errors.
        """
        from src.events.listener import EventListener

        listener = EventListener()
        listener.listening = False

        await listener.stop()  # Should not raise

        assert listener.listening is False

    @pytest.mark.asyncio
    async def test_stop_remove_listener_error(self):
        """
        Verify error handling when remove_listener fails.
        Mock connection.remove_listener to raise exception.
        Expect connection to still be released and listener stopped.
        """
        from src.events.listener import EventListener

        mock_connection = MagicMock()
        mock_connection.remove_listener = AsyncMock(
            side_effect=Exception("Failed to remove")
        )

        mock_pool = MagicMock()
        mock_pool.release = AsyncMock()

        listener = EventListener()
        listener.listening = True
        listener.connection = mock_connection

        with patch("src.events.listener.db") as mock_db:
            mock_db.get_pool.return_value = mock_pool
            await listener.stop()

        assert listener.listening is False
        assert listener.connection is None
        mock_pool.release.assert_called_once()

    @pytest.mark.asyncio
    async def test_stop_release_connection_error(self):
        """
        Verify error handling when releasing connection fails.
        Mock pool.release to raise exception.
        Expect listener to still be stopped and connection set to None.
        """
        from src.events.listener import EventListener

        mock_connection = MagicMock()
        mock_connection.remove_listener = AsyncMock()

        mock_pool = MagicMock()
        mock_pool.release = AsyncMock(side_effect=Exception("Failed to release"))

        listener = EventListener()
        listener.listening = True
        listener.connection = mock_connection

        with patch("src.events.listener.db") as mock_db:
            mock_db.get_pool.return_value = mock_pool
            await listener.stop()

        assert listener.listening is False
        assert listener.connection is None
        mock_connection.remove_listener.assert_called_once()
        mock_pool.release.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_booking_event_cancelled(self):
        """
        Verify handling of booking_cancelled event.
        Mock process_floor_queue to prevent side effects.
        """
        from src.events.listener import EventListener

        listener = EventListener()
        payload = json.dumps(
            {"event_type": "booking_cancelled", "floor_id": "floor-123"}
        )

        mock_result = MagicMock()
        mock_result.allocations_made = 1

        with patch(
            "src.events.listener.process_floor_queue",
            AsyncMock(return_value=mock_result),
        ):
            await listener._handle_booking_event(None, 12345, "booking_event", payload)
            # Give the task a moment to start
            await asyncio.sleep(0.01)

    @pytest.mark.asyncio
    async def test_handle_booking_event_completed(self):
        """
        Verify handling of booking_completed event.
        Mock process_floor_queue to prevent side effects.
        """
        from src.events.listener import EventListener

        listener = EventListener()
        payload = json.dumps(
            {"event_type": "booking_completed", "floor_id": "floor-456"}
        )

        mock_result = MagicMock()
        mock_result.allocations_made = 1

        with patch(
            "src.events.listener.process_floor_queue",
            AsyncMock(return_value=mock_result),
        ):
            await listener._handle_booking_event(None, 12345, "booking_event", payload)
            # Give the task a moment to start
            await asyncio.sleep(0.01)

    @pytest.mark.asyncio
    async def test_handle_booking_event_created_today(self):
        """
        Verify handling of booking_created_today event.
        Mock update_booking_statuses to prevent side effects.
        """
        from src.events.listener import EventListener

        listener = EventListener()
        payload = json.dumps({"event_type": "booking_created_today"})

        mock_result = MagicMock()
        mock_result.bookings_started = 1
        mock_result.bookings_ended = 1

        with patch(
            "src.events.listener.update_booking_statuses",
            AsyncMock(return_value=mock_result),
        ):
            await listener._handle_booking_event(None, 12345, "booking_event", payload)
            # Give the task a moment to start
            await asyncio.sleep(0.01)

    @pytest.mark.asyncio
    async def test_handle_booking_event_missing_floor_id(self):
        """
        Verify warning when event lacks floor_id.
        Payload missing floor_id for event that requires it.
        Expect warning to be logged.
        """
        from src.events.listener import EventListener

        listener = EventListener()
        payload = json.dumps({"event_type": "booking_cancelled"})  # Missing floor_id

        with patch("src.events.listener.asyncio.create_task") as mock_create_task:
            await listener._handle_booking_event(None, 12345, "booking_event", payload)

        mock_create_task.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_booking_event_invalid_json(self):
        """
        Verify error handling for invalid JSON payload.
        Payload is not valid JSON.
        Expect error to be logged without raising.
        """
        from src.events.listener import EventListener

        listener = EventListener()
        payload = "invalid json {"

        # Should not raise exception
        await listener._handle_booking_event(None, 12345, "booking_event", payload)

    @pytest.mark.asyncio
    async def test_handle_booking_event_unexpected_error(self):
        """
        Verify error handling for unexpected errors.
        Mock json.loads to raise unexpected exception.
        Expect error to be logged without raising.
        """
        from src.events.listener import EventListener

        listener = EventListener()
        payload = '{"event_type": "test"}'

        with patch(
            "src.events.listener.json.loads", side_effect=RuntimeError("Unexpected")
        ):
            # Should not raise exception
            await listener._handle_booking_event(None, 12345, "booking_event", payload)

    @pytest.mark.asyncio
    async def test_process_queue_safe_success(self):
        """
        Verify successful queue processing.
        Mock process_floor_queue to return successful result.
        Expect allocations to be logged.
        """
        from src.events.listener import EventListener

        mock_result = MagicMock()
        mock_result.allocations_made = 3

        listener = EventListener()

        with patch(
            "src.events.listener.process_floor_queue",
            AsyncMock(return_value=mock_result),
        ):
            await listener._process_queue_safe("floor-123", "booking_cancelled")

    @pytest.mark.asyncio
    async def test_process_queue_safe_no_allocations(self):
        """
        Verify handling when no allocations are made.
        Mock process_floor_queue to return zero allocations.
        Expect debug log message.
        """
        from src.events.listener import EventListener

        mock_result = MagicMock()
        mock_result.allocations_made = 0

        listener = EventListener()

        with patch(
            "src.events.listener.process_floor_queue",
            AsyncMock(return_value=mock_result),
        ):
            await listener._process_queue_safe("floor-123", "booking_cancelled")

    @pytest.mark.asyncio
    async def test_process_queue_safe_error(self):
        """
        Verify error handling in queue processing.
        Mock process_floor_queue to raise exception.
        Expect error to be logged without raising.
        """
        from src.events.listener import EventListener

        listener = EventListener()

        with patch(
            "src.events.listener.process_floor_queue",
            AsyncMock(side_effect=Exception("Processing failed")),
        ):
            # Should not raise exception
            await listener._process_queue_safe("floor-123", "booking_cancelled")

    @pytest.mark.asyncio
    async def test_update_statuses_safe_success(self):
        """
        Verify successful status update.
        Mock update_booking_statuses to return successful result.
        Expect result to be logged.
        """
        from src.events.listener import EventListener

        mock_result = MagicMock()
        mock_result.bookings_started = 2
        mock_result.bookings_ended = 3

        listener = EventListener()

        with patch(
            "src.events.listener.update_booking_statuses",
            AsyncMock(return_value=mock_result),
        ):
            await listener._update_statuses_safe("booking_created_today")

    @pytest.mark.asyncio
    async def test_update_statuses_safe_error(self):
        """
        Verify error handling in status update.
        Mock update_booking_statuses to raise exception.
        Expect error to be logged without raising.
        """
        from src.events.listener import EventListener

        listener = EventListener()

        with patch(
            "src.events.listener.update_booking_statuses",
            AsyncMock(side_effect=Exception("Update failed")),
        ):
            # Should not raise exception
            await listener._update_statuses_safe("booking_created_today")


class TestEventListenerGlobal:
    """Tests for global event listener functions."""

    @pytest.mark.asyncio
    async def test_start_event_listener_success(self):
        """
        Verify successful start of global listener.
        Mock EventListener.start.
        Expect new listener to be created and started.
        """
        from src.events import listener as listener_module

        # Reset global listener
        listener_module._event_listener = None

        mock_listener = MagicMock()
        mock_listener.start = AsyncMock()
        mock_listener.listening = False

        with patch("src.events.listener.EventListener", return_value=mock_listener):
            await listener_module.start_event_listener()

        mock_listener.start.assert_called_once()

    @pytest.mark.asyncio
    async def test_start_event_listener_already_running(self):
        """
        Verify warning when listener is already running.
        Global listener already exists and is listening.
        Expect warning without creating new listener.
        """
        from src.events import listener as listener_module

        mock_listener = MagicMock()
        mock_listener.listening = True
        listener_module._event_listener = mock_listener

        with patch("src.events.listener.EventListener") as mock_class:
            await listener_module.start_event_listener()

        mock_class.assert_not_called()

    @pytest.mark.asyncio
    async def test_stop_event_listener_success(self):
        """
        Verify successful stop of global listener.
        Global listener exists.
        Expect listener to be stopped and set to None.
        """
        from src.events import listener as listener_module

        mock_listener = MagicMock()
        mock_listener.stop = AsyncMock()
        listener_module._event_listener = mock_listener

        await listener_module.stop_event_listener()

        mock_listener.stop.assert_called_once()
        assert listener_module._event_listener is None

    @pytest.mark.asyncio
    async def test_stop_event_listener_none(self):
        """
        Verify handling when no listener exists.
        Global listener is None.
        Expect no errors.
        """
        from src.events import listener as listener_module

        listener_module._event_listener = None

        await listener_module.stop_event_listener()  # Should not raise

        assert listener_module._event_listener is None
