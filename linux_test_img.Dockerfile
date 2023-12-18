# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Node.js
# Debian-based container (like python:slim), so we use apt-get
RUN set -uex; \
    apt-get update; \
    apt-get install -y ca-certificates curl gnupg; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
    NODE_MAJOR=18; \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list; \
    apt-get -qy update; \
    apt-get -qy install nodejs;

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed Python packages specified in requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Install any needed Node.js packages specified in package.json
RUN cd frontend && npm install

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV NAME World
