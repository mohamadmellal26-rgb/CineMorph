FROM golang:alpine AS builder

# تثبيت gcc و musl-dev لدعم CGO و SQLite3
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# تفعيل CGO والتوجه لمجلد cmd للبناء
ENV CGO_ENABLED=1
RUN GOOS=linux go build -o main ./cmd

FROM alpine:latest
WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]