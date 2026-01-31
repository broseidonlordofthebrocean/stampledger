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
RUN make build

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates curl jq

WORKDIR /root

# Copy the binary from builder
COPY --from=builder /app/build/stampledger-chaind /usr/local/bin/

# Expose ports
# P2P
EXPOSE 26656
# Tendermint RPC
EXPOSE 26657
# REST API
EXPOSE 1317
# gRPC
EXPOSE 9090
# gRPC-Web
EXPOSE 9091

# Create data directory
RUN mkdir -p /root/.stampledger-chain

# Set entrypoint
ENTRYPOINT ["stampledger-chaind"]
CMD ["start"]
