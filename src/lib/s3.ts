import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, type ObjectCannedACL } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Storage {
  private s3Client: S3Client;
  private bucketName: string;
  private folder: string;
  private region:string;

  constructor(folder: string = "products") {
    this.bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!;
    this.folder = folder;
    this.region=process.env.NEXT_PUBLIC_AWS_REGION!
    
    this.s3Client = new S3Client({
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      endpoint: `https://${process.env.NEXT_PUBLIC_AWS_ENDPOINT}`,
      forcePathStyle: false,
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
      },
    });
  }


  private getFullKey(fileName: string): string {
    return `${this.folder}/${fileName}`;
  }


  async uploadFile({
    file,
    fileName,
    contentType
  }: {
    file: Buffer,
    fileName: string,
    contentType: string
  }): Promise<string> {
    const fullKey = this.getFullKey(fileName);
    const acl: ObjectCannedACL | undefined =
      process.env.NEXT_PUBLIC_S3_OBJECT_ACL === "public-read" ? "public-read" : undefined;
    
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
        Body: file,
        ContentType: contentType,
        ACL: acl,
      })
    );

    return `https://${this.bucketName}.${process.env.NEXT_PUBLIC_AWS_ENDPOINT}/${fullKey}`;
  }


  async deleteFile(fileName: string): Promise<void> {
    const fullKey = this.getFullKey(fileName);
    
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
      })
    );
  }

  getUrl(fileName: string): string {
    const fullKey = this.getFullKey(fileName);
    return `https://${this.bucketName}.${process.env.NEXT_PUBLIC_AWS_ENDPOINT}/${fullKey}`;
  }

  async getSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string> {
    const fullKey = this.getFullKey(fileName);
    
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fullKey,
    });
    
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}

// Usage example:
// const s3 = new S3Storage(); // Uses "products" folder by default
// const userS3 = new S3Storage("users"); // Uses "users" folder
// 
// // Upload a file to products folder
// const fileBuffer = Buffer.from(await file.arrayBuffer());
// const url = await s3.uploadFile({
//   file: fileBuffer,
//   fileName: `${Date.now()}-${file.name}`,
//   contentType: file.type
// });
// 
// // Delete a file from products folder
// await s3.deleteFile("example-file.jpg");
