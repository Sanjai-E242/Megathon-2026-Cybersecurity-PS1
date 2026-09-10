import { ExternalIntegrationAdapter, IntegrationStatus, ToolExecutionResult } from './types.js';

export interface GitHubToolParams {
  title?: string;
  body?: string;
  issue_number?: number;
  state?: string;
  labels?: string[];
  [key: string]: unknown;
}

export class GitHubIntegrationAdapter implements ExternalIntegrationAdapter {
  public readonly id = 'github';
  public readonly name = 'GitHub REST API';

  private apiBase = 'https://api.github.com';

  private get token(): string | undefined {
    return process.env.GITHUB_TOKEN?.trim();
  }

  public get defaultOwner(): string {
    return process.env.GITHUB_DEMO_OWNER?.trim() || 'Sanjai-E242';
  }

  public get defaultRepo(): string {
    return process.env.GITHUB_DEMO_REPO?.trim() || 'sentinel-runtime';
  }

  public isConfigured(): boolean {
    const t = this.token;
    return Boolean(t && t !== 'your_personal_access_token_here' && t.length > 5);
  }

  public async getStatus(): Promise<IntegrationStatus> {
    const configured = this.isConfigured();
    return {
      id: this.id,
      name: this.name,
      connected: configured,
      configured,
      targetInfo: {
        owner: this.defaultOwner,
        repo: this.defaultRepo,
        api_base: this.apiBase,
      },
      reason: configured
        ? undefined
        : 'GITHUB_TOKEN not configured (Demo Fallback Mode Active)',
    };
  }

  /**
   * Parse target string "owner/repo" or use defaults
   */
  private parseTarget(target?: string): { owner: string; repo: string } {
    if (target && target.includes('/') && !target.startsWith('http')) {
      const parts = target.split('/');
      if (parts[0] && parts[1]) {
        return { owner: parts[0].trim(), repo: parts[1].trim() };
      }
    }
    return { owner: this.defaultOwner, repo: this.defaultRepo };
  }

  /**
   * Execute protected GitHub tool.
   * CRITICAL SECURITY INVARIANT:
   * 1. Sentinel Runtime must have already approved this action.
   * 2. delete_repository is NEVER sent to GitHub API.
   * 3. Arbitrary URLs or shell commands are strictly blocked.
   */
  public async executeTool(
    toolName: string,
    target: string,
    params: Record<string, unknown> = {},
    context?: {
      action_id: string;
      session_id: string;
      principal_id: string;
      decision: string;
    }
  ): Promise<ToolExecutionResult> {
    const normalizedTool = toolName.toLowerCase().trim();
    const { owner, repo } = this.parseTarget(target);

    // Strict safety check: delete_repository is simulation-only
    if (normalizedTool === 'delete_repository') {
      return {
        success: false,
        status: 403,
        error: 'ForbiddenOperation',
        message: 'Destructive action delete_repository is strictly forbidden from executing on GitHub API',
        output: {
          simulated_block: true,
          target: `${owner}/${repo}`,
          reason: 'Protected repository destruction prevention enforced by Sentinel adapter.',
        },
      };
    }

    // Supported tool validation
    const supportedTools = ['get_repository', 'list_issues', 'create_issue', 'add_comment'];
    if (!supportedTools.includes(normalizedTool)) {
      return {
        success: false,
        status: 400,
        error: 'UnsupportedTool',
        message: `Unknown GitHub tool: '${toolName}'. Supported tools: ${supportedTools.join(', ')}`,
        output: null,
      };
    }

    // If GITHUB_TOKEN is not configured, execute in safe local demonstration mode
    if (!this.isConfigured()) {
      return this.executeMockTool(normalizedTool, owner, repo, params, context);
    }

    // Real GitHub API invocation
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let endpoint = '';
      let method = 'GET';
      let requestBody: string | undefined;

      switch (normalizedTool) {
        case 'get_repository':
          endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
          method = 'GET';
          break;

        case 'list_issues':
          endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?per_page=10&state=${encodeURIComponent((params.state as string) || 'open')}`;
          method = 'GET';
          break;

        case 'create_issue':
          endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`;
          method = 'POST';
          requestBody = JSON.stringify({
            title: params.title || `[Sentinel Verified] Task from ${context?.principal_id || 'AI Agent'}`,
            body: params.body || `Automated issue proposed by agent and sanctioned by Sentinel Runtime at ${new Date().toISOString()}`,
            labels: Array.isArray(params.labels) ? params.labels : ['sentinel-runtime', 'automated'],
          });
          break;

        case 'add_comment': {
          const issueNumber = Number(params.issue_number) || 1;
          endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/comments`;
          method = 'POST';
          requestBody = JSON.stringify({
            body: params.body || `Action verified and approved by Sentinel Runtime (Action ID: ${context?.action_id || 'unknown'})`,
          });
          break;
        }
      }

      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Sentinel-Runtime-Security-Harness',
        'Authorization': `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      };

      if (requestBody) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${this.apiBase}${endpoint}`, {
        method,
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: data.message || `GitHub API request failed with status ${response.status}`,
          message: `GitHub API error (${response.status}): ${data.message || response.statusText}`,
          output: {
            status: response.status,
            error: data.message || response.statusText,
            documentation_url: data.documentation_url,
          },
        };
      }

      return {
        success: true,
        status: response.status,
        message: `Successfully executed GitHub tool '${normalizedTool}' on ${owner}/${repo}`,
        output: data,
      };
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      return {
        success: false,
        status: isAbort ? 408 : 500,
        error: isAbort ? 'RequestTimeout' : 'NetworkError',
        message: isAbort
          ? 'GitHub API request timed out after 8000ms'
          : `Network error connecting to GitHub: ${err?.message || 'Unknown error'}`,
        output: null,
      };
    }
  }

  /**
   * Deterministic local fallback when GITHUB_TOKEN is not provided.
   * Provides realistic demonstration payloads without fake claims.
   */
  private executeMockTool(
    toolName: string,
    owner: string,
    repo: string,
    params: Record<string, unknown>,
    context?: { action_id: string; session_id: string; principal_id: string; decision: string }
  ): ToolExecutionResult {
    switch (toolName) {
      case 'get_repository':
        return {
          success: true,
          status: 200,
          message: `[Demo Mode] Simulated repository metadata for ${owner}/${repo}`,
          output: {
            id: 88720194,
            name: repo,
            full_name: `${owner}/${repo}`,
            private: false,
            description: 'Runtime Security Harness for AI Agents — Gated Tool Execution Demo',
            html_url: `https://github.com/${owner}/${repo}`,
            default_branch: 'main',
            open_issues_count: 3,
            stargazers_count: 42,
            forks_count: 7,
            visibility: 'public',
            demo_mode: true,
          },
        };

