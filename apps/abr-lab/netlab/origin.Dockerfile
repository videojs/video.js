FROM node:22-alpine
RUN apk add --no-cache iproute2 ethtool openssl
WORKDIR /app
COPY origin.mjs .
# netem's rate and queue limit count packets, so segmentation offloads (64 kB super-packets) must be off.
CMD ["sh", "-c", "ethtool -K eth0 tso off gso off gro off >/dev/null 2>&1; mkdir -p /tls && openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes -days 30 -subj /CN=origin -addext subjectAltName=DNS:origin -keyout /tls/key.pem -out /tls/cert.pem 2>/dev/null && exec node origin.mjs"]
