FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=3000
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
EXPOSE 3000

CMD ["npx", "next", "dev", "-p", "3000"]
