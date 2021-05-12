/* eslint-disable @typescript-eslint/naming-convention */
import { promises } from 'fs';
import { DependencyContainer } from 'tsyringe';
import S3 from 'aws-sdk/clients/s3';
import * as AWS from 'aws-sdk';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import { IFileProvider, ILogger, IMapProxyConfig, IS3Source } from '../interfaces';
import { Services } from '../constants';
import { SourceTypes } from '../enums/sourceTypes';

export class S3Provider implements IFileProvider {
  private readonly s3: S3;
  private readonly logger: ILogger;
  private readonly mapproxyConfig: IMapProxyConfig;

  public constructor(container: DependencyContainer) {
    this.logger = container.resolve(Services.LOGGER);
    this.mapproxyConfig = container.resolve(Services.MAPPROXY);
    const credentials: CredentialsOptions = {
      accessKeyId: this.mapproxyConfig.s3.awsAccessKeyId,
      secretAccessKey: this.mapproxyConfig.s3.awsSecretAccessKey,
    };
    const awsCredentials = new AWS.Credentials(credentials);
    const endpoint = this.mapproxyConfig.s3.endpointUrl;
    const sslEnabled = this.mapproxyConfig.s3.sslEnabled;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.s3 = new S3({
      credentials: awsCredentials,
      endpoint: endpoint,
      sslEnabled: sslEnabled,
      s3ForcePathStyle: true,
    });
  }

  public async uploadFile(filePath: string): Promise<void> {
    try {
      // Read content from the file
      const fileContent = await promises.readFile(filePath);
      // Setting up S3 upload parameters
      const params = {
        Bucket: this.mapproxyConfig.s3.configFileBucket,
        Key: this.mapproxyConfig.s3.objectKey, // File name you want to save as in S3
        Body: fileContent,
      };
      // Uploading files to the bucket
      await this.s3.upload(params).promise();
      this.logger.log('info', `File uploaded successfully.`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.log('error', `Failed to upload file: ${error}`);
      throw new Error(error);
    }
  }

  public async getFile(filePath: string): Promise<void> {
    try {
      // Setting up S3 upload parameters
      const params = {
        Bucket: this.mapproxyConfig.s3.configFileBucket,
        Key: this.mapproxyConfig.s3.objectKey, // File name you want to read from S3
      };
      // Reads file from the bucket
      this.logger.log('info', `Reading file from bucket: ${this.mapproxyConfig.s3.configFileBucket}`);
      const data = (await this.s3.getObject(params).promise()) as { Body: string };
      await promises.writeFile(filePath, data.Body.toString());
      this.logger.log('info', `Successfully read the file`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.log('error', `Failed to read file: ${error}`);
      throw new Error(error);
    }
  }
}
