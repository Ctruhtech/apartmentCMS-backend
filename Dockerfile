FROM node:18
#RUN apt-get update && apt-get install -y build-essential
#RUN wget https://github.com/google/toktx/releases/download/v1.0.0/toktx-linux-64.zip
#RUN unzip toktx-linux-64.zip -d /usr/local/bin
#RUN chmod +x /usr/local/bin/toktx

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD [ "npm", "start" ]
