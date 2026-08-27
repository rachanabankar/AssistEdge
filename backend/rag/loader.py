from langchain_community.document_loaders import PyPDFLoader, TextLoader


def load_document(filepath: str):
    """
    Load a document from disk into LangChain's standard Document format.
    Supports PDF and plain text files.
    """
    if filepath.endswith(".pdf"):
        loader = PyPDFLoader(filepath)
    elif filepath.endswith(".txt"):
        loader = TextLoader(filepath, encoding="utf-8")
    else:
        raise ValueError(f"Unsupported file type: {filepath}")

    return loader.load()