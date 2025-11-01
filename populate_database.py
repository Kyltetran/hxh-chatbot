import os
import shutil
import pandas as pd
from tqdm import tqdm
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from get_embedding_function import get_embedding_function

DATA_PATH = "data"
CHROMA_PATH = "chroma"


def main():
    if os.path.exists(CHROMA_PATH):
        print("🔁 Clearing old database...")
        shutil.rmtree(CHROMA_PATH)

    print("📘 Loading poems.csv...")
    df = pd.read_csv(os.path.join(DATA_PATH, "hxh_poems.csv"), delimiter=",")

    documents = []
    for _, row in df.iterrows():
        documents.append(
            Document(
                page_content=row["Poem"],
                metadata={"title": row["Title"]}
            )
        )

    print(f"✅ Loaded {len(documents)} poem documents")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=100
    )
    chunks = []
    for doc in tqdm(documents):
        chunks.extend(splitter.split_documents([doc]))

    print(f"✅ Created {len(chunks)} chunks")

    print("📦 Adding to Chroma...")
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=get_embedding_function()
    )
    db.add_documents(chunks)
    print("✅ Done!")


if __name__ == "__main__":
    main()
