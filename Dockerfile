FROM node:lts

WORKDIR /usr/app

# 複製所有檔案到工作目錄
COPY . .
RUN npm install

EXPOSE 3000

CMD node main.js