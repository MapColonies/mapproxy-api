/* eslint-disable @typescript-eslint/naming-convention */
import { container } from 'tsyringe';
import S3 from 'aws-sdk/clients/s3';
import * as AWS from 'aws-sdk';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import { IConfigProvider, IMapProxyJsonDocument, IS3Config } from '../interfaces';
import { SERVICES } from '../constants';
import { convertJsonToYaml, convertYamlToJson } from '../utils';
import { Logger } from '@map-colonies/js-logger';

export class S3Provider implements IConfigProvider {
  private readonly s3: S3;
  private readonly logger: Logger;
  private readonly s3Config: IS3Config;

  public constructor() {
    this.logger = container.resolve(SERVICES.LOGGER);
    this.s3Config = container.resolve(SERVICES.S3);
    const credentials: CredentialsOptions = {
      accessKeyId: this.s3Config.accessKeyId,
      secretAccessKey: this.s3Config.secretAccessKey,
    };
    const awsCredentials = new AWS.Credentials(credentials);
    const endpoint = this.s3Config.endpointUrl;
    const sslEnabled = this.s3Config.sslEnabled;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.s3 = new S3({
      credentials: awsCredentials,
      endpoint: endpoint,
      sslEnabled: sslEnabled,
      s3ForcePathStyle: true,
    });
  }

  public async updateJson(jsonContent: IMapProxyJsonDocument): Promise<void> {
    try {
      //convert the updated json content to yaml content
      const yamlContent = convertJsonToYaml(jsonContent);
      // Setting up S3 upload parameters
      const params = {
        Bucket: this.s3Config.bucket,
        Key: this.s3Config.objectKey, // File name you want to save as in S3
        Body: yamlContent,
      };
      // Uploading files to the bucket
      await this.s3.upload(params).promise();
      this.logger.info(`File uploaded successfully.`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.info(`Failed to upload file: ${error}`);
      throw new Error(error);
    }
  }

  public async getJson(): Promise<IMapProxyJsonDocument> {
    try {
      // Setting up S3 upload parameters
      const params = {
        Bucket: this.s3Config.bucket,
        Key: this.s3Config.objectKey, // File name you want to read from S3
      };
      // Reads file from the bucket
      this.logger.info(`Reading file from bucket: ${this.s3Config.bucket}`);
      const data = (await this.s3.getObject(params).promise()) as { Body: string };
      const jsonContent: IMapProxyJsonDocument = convertYamlToJson(data.Body);
      this.logger.info(`Successfully read the file`);
      return jsonContent;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`Failed to read file: ${error}`);
      throw new Error(error);
    }
  }
}
