"""PostgreSQL event listener for floor queue processing."""

import asyncio
import json
from typing import Optional

from src.logger import logger
from src.connectors.db import db
from src.services.process_floor_queue import process_floor_queue
from src.scheduled_jobs.jobs.update_booking_statuses import update_booking_statuses


class EventListener:
    """
    Listener for PostgreSQL NOTIFY events.

    Manages a dedicated database connection to listen for booking events
    and triggers floor queue processing or booking status updates when events are received.
    """

    def __init__(self):
        self.connection: Optional[object] = None
        self.listening: bool = False

    async def start(self) -> None:
        """
        Start listening for booking events.

        Acquires a dedicated connection from the pool and registers
        a listener for the 'booking_event' channel.

        Raises:
            RuntimeError: If listener is already running
            Exception: If connection or listener setup fails
        """
        if self.listening:
            raise RuntimeError("Event listener is already running")

        try:
            self.connection = await db.get_pool().acquire()
            await self.connection.add_listener(
                "booking_event", self._handle_booking_event
            )
            self.listening = True
            logger.info(
                "Event listener started successfully on channel 'booking_event'"
            )
        except Exception as e:
            logger.error(f"Failed to start event listener: {e}")
            if self.connection:
                try:
                    await db.get_pool().release(self.connection)
                except Exception:
                    pass
                self.connection = None
            raise

    async def stop(self) -> None:
        """Stop listening for events and release the database connection."""
        if not self.listening or not self.connection:
            logger.warning("Event listener is not running")
            return

        try:
            await self.connection.remove_listener(
                "booking_event", self._handle_booking_event
            )
            logger.info("Removed listener from 'booking_event' channel")
        except Exception as e:
            logger.error(f"Error removing listener: {e}")
        finally:
            try:
                await db.get_pool().release(self.connection)
                logger.info("Released database connection")
            except Exception as e:
                logger.error(f"Error releasing connection: {e}")
            finally:
                self.connection = None
                self.listening = False
                logger.info("Event listener stopped")

    async def _handle_booking_event(
        self, _connection, pid: int, channel: str, payload: str
    ) -> None:
        """
        Handle booking events from PostgreSQL NOTIFY.

        Parses the event payload and triggers appropriate actions:
        - booking_cancelled, booking_completed: Process floor queue
        - booking_created_today: Update booking statuses

        Args:
            _connection: Database connection
            pid: Process ID of the notifying backend
            channel: Channel name (should be 'booking_event')
            payload: JSON payload with event data
        """
        try:
            data = json.loads(payload)
            event_type = data.get("event_type")

            logger.info(
                f"Received '{event_type}' event from PID {pid} on channel '{channel}'"
            )

            if event_type == "booking_created_today":
                asyncio.create_task(self._update_statuses_safe(event_type))
                return

            floor_id = data.get("floor_id")
            if not floor_id:
                logger.warning(
                    f"Received event without floor_id on channel '{channel}': {payload}"
                )
                return

            asyncio.create_task(self._process_queue_safe(floor_id, event_type))

        except json.JSONDecodeError as e:
            logger.error(
                f"Invalid JSON payload on channel '{channel}': {payload} - {e}"
            )
        except Exception as e:
            logger.error(f"Unexpected error handling booking event: {e}", exc_info=True)

    async def _process_queue_safe(self, floor_id: str, event_type: str) -> None:
        """
        Safely process floor queue with error handling.

        Args:
            floor_id: ID of the floor to process
            event_type: Type of event that triggered processing
        """
        try:
            result = await process_floor_queue(floor_id)

            if result.allocations_made > 0:
                logger.info(
                    f"Event-driven allocation: {result.allocations_made} locker(s) "
                    f"allocated for floor {floor_id} (triggered by {event_type})"
                )
            else:
                logger.debug(
                    f"No allocations made for floor {floor_id} (triggered by {event_type})"
                )

        except Exception as e:
            logger.error(
                f"Error processing floor queue for floor {floor_id}: {e}", exc_info=True
            )

    async def _update_statuses_safe(self, event_type: str) -> None:
        """
        Safely update booking statuses with error handling.

        Args:
            event_type: Type of event that triggered status update
        """
        try:
            result = await update_booking_statuses()

            logger.info(
                f"Event-driven status update: {result.bookings_started} started, "
                f"{result.bookings_ended} ended (triggered by {event_type})"
            )

        except Exception as e:
            logger.error(f"Error updating booking statuses: {e}", exc_info=True)


_event_listener: Optional[EventListener] = None


async def start_event_listener() -> None:
    """
    Start the global event listener.

    Creates a new EventListener instance if one doesn't exist and starts it.

    Raises:
        RuntimeError: If listener is already running
        Exception: If listener fails to start
    """
    global _event_listener

    if _event_listener is not None and _event_listener.listening:
        logger.warning("Event listener is already running")
        return

    _event_listener = EventListener()
    await _event_listener.start()


async def stop_event_listener() -> None:
    """Stop the global event listener."""
    global _event_listener

    if _event_listener is not None:
        await _event_listener.stop()
        _event_listener = None
