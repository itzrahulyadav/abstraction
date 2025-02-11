# Use the official Golang image as the builder
FROM golang:1.23.6 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application files
COPY . .

# Build the Go WebSocket server
RUN go build -o server .

# Use a lightweight image to run the compiled binary
FROM alpine:latest

# Set working directory in the container
WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/server .

# Expose the WebSocket port
EXPOSE 8080

# Run the WebSocket server
CMD ["./server"]
