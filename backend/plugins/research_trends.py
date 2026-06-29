import os
import fitz
from backend.plugins.registry import registry

def load_pdf(query, context):
    upload_dir = "backend/uploads"
    pdf_files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
    if not pdf_files:
        raise FileNotFoundError("No PDF uploaded")

    latest = max(
        [os.path.join(upload_dir, f) for f in pdf_files],
        key=os.path.getmtime
    )

    doc = fitz.open(latest)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()

    return {
        "file_path": latest,
        "text": text,
        "page_count": len(doc) if False else None,  # remove if unused
    }

registry.register("load_pdf", load_pdf)