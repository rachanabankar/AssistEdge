from pathlib import Path
from zipfile import ZipFile, BadZipFile
from xml.etree import ElementTree

from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, TextLoader


def load_document(filepath: str):
    """
    Load a document from disk into LangChain's standard Document format.
    Supports PDF, plain text, Markdown and DOCX without resolving embedded links.
    """
    extension = Path(filepath).suffix.lower()
    if extension == ".pdf":
        return PyPDFLoader(filepath).load()
    if extension in {".txt", ".md"}:
        return TextLoader(filepath, encoding="utf-8").load()
    if extension == ".docx":
        try:
            with ZipFile(filepath) as archive:
                info = archive.getinfo("word/document.xml")
                if info.file_size > 20 * 1024 * 1024:
                    raise ValueError("DOCX text is too large")
                xml = archive.read(info)
            declarations = xml.upper().replace(b"\x00", b"")
            if b"<!DOCTYPE" in declarations or b"<!ENTITY" in declarations:
                raise ValueError("DOCX entities are not supported")
            root = ElementTree.fromstring(xml)
            namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            text = "\n".join(
                "".join(paragraph.itertext())
                for paragraph in root.findall(".//w:p", namespace)
            )
            return [Document(page_content=text, metadata={"source": filepath})]
        except (BadZipFile, KeyError, ElementTree.ParseError) as error:
            raise ValueError("Invalid DOCX document") from error
    raise ValueError("Unsupported document type")
