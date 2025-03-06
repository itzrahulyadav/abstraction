FROM amazonlinux:2023

# Install Docker
RUN yum update -y && \
    yum install -y docker && \
    yum clean all

# Ensure Docker socket directory exists
RUN mkdir -p /var/run

# Start Docker daemon in the foreground
CMD ["dockerd", "--host=unix:///var/run/docker.sock"]
