import os
#from sqlalchemy import create_engine
#from sqlalchemy.ext.declarative import declarative_base
#from sqlalchemy.orm import sessionmaker

# Determine database URL with sensible fallbacks
# Priority: DATABASE_URL (e.g., Postgres) -> SQLITE_PATH (file path) -> local SQLite file
#database_url = os.getenv("DATABASE_URL")
#sqlite_path = os.getenv("SQLITE_PATH", "./budget.db")

#if not database_url:
    # Default to SQLite when no DATABASE_URL is provided (useful for local/dev)
#    database_url = f"sqlite:///{sqlite_path}"

# Normalize Postgres driver
#if database_url.startswith("postgresql://") and "+psycopg2" not in database_url:
#    database_url = database_url.replace("postgresql://", "postgresql+psycopg2://")

# Engine connect args for SQLite
#connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}

# Create the SQLAlchemy engine
#engine = create_engine(database_url, pool_pre_ping=True, connect_args=connect_args)

#SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for ORM models
#Base = declarative_base()

#def init_db():
#    """
#    Initialize the database by creating all tables if they don't exist.
#    Import models to ensure they are registered with Base before creation.
#    """
 #   from . import models
 #   Base.metadata.create_all(bind=engine)

# Dependency to get the database session
#def get_db():
#    db = SessionLocal()
 #   try:
#        yield db
 #   finally:
#        db.close()


# from chatgpt
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Get DB connection string from env (Docker Compose sets DATABASE_URL)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/budget_db"  # fallback for local dev
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    from . import models
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
