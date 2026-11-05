from langchain_community.document_loaders import PyPDFLoader, TextLoader


def load_document(filepath: str):
    """
    Load a document from disk into LangChain's standard Document format.
    Supports PDF and plain text files.
    """
    if filepath.endswith(".pdf"):
        return PyPDFLoader(filepath).load()
    if filepath.endswith(".txt"):
        return TextLoader(filepath, encoding="utf-8").load()
    raise ValueError(f"Unsupported file type: {filepath}")
