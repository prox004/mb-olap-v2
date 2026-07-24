from backend.app.db.session import get_db

# Re-export database dependency
__all__ = ["get_db"]
