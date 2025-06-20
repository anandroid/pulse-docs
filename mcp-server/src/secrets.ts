import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { promises as fs } from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface Secrets {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  github: {
    token: string;
  };
  gcloud: {
    projectId: string;
    applicationCredentials?: string;
  };
}

export class SecretsManager {
  private secrets: Partial<Secrets> = {};
  private secretClient?: SecretManagerServiceClient;
  
  constructor() {
    this.initializeGCloud();
  }

  private initializeGCloud(): void {
    try {
      // Check if gcloud is configured
      const projectId = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
      if (projectId) {
        this.secrets.gcloud = { projectId };
        
        // Check for application default credentials
        const adcPath = execSync('gcloud info --format="value(config.paths.application_default_credentials_path)"', { encoding: 'utf8' }).trim();
        if (adcPath && fs.existsSync(adcPath)) {
          this.secrets.gcloud.applicationCredentials = adcPath;
        }
        
        this.secretClient = new SecretManagerServiceClient();
      }
    } catch (error) {
      console.error('Failed to initialize gcloud:', error);
    }
  }

  async loadSecrets(): Promise<void> {
    // Try to load from Google Secret Manager
    if (this.secretClient && this.secrets.gcloud?.projectId) {
      await this.loadFromSecretManager();
    }
    
    // Try to load from gcloud config
    await this.loadFromGCloudConfig();
    
    // Try to load from environment variables as fallback
    this.loadFromEnvironment();
  }

  private async loadFromSecretManager(): Promise<void> {
    try {
      const projectId = this.secrets.gcloud!.projectId;
      
      // Load Supabase secrets
      const supabaseUrl = await this.getSecret(projectId, 'supabase-url');
      const supabaseAnonKey = await this.getSecret(projectId, 'supabase-anon-key');
      const supabaseServiceKey = await this.getSecret(projectId, 'supabase-service-role-key');
      
      if (supabaseUrl && supabaseAnonKey) {
        this.secrets.supabase = {
          url: supabaseUrl,
          anonKey: supabaseAnonKey,
          serviceRoleKey: supabaseServiceKey,
        };
      }
      
      // Load GitHub token
      const githubToken = await this.getSecret(projectId, 'github-token');
      if (githubToken) {
        this.secrets.github = { token: githubToken };
      }
    } catch (error) {
      console.error('Failed to load from Secret Manager:', error);
    }
  }

  private async loadFromGCloudConfig(): Promise<void> {
    try {
      // Try to get GitHub token from gcloud auth
      const githubToken = execSync('gcloud auth application-default print-access-token 2>/dev/null', { encoding: 'utf8' }).trim();
      if (githubToken && !this.secrets.github?.token) {
        this.secrets.github = { token: githubToken };
      }
    } catch (error) {
      // Silent fail - this is optional
    }
  }

  private loadFromEnvironment(): void {
    // Load from environment variables if not already loaded
    if (!this.secrets.supabase?.url && process.env.SUPABASE_URL) {
      this.secrets.supabase = {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      };
    }
    
    if (!this.secrets.github?.token && process.env.GITHUB_TOKEN) {
      this.secrets.github = { token: process.env.GITHUB_TOKEN };
    }
    
    if (!this.secrets.gcloud?.projectId && process.env.GCLOUD_PROJECT) {
      this.secrets.gcloud = {
        ...this.secrets.gcloud,
        projectId: process.env.GCLOUD_PROJECT,
      };
    }
  }

  private async getSecret(projectId: string, secretId: string): Promise<string | undefined> {
    try {
      const name = `projects/${projectId}/secrets/${secretId}/versions/latest`;
      const [version] = await this.secretClient!.accessSecretVersion({ name });
      return version.payload?.data?.toString();
    } catch (error) {
      console.error(`Failed to get secret ${secretId}:`, error);
      return undefined;
    }
  }

  getSupabaseConfig() {
    return this.secrets.supabase;
  }

  getGitHubToken() {
    return this.secrets.github?.token;
  }

  getGCloudConfig() {
    return this.secrets.gcloud;
  }
  
  hasSupabase(): boolean {
    return !!(this.secrets.supabase?.url && this.secrets.supabase?.anonKey);
  }
  
  hasGitHub(): boolean {
    return !!this.secrets.github?.token;
  }
  
  hasGCloud(): boolean {
    return !!this.secrets.gcloud?.projectId;
  }
}