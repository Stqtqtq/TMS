FROM node:20-alpine

WORKDIR /app

COPY /transport_files/3api_pack.tgz .

# The --strip-components=1 option removes the top-level directory (subdir) from the paths during extraction, 
# placing package.json and node_modules directly in /app.
# RUN tar -xvf 3api_pack.tgz --strip-components=1 && rm 3api_pack.tgz

RUN npm install 3api_pack.tgz

COPY . /app

# Debugging step: List all files in /app to check if <file_looking_for> is present
# RUN ls -R /prod_package

# https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html#rule-2-set-a-user
# Create a system group and user, for Linux
# RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# For alpine
# https://wiki.alpinelinux.org/wiki/Setting_up_a_new_user

# Use 'diff' to list line by line what is the difference. Helpful for debugging during build phase
# Comparing dev package with installed package, removed if no differences
# 'set -e' exits immediately if the programs exits with non-zero status (success) 
RUN set -e;\
    if ! cmp ./package.json ./node_modules/assignment/package.json; then \
      echo "Error: package.json files do not match."; \
      exit 1; \
    fi; \
    mv node_modules/assignment/node_modules/* ./node_modules/ && \
    mv node_modules/assignment/package.json ./ && \
    rm -r 3api_pack.tgz ./prod_package ./transport_files

# RUN set -e; \
#     if cmp ./package.json ./node_modules/assignment/package.json && \
#        mv node_modules/assignment/node_modules/* ./node_modules/ && \
#        mv node_modules/assignment/package.json ./ && \
#        rm -r 3api_pack.tgz ./prod_package ./transport_files; then \
#     else \
#        echo "Error: One or more operations failed."; \
#        exit 1; \
#     fi

# Check if base image is alpine-based, this is because adduser is not supported outside of alpine
# 'passwd -l appuser' is to lock login attempt for that user as 'useradd' does not have the equivalent of '-D' in alpine
# which disables pwd entry for user, so it has to be defined differently outside of alpine-based system.doc
RUN if grep -qi 'alpine' /etc/os-release; then \
      adduser -D -H -u 1001 -s /bin/ash appuser; \
    else \
      useradd -r -M -u 1001 -s /bin/bash appuser && passwd -l appuser; \
    fi

RUN chmod -R 755 /app
    
# Switch to the non-root user
USER appuser

EXPOSE 3000
    
CMD ["node", "server.js"]