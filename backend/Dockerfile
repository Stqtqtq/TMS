FROM node:20-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . /app

# https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html#rule-2-set-a-user
# Create a system group and user, for Linux
# RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# For alpine
# https://wiki.alpinelinux.org/wiki/Setting_up_a_new_user
RUN adduser -S -D -H -u 1001 -s /bin/ash appuser

EXPOSE 3000

# Switch to the non-root user
USER appuser

CMD ["node", "server.js"]