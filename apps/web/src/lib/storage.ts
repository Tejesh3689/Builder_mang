import { S3Client } from '@aws-sdk/client-s3';

const useS3 = process.env.STORAGE_DRIVER === 's3';

if (useS3 && (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)) {
  throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required when STORAGE_DRIVER=s3');
}

export const s3 = useS3 ? new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
}) : null as any;

export default s3;
