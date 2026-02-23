# Build stage
FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git make gcc musl-dev

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN go build -ldflags "-X github.com/cosmos/cosmos-sdk/version.Name=stampledgerchain" \
    -mod=readonly -o build/stampledger-chaind ./cmd/stampledger-chaind

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates curl jq openssl

WORKDIR /root

# Copy the binary from builder
COPY --from=builder /app/build/stampledger-chaind /usr/local/bin/

# Copy entrypoint script
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose ports
EXPOSE 26656 26657 1317 9090 9091

# Create data directory
RUN mkdir -p /root/.stampledger-chain

ENTRYPOINT ["/entrypoint.sh"]
