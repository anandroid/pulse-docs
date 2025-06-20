import { Octokit } from '@octokit/rest';
import { SecretsManager } from '../secrets.js';

export interface GitHubRepoArgs {
  owner: string;
  repo: string;
}

export interface GitHubIssueArgs extends GitHubRepoArgs {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
  creator?: string;
  per_page?: number;
}

export interface GitHubCreateIssueArgs extends GitHubRepoArgs {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export interface GitHubPRArgs extends GitHubRepoArgs {
  state?: 'open' | 'closed' | 'all';
  head?: string;
  base?: string;
  per_page?: number;
}

export interface GitHubCreatePRArgs extends GitHubRepoArgs {
  title: string;
  body?: string;
  head: string;
  base: string;
  draft?: boolean;
}

export interface GitHubFileArgs extends GitHubRepoArgs {
  path: string;
  ref?: string;
}

export interface GitHubSearchArgs {
  query: string;
  type: 'repositories' | 'code' | 'issues' | 'users';
  per_page?: number;
}

export class GitHubIntegration {
  private octokit?: Octokit;
  private secretsManager: SecretsManager;

  constructor(secretsManager: SecretsManager) {
    this.secretsManager = secretsManager;
  }

  async initialize(): Promise<boolean> {
    const token = this.secretsManager.getGitHubToken();
    if (!token) {
      return false;
    }

    this.octokit = new Octokit({
      auth: token,
    });

    return true;
  }

  isAvailable(): boolean {
    return !!this.octokit;
  }

  async getRepository(args: GitHubRepoArgs): Promise<any> {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const { data } = await this.octokit.repos.get({
      owner: args.owner,
      repo: args.repo,
    });

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      private: data.private,
      defaultBranch: data.default_branch,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      url: data.html_url,
    };
  }

  async listIssues(args: GitHubIssueArgs): Promise<any> {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const { data } = await this.octokit.issues.listForRepo({
      owner: args.owner,
      repo: args.repo,
      state: args.state || 'open',
      labels: args.labels?.join(','),
      assignee: args.assignee,
      creator: args.creator,
      per_page: args.per_page || 30,
    });

    return data.map(issue => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      body: issue.body,
      user: issue.user?.login,
      labels: issue.labels?.map(l => (typeof l === 'string' ? l : l.name)),
      assignees: issue.assignees?.map(a => a.login),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      url: issue.html_url,
    }));
  }

  async createIssue(args: GitHubCreateIssueArgs): Promise<any> {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const { data } = await this.octokit.issues.create({
      owner: args.owner,
      repo: args.repo,
      title: args.title,
      body: args.body,
      labels: args.labels,
      assignees: args.assignees,
    });

    return {
      number: data.number,
      title: data.title,
      state: data.state,
      url: data.html_url,
    };
  }

  async listPullRequests(args: GitHubPRArgs): Promise<any> {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const { data } = await this.octokit.pulls.list({
      owner: args.owner,
      repo: args.repo,
      state: args.state || 'open',
      head: args.head,
      base: args.base,
      per_page: args.per_page || 30,
    });

    return data.map(pr => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      body: pr.body,
      user: pr.user?.login,
      head: pr.head.ref,
      base: pr.base.ref,
      draft: pr.draft,
      merged: pr.merged_at !== null,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      url: pr.html_url,
    }));
  }

  async createPullRequest(args: GitHubCreatePRArgs): Promise<any> {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const { data } = await this.octokit.pulls.create({
      owner: args.owner,
      repo: args.repo,
      title: args.title,
      body: args.body,
      head: args.head,
      base: args.base,
      draft: args.draft,
    });

    return {
      number: data.number,
      title: data.title,
      state: data.state,
      url: data.html_url,
    };
  }

  async getFileContent(args: GitHubFileArgs): Promise<any> {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    try {
      const { data } = await this.octokit.repos.getContent({
        owner: args.owner,
        repo: args.repo,
        path: args.path,
        ref: args.ref,
      });

      if ('content' in data && data.type === 'file') {
        return {
          name: data.name,
          path: data.path,
          content: Buffer.from(data.content, 'base64').toString('utf-8'),
          size: data.size,
          sha: data.sha,
          url: data.html_url,
        };
      } else {
        throw new Error('Path is not a file');
      }
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`File not found: ${args.path}`);
      }
      throw error;
    }
  }

  async search(args: GitHubSearchArgs): Promise<any> {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const searchMethod = {
      repositories: this.octokit.search.repos,
      code: this.octokit.search.code,
      issues: this.octokit.search.issuesAndPullRequests,
      users: this.octokit.search.users,
    }[args.type];

    const { data } = await searchMethod({
      q: args.query,
      per_page: args.per_page || 30,
    });

    return data.items;
  }

  getTools() {
    return [
      {
        name: 'github_get_repo',
        description: 'Get information about a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_list_issues',
        description: 'List issues in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            state: {
              type: 'string',
              enum: ['open', 'closed', 'all'],
              description: 'Issue state',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by labels',
            },
            assignee: {
              type: 'string',
              description: 'Filter by assignee',
            },
            creator: {
              type: 'string',
              description: 'Filter by creator',
            },
            per_page: {
              type: 'number',
              description: 'Results per page',
            },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_create_issue',
        description: 'Create a new issue in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            title: {
              type: 'string',
              description: 'Issue title',
            },
            body: {
              type: 'string',
              description: 'Issue body',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Labels to apply',
            },
            assignees: {
              type: 'array',
              items: { type: 'string' },
              description: 'Users to assign',
            },
          },
          required: ['owner', 'repo', 'title'],
        },
      },
      {
        name: 'github_list_prs',
        description: 'List pull requests in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            state: {
              type: 'string',
              enum: ['open', 'closed', 'all'],
              description: 'PR state',
            },
            head: {
              type: 'string',
              description: 'Filter by head branch',
            },
            base: {
              type: 'string',
              description: 'Filter by base branch',
            },
            per_page: {
              type: 'number',
              description: 'Results per page',
            },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github_create_pr',
        description: 'Create a new pull request in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            title: {
              type: 'string',
              description: 'PR title',
            },
            body: {
              type: 'string',
              description: 'PR body',
            },
            head: {
              type: 'string',
              description: 'Branch containing changes',
            },
            base: {
              type: 'string',
              description: 'Branch to merge into',
            },
            draft: {
              type: 'boolean',
              description: 'Create as draft PR',
            },
          },
          required: ['owner', 'repo', 'title', 'head', 'base'],
        },
      },
      {
        name: 'github_get_file',
        description: 'Get file content from a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            path: {
              type: 'string',
              description: 'File path',
            },
            ref: {
              type: 'string',
              description: 'Branch, tag, or commit',
            },
          },
          required: ['owner', 'repo', 'path'],
        },
      },
      {
        name: 'github_search',
        description: 'Search GitHub for repositories, code, issues, or users',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            type: {
              type: 'string',
              enum: ['repositories', 'code', 'issues', 'users'],
              description: 'Type of search',
            },
            per_page: {
              type: 'number',
              description: 'Results per page',
            },
          },
          required: ['query', 'type'],
        },
      },
    ];
  }
}