from fastapi import APIRouter
from backend.memory.store import get_memory

router = APIRouter()

@router.get("/memory")
def read_memory():
    return get_memory()