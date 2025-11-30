import Millennium  # pyright: ignore[reportMissingImports]
from logger import logger


class Plugin:
    def _load(self) -> None:
        try:
            logger.info("Ruststats Extension: Starting plugin initialization...")
            Millennium.ready()
            logger.info("Ruststats Extension: Plugin loaded successfully")
        except Exception as e:
            logger.error(f"Ruststats Extension: Failed to load plugin: {str(e)}")
            raise

    def _front_end_loaded(self) -> None:
        try:
            logger.info("Ruststats Extension: Frontend loaded successfully")
            # Add any frontend-specific initialization logic here if needed
        except Exception as e:
            logger.error(f"Ruststats Extension: Error during frontend load: {str(e)}")

    def _unload(self) -> None:
        try:
            logger.info("Ruststats Extension: Plugin unloading...")
            # Add any cleanup logic here if needed
            logger.info("Ruststats Extension: Plugin unloaded successfully")
        except Exception as e:
            logger.error(f"Ruststats Extension: Error during plugin unload: {str(e)}")
