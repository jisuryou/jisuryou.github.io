from flask import Flask, request, jsonify

import os
import csv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.schema import Document 

# Initialize Flask app
app = Flask(__name__)

api_key = "OPENAI_API_KEY"

# 단계 1: 문서 로드(Load Documents)
# 폴더 경로 설정
database_folder = "./database"
notion_folder = os.path.join(database_folder, "notion")

# Document 리스트 초기화
docs = []

# 1. notion 폴더의 md 파일 로드
for file_name in os.listdir(notion_folder):
    if file_name.endswith(".md"):
        file_path = os.path.join(notion_folder, file_name)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            docs.append(Document(page_content=content, metadata={"file_name": file_name, "type": "md"}))

# 2. notion 폴더의 csv 파일 로드
for file_name in os.listdir(notion_folder):
    if file_name.endswith(".csv"):
        file_path = os.path.join(notion_folder, file_name)
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            content = "\n".join([", ".join(row) for row in reader])  # CSV 내용을 문자열로 변환
            docs.append(Document(page_content=content, metadata={"file_name": file_name, "type": "csv"}))

# 3. database 폴더의 cv.txt 파일 로드
for file_name in os.listdir(database_folder):
    if file_name.endswith(".txt"):
        file_path = os.path.join(database_folder, file_name)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            docs.append(Document(page_content=content, metadata={"file_name": file_name, "type": "txt"}))

# 단계 2: 문서 분할(Split Documents)
text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=10)
split_documents = text_splitter.split_documents(docs)

# 단계 3: 임베딩(Embedding) 생성
embeddings = OpenAIEmbeddings(openai_api_key=api_key)

# 단계 4: DB 생성(Create DB) 및 저장
vectorstore = FAISS.from_documents(documents=split_documents, embedding=embeddings)

# 단계 5: 검색기(Retriever) 생성
retriever = vectorstore.as_retriever(search_kwargs={"k": 20})

# 단계 6: 프롬프트 생성(Create Prompt)
prompt = PromptTemplate.from_template(
    """Your name is Jisu(지수). You're currently searching for a job in AI Service Design or UX Research. 
Use the CV and portfolio provided to answer the interviewer's questions. 
Be as detailed, humble and bulleted as possible.
If you don't know the answer or the information is not in your portfolio, politely state that it is not in your portfolio. 
If the question is in English, answer in English. If the question is in Korean, answer in Korean.

#Question: 
{question} 
#Context: 
{context} 

#Answer:"""
)

# 단계 7: 언어모델(LLM) 생성
llm = ChatOpenAI(model_name="gpt-4o", temperature=0, openai_api_key=api_key)

# 단계 8: 체인(Chain) 생성
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '')
    if not user_message:
        return jsonify({"reply": "No message provided."})
    
    # Use the chain to get a response
    response = chain.invoke(user_message)
    return jsonify({"reply": response})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)