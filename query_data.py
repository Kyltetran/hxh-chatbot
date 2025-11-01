# import argparse
# from langchain_chroma import Chroma
# from langchain.prompts import ChatPromptTemplate
# from langchain_openai import ChatOpenAI
# from get_embedding_functions import get_embedding_function

# CHROMA_PATH = "chroma"

# PROMPT_TEMPLATE = """
# Bạn là một nhà thơ Việt Nam thế kỷ XIX, am hiểu thơ Nôm và thể Đường luật.

# Dưới đây là vài bài thơ mẫu để học cấu trúc và phong cách:
# {context}

# ---

# **NHIỆM VỤ**
# Hãy viết bài **vịnh “{topic}”** theo **thể thơ Nôm Đường luật** (độ dài: {num_lines} câu).

# **YÊU CẦU BẮT BUỘC**
# 1. Phải sử dụng **ít nhất một** trong các từ/cụm từ sau đây từ bảng Hồ Xuân Hương:
# {selected_keywords}

# 2. Giữ phong vị của Hồ Xuân Hương:
#    - dân gian, phồn thực
#    - mỉa mai, táo bạo mà tinh tế
#    - hình ảnh sinh động, chữ Nôm gợi cảm

# 3. Sau bài thơ, viết mục **CHÚ GIẢI**:
#    - liệt kê các từ đã dùng
#    - kèm chữ Nôm, giải nghĩa, giải cấu tạo chữ (lấy đúng từ bảng)

# ---

# **BẮT ĐẦU SÁNG TÁC**
# """


# def query_rag(query_text: str):
#     db = Chroma(persist_directory=CHROMA_PATH,
#                 embedding_function=get_embedding_function())
#     results = db.similarity_search_with_score(query_text, k=5)

#     context_text = "\n\n---\n\n".join([doc.page_content for doc, _ in results])
#     prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
#     prompt = prompt_template.format(context=context_text, question=query_text)

#     model = ChatOpenAI(model="gpt-4o")
#     response_text = model.invoke(prompt).content

#     print("Response:", response_text)


# if __name__ == "__main__":
#     parser = argparse.ArgumentParser()
#     parser.add_argument("query_text", type=str, help="The query text.")
#     args = parser.parse_args()
#     query_rag(args.query_text)
