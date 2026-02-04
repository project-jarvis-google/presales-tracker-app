import os
from google.cloud.sql.connector import Connector, IPTypes
import pg8000
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
PRIVATE_IP = os.getenv("PRIVATE_IP", "false").lower() == "true"

# Initialize connector once
connector = Connector()

# Create a connection pool
_pool = None

def get_connection_pool():
    """Get or create connection pool"""
    global _pool
    if _pool is None:
        ip_type = IPTypes.PRIVATE if PRIVATE_IP else IPTypes.PUBLIC
        
        def getconn():
            return connector.connect(
                INSTANCE_CONNECTION_NAME,
                "pg8000",
                user=DB_USER,
                password=DB_PASS,
                db=DB_NAME,
                ip_type=ip_type,
            )
        _pool = getconn 
    return _pool

def get_db():
    """Get database connection from pool"""
    return get_connection_pool()()

def test_connection():
    """Test database connection"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        conn.close()
        print(" Database connected successfully!")
        print(f"   PostgreSQL version: {version[0][:50]}...")
        return True
    except Exception as e:
        print(f" Database connection failed: {e}")
        return False

def close_connector():
    """Close the connector"""
    connector.close()