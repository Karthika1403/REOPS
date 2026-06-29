import os
import json
import math
import fitz
import pandas as pd
import chromadb

DATASET_DIR = "backend/uploads"
METADATA_FILE = "backend/datasets/metadata.json"

client = chromadb.PersistentClient(path="backend/rag/chroma_db")
collection = client.get_or_create_collection(
    name="documents",
    metadata={"hnsw:space": "cosine"}
)

def extract_text_from_pdf(file_path: str) -> str:
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks

def index_document(file_path: str, filename: str) -> dict:
    text = extract_text_from_pdf(file_path)
    chunks = chunk_text(text)

    try:
        existing = collection.get(where={"filename": filename})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
        pass

    if not chunks:
        return {"filename": filename, "chunks": 0, "characters": 0}

    ids = [f"{filename}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"filename": filename, "chunk_index": i, "file_path": file_path}
                 for i in range(len(chunks))]

    collection.add(documents=chunks, ids=ids, metadatas=metadatas)

    return {
        "filename": filename,
        "chunks": len(chunks),
        "characters": len(text),
    }

def search_documents(query: str, n_results: int = 8) -> list:
    try:
        results = collection.query(query_texts=[query], n_results=n_results)
        output = []
        for i, doc in enumerate(results["documents"][0]):
            output.append({
                "text": doc,
                "filename": results["metadatas"][0][i]["filename"],
                "score": round((1 - results["distances"][0][i]) * 100, 1)
            })
        return output
    except Exception:
        return []

def get_all_documents() -> list:
    upload_dir = "backend/uploads"
    if not os.path.exists(upload_dir):
        return []
    files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
    docs = []
    for f in files:
        path = os.path.join(upload_dir, f)
        size = os.path.getsize(path)
        modified = os.path.getmtime(path)
        try:
            existing = collection.get(where={"filename": f})
            chunks = len(existing["ids"])
            indexed = chunks > 0
        except Exception:
            chunks = 0
            indexed = False
        docs.append({
            "filename": f,
            "size": size,
            "modified": modified,
            "indexed": indexed,
            "chunks": chunks,
            "file_path": path
        })
    return sorted(docs, key=lambda x: x["modified"], reverse=True)

def delete_document(filename: str) -> bool:
    try:
        existing = collection.get(where={"filename": filename})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
        file_path = os.path.join("backend/uploads", filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        return True
    except Exception:
        return False

def reindex_all_documents():
    upload_dir = "backend/uploads"
    if not os.path.exists(upload_dir):
        return
    files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
    for filename in files:
        file_path = os.path.join(upload_dir, filename)
        try:
            existing = collection.get(where={"filename": filename})
            if not existing["ids"]:
                print(f"Auto-indexing: {filename}")
                index_document(file_path, filename)
        except Exception as e:
            print(f"Failed to index {filename}: {e}")