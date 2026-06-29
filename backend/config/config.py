import os
from dotenv import load_dotenv
load_dotenv()

EMAIL = os.environ.get("EMAIL", "")
PASSWORD = os.environ.get("PASSWORD", "")