      case 'list_issues':
        return {
          success: true,
          status: 200,
          message: `[Demo Mode] Retrieved open issues for ${owner}/${repo}`,
          output: [
            {
              id: 101,
              number: 1,
              title: 'Implement cross-session drift monitoring for external tools',
              state: 'open',
              user: { login: 'sentinel-bot' },
              created_at: new Date(Date.now() - 86400000).toISOString(),
              comments: 2,
            },
            {
              id: 102,
              number: 2,
              title: 'Add rate limiting to external agent API endpoints',
              state: 'open',
              user: { login: 'security-admin' },
              created_at: new Date(Date.now() - 43200000).toISOString(),
              comments: 1,
            },
          ],
        };

      case 'create_issue':
        return {
          success: true,
          status: 201,
          message: `[Demo Mode] Simulated issue creation on ${owner}/${repo}`,
          output: {
            id: 103,
            number: 3,
            title: params.title || `[Sentinel Verified] Task from ${context?.principal_id || 'AI Agent'}`,
            body: params.body || 'Issue proposed by agent and authorized by Sentinel Runtime',
            state: 'open',
            created_at: new Date().toISOString(),
            html_url: `https://github.com/${owner}/${repo}/issues/3`,
            demo_mode: true,
          },
        };

      case 'add_comment': {
        const issueNumber = Number(params.issue_number) || 1;
        return {
          success: true,
          status: 201,
          message: `[Demo Mode] Simulated comment added to issue #${issueNumber} on ${owner}/${repo}`,
          output: {
            id: 201,
            issue_url: `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
            body: params.body || `Action verified and executed via Sentinel Runtime (Action ID: ${context?.action_id || 'act_demo'})`,
            created_at: new Date().toISOString(),
            demo_mode: true,
          },
        };
      }

      default:
        return {
          success: false,
          status: 400,
          error: 'UnsupportedTool',
          message: `Unsupported GitHub tool: ${toolName}`,
          output: null,
        };
    }
  }
}

export const gitHubAdapter = new GitHubIntegrationAdapter();
