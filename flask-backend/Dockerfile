# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy the rest of the working directory contents into the container
COPY . .

# Make port 10000 available to the world outside this container
# Expose port (Documentation only, Railway ignores this but good practice)
EXPOSE $PORT

# Run app.py using gunicorn with dynamic port
# URL-encoded shell form to allow $PORT expansion
CMD gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 1 --threads 4

