# Use the official Python base image for a stable and well-supported environment.
# We're using the "slim-buster" variant for a smaller image size.
FROM python:3.9-slim-buster

# Set the working directory inside the container.
WORKDIR /usr/src/app

# Copy the requirements file and install the dependencies.
# We do this first to leverage Docker's build cache.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install psycopg2-binary

# Copy the rest of the application code into the container.
COPY . .

# Expose port 5000, which is the default for many Python web frameworks.
# The Nginx reverse proxy will forward requests to this port.
EXPOSE 5000

# This is the command that starts your backend server.
# It assumes your application is in a file named `app.py`.
# Change this command to match your specific application's startup script.
#CMD ["python", "app/main.py"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]


