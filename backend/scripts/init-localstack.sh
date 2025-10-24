#!/bin/bash

# Script para inicializar recursos do LocalStack (SQS)

echo "🚀 Initializing LocalStack resources..."

# Aguarda LocalStack estar pronto
echo "⏳ Waiting for LocalStack to be ready..."
until curl -s http://localhost:4566/_localstack/health | grep -q '"sqs": "running"'; do
  sleep 2
done

echo "✅ LocalStack is ready!"

# Cria a fila SQS
echo "📨 Creating SQS queue..."
aws --endpoint-url=http://localhost:4566 \
    --region us-east-1 \
    sqs create-queue \
    --queue-name painelml-webhooks \
    --attributes VisibilityTimeout=300,MessageRetentionPeriod=86400,ReceiveMessageWaitTimeSeconds=20

echo "✅ SQS queue created successfully!"

# Lista as filas
echo "📋 Available queues:"
aws --endpoint-url=http://localhost:4566 \
    --region us-east-1 \
    sqs list-queues

echo "🎉 LocalStack initialization complete!"
