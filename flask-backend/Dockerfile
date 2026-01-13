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
EXPOSE 10000

# Define environment variable
ENV PORT=10000
ENV FLASK_APP=app.py

# Run app.py when the container launches
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10000", "--timeout", "120"]
