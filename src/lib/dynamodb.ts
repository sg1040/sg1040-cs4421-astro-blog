// src/lib/dynamodb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const dynamo = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

export const db = DynamoDBDocumentClient.from(dynamo);
