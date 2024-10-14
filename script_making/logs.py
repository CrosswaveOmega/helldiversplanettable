import logging
import logging.handlers

import os


def setup_logger():
    if not os.path.exists("./logs/"):
        os.makedirs("./logs/")

    logger = logging.getLogger("StatusLogger")
    logger.setLevel(logging.DEBUG)

    warn_error_handler = logging.handlers.RotatingFileHandler(
        "./logs/warn_error.log",
        maxBytes=8 * 1024 * 1024,
        backupCount=1,
        encoding="utf8",
    )
    warn_error_handler.setLevel(logging.WARNING)

    info_handler = logging.handlers.RotatingFileHandler(
        "./logs/info.log", maxBytes=8 * 1024 * 1024, backupCount=1, encoding="utf8"
    )
    info_handler.setLevel(logging.INFO)

    dt_fmt = "%Y-%m-%d %H:%M:%S"
    formatter = logging.Formatter(
        "[LINE] [{asctime}] [{levelname:<8}] {name}: {message}", dt_fmt, style="{"
    )
    warn_error_handler.setFormatter(formatter)
    info_handler.setFormatter(formatter)

    logger.addHandler(warn_error_handler)
    logger.addHandler(info_handler)
