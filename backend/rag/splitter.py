from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_documents(docs):
    """
    Split documents into smaller chunks for embedding and retrieval.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=250,
        chunk_overlap=30,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    return splitter.split_documents(docs)
