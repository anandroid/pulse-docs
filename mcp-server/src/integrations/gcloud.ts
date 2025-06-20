import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { SecretsManager } from '../secrets.js';
import { execSync } from 'child_process';

export interface GCloudStorageListArgs {
  bucket: string;
  prefix?: string;
  delimiter?: string;
  maxResults?: number;
}

export interface GCloudStorageReadArgs {
  bucket: string;
  file: string;
}

export interface GCloudStorageWriteArgs {
  bucket: string;
  file: string;
  content: string;
  contentType?: string;
}

export interface GCloudSecretArgs {
  secretId: string;
  version?: string;
}

export interface GCloudCommandArgs {
  command: string;
  args?: string[];
}

export class GCloudIntegration {
  private storage?: Storage;
  private secretClient?: SecretManagerServiceClient;
  private secretsManager: SecretsManager;
  private projectId?: string;

  constructor(secretsManager: SecretsManager) {
    this.secretsManager = secretsManager;
  }

  async initialize(): Promise<boolean> {
    const config = this.secretsManager.getGCloudConfig();
    if (!config?.projectId) {
      return false;
    }

    this.projectId = config.projectId;

    try {
      // Initialize Storage client
      this.storage = new Storage({
        projectId: this.projectId,
      });

      // Initialize Secret Manager client
      this.secretClient = new SecretManagerServiceClient();

      return true;
    } catch (error) {
      console.error('Failed to initialize Google Cloud clients:', error);
      return false;
    }
  }

  isAvailable(): boolean {
    return !!(this.storage && this.secretClient && this.projectId);
  }

  async listBucketContents(args: GCloudStorageListArgs): Promise<any> {
    if (!this.storage) {
      throw new Error('Google Cloud Storage client not initialized');
    }

    const bucket = this.storage.bucket(args.bucket);
    const [files] = await bucket.getFiles({
      prefix: args.prefix,
      delimiter: args.delimiter,
      maxResults: args.maxResults,
    });

    return files.map(file => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      created: file.metadata.timeCreated,
      updated: file.metadata.updated,
    }));
  }

  async readFile(args: GCloudStorageReadArgs): Promise<string> {
    if (!this.storage) {
      throw new Error('Google Cloud Storage client not initialized');
    }

    const bucket = this.storage.bucket(args.bucket);
    const file = bucket.file(args.file);
    const [content] = await file.download();
    
    return content.toString('utf-8');
  }

  async writeFile(args: GCloudStorageWriteArgs): Promise<void> {
    if (!this.storage) {
      throw new Error('Google Cloud Storage client not initialized');
    }

    const bucket = this.storage.bucket(args.bucket);
    const file = bucket.file(args.file);
    
    await file.save(args.content, {
      contentType: args.contentType || 'text/plain',
    });
  }

  async getSecret(args: GCloudSecretArgs): Promise<string> {
    if (!this.secretClient || !this.projectId) {
      throw new Error('Google Cloud Secret Manager client not initialized');
    }

    const version = args.version || 'latest';
    const name = `projects/${this.projectId}/secrets/${args.secretId}/versions/${version}`;
    
    const [secretVersion] = await this.secretClient.accessSecretVersion({ name });
    const secretValue = secretVersion.payload?.data?.toString();
    
    if (!secretValue) {
      throw new Error(`Secret ${args.secretId} not found or empty`);
    }
    
    return secretValue;
  }

  async executeGCloudCommand(args: GCloudCommandArgs): Promise<string> {
    try {
      const fullCommand = `gcloud ${args.command} ${args.args?.join(' ') || ''}`;
      const output = execSync(fullCommand, { encoding: 'utf8' });
      return output.trim();
    } catch (error: any) {
      throw new Error(`gcloud command failed: ${error.message}`);
    }
  }

  getTools() {
    return [
      {
        name: 'gcloud_storage_list',
        description: 'List files in a Google Cloud Storage bucket',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: {
              type: 'string',
              description: 'Bucket name',
            },
            prefix: {
              type: 'string',
              description: 'Filter results to objects whose names begin with this prefix',
            },
            delimiter: {
              type: 'string',
              description: 'Delimiter to use for grouping results',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results to return',
            },
          },
          required: ['bucket'],
        },
      },
      {
        name: 'gcloud_storage_read',
        description: 'Read a file from Google Cloud Storage',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: {
              type: 'string',
              description: 'Bucket name',
            },
            file: {
              type: 'string',
              description: 'File path within the bucket',
            },
          },
          required: ['bucket', 'file'],
        },
      },
      {
        name: 'gcloud_storage_write',
        description: 'Write a file to Google Cloud Storage',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: {
              type: 'string',
              description: 'Bucket name',
            },
            file: {
              type: 'string',
              description: 'File path within the bucket',
            },
            content: {
              type: 'string',
              description: 'Content to write',
            },
            contentType: {
              type: 'string',
              description: 'MIME type of the content',
            },
          },
          required: ['bucket', 'file', 'content'],
        },
      },
      {
        name: 'gcloud_secret_get',
        description: 'Retrieve a secret from Google Cloud Secret Manager',
        inputSchema: {
          type: 'object',
          properties: {
            secretId: {
              type: 'string',
              description: 'Secret ID',
            },
            version: {
              type: 'string',
              description: 'Secret version (default: latest)',
            },
          },
          required: ['secretId'],
        },
      },
      {
        name: 'gcloud_command',
        description: 'Execute a gcloud CLI command',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'gcloud command to execute (e.g., "compute instances list")',
            },
            args: {
              type: 'array',
              items: { type: 'string' },
              description: 'Additional arguments for the command',
            },
          },
          required: ['command'],
        },
      },
    ];
  }
}