"""Logger configuration for analytics service."""

import logging
import logging.config
from pydantic import BaseModel


class LogConfig(BaseModel):
    """Configuration for the logger."""

    LOGGER_NAME: str = "analytics-service"
    LOG_FORMAT: str = "%(levelprefix)s | %(asctime)s | %(message)s"
    LOG_LEVEL: str = "INFO"

    version: int = 1
    disable_existing_loggers: bool = False
    formatters: dict = {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": LOG_FORMAT,
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    }
    handlers: dict = {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
    }
    loggers: dict = {
        LOGGER_NAME: {"handlers": ["default"], "level": LOG_LEVEL, "propagate": False},
    }


log_config = LogConfig()
logging.config.dictConfig(log_config.model_dump())

logger = logging.getLogger(log_config.LOGGER_NAME)
