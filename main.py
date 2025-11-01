from flask import Flask, jsonify, request, render_template, session
import pandas as pd
# from flask_cors import CORS
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from get_embedding_function import get_embedding_function
import os


app = Flask(__name__)
# CORS(app)
app.secret_key = '123456'

CHROMA_PATH = "chroma"

keyword_df = pd.read_csv("data/hxh_keywords.csv", delimiter=",")
keyword_df.columns = keyword_df.columns.str.strip()
keyword_df.columns = keyword_df.columns.str.replace("\ufeff", "")  # remove BOM
print(keyword_df.columns)


PROMPT_TEMPLATE = """
Bạn là một nhà thơ Việt Nam thế kỷ XIX, am hiểu thơ Nôm và thể Đường luật.

Dưới đây là vài bài thơ mẫu để học cấu trúc và phong cách:
{context}

---

**NHIỆM VỤ**
Hãy viết bài **vịnh “{topic}”** theo **thể thơ Nôm Đường luật** (độ dài: {num_lines} câu).

**YÊU CẦU BẮT BUỘC**
1. Phải sử dụng **ít nhất một** trong các từ/cụm từ sau đây từ bảng Hồ Xuân Hương:
{selected_keywords}

2. Giữ phong vị của Hồ Xuân Hương:  
   - dân gian, phồn thực  
   - mỉa mai, táo bạo mà tinh tế  
   - hình ảnh sinh động, chữ Nôm gợi cảm  

3. Sau bài thơ, viết mục **CHÚ GIẢI**:  
   - liệt kê các từ đã dùng  
   - kèm chữ Nôm, giải nghĩa, giải cấu tạo chữ (lấy đúng từ bảng), trích dẫn (TV), trích dẫn (Nôm)
   - thay dấu '\n' trong trích dẫn (TV + Nôm) bằng dấu xuống dòng trong mục chú giải
   - sao y nguyên văn trích dẫn (TV), trích dẫn (Nôm)

---

**BẮT ĐẦU SÁNG TÁC**
"""


def format_keywords(df):
    out = ""
    for _, row in df.iterrows():
        out += (
            f"TỪ: {row['Từ / Cụm từ']}\n"
            f"Chữ Nôm: {row['Chữ Nôm']}\n"
            f"Giải nghĩa: {row['Giải nghĩa – Thi pháp']}\n"
            f"Trích dẫn (TV):\n{row['Trích dẫn nguồn (Tiếng Việt)']}\n"
            f"Trích dẫn (Nôm):\n{row['Trích dẫn nguồn (Chữ Nôm)']}\n"
            "---------------------------------------\n"
        )
    return out


@app.route('/')
def index():
    session.clear()
    return render_template('index.html')


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.json
    topic = data.get("topic")
    num_lines = data.get("num_lines", 8)

    # random keyword selection
    selected = keyword_df.sample(2)
    formatted_keywords = format_keywords(selected)

    print("\n===== KEYWORDS BLOCK =====")
    print(formatted_keywords)
    print("==========================\n")

    # RAG retrieval
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=get_embedding_function()
    )
    context_docs = db.similarity_search(topic, k=4)
    context_text = "\n---\n".join([doc.page_content for doc in context_docs])

    # Build prompt
    prompt = PROMPT_TEMPLATE.format(
        context=context_text,
        topic=topic,
        num_lines=num_lines,
        selected_keywords=formatted_keywords,
    )

    model = ChatOpenAI(model="gpt-4o")
    answer = model.invoke(prompt).content

    return jsonify({
        "poem": answer,
        "keywords_used": selected.to_dict(orient="records")
    })


# check server health
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Server is running fine!",
    }), 200


# deploy
# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 5000))
#     app.run(host="0.0.0.0", port=port)
# run local
if __name__ == "__main__":
    app.run()
