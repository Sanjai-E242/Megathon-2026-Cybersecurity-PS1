import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, Code, ExternalLink, ShieldCheck, Key, BookOpen, Layers } from 'lucide-react';
import { api } from '../../lib/api';

export const DeveloperApiDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const curlSnippet = `curl -X POST http://localhost:3001/api/actions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $SENTINEL_AGENT_API_KEY" \\
  -d '{
    "action_id": "a_external_${Date.now().toString().slice(-4)}",
    "session_id": "sess_external_001",
    "principal_id": "external-agent-01",
    "resource_type": "database",
    "operation": "delete_table",
    "scope_required": "db.write",
    "target": "orders_prod",
    "metadata": {
      "row_count_estimate": 500000
    }
  }'`;

  const tsSdkSnippet = `import { SentinelClient } from './external-agent/sentinelClient';
import { ProtectedToolExecutor } from './external-agent/protectedTool';

const client = new SentinelClient({
  baseUrl: 'http://localhost:3001',
  apiKey: process.env.SENTINEL_AGENT_API_KEY
});

const executor = new ProtectedToolExecutor(client);

// Proposed tool execution is gated by Sentinel
const result = await executor.executeProtectedTool({
  session_id: 'sess_autogen_01',
  principal_id: 'external-agent-01',
  resource_type: 'database',
  operation: 'delete_table',
  scope_required: 'db.write',
  target: 'orders_prod',
  metadata: { row_count_estimate: 500000 }
});

if (result.status === 'BLOCKED') {
  console.error("Action blocked by Sentinel Runtime! Tool was not executed.");
}`;

  const pythonSnippet = `from external_agent.sentinel_client import SentinelClient
from external_agent.protected_tools import ProtectedToolExecutor

client = SentinelClient(base_url="http://localhost:3001")
executor = ProtectedToolExecutor(client)

# Evaluate and safely execute tool only if cleared
result = executor.execute_protected_tool({
    "session_id": "sess_langchain_agent",
    "principal_id": "external-agent-01",
    "resource_type": "database",
    "operation": "delete_table",
    "scope_required": "db.write",
    "target": "orders_prod"
})

print(f"Status: {result['status']}")`;

  const runLiveTest = async () => {
    setIsTesting(true);
    try {
      const res = await api.submitAction({
        session_id: 'sess_live_curl_test',
        principal_id: 'external-agent-01',
        resource_type: 'database',
        operation: 'delete_table',
        scope_required: 'db.write',
        target: 'orders_prod',
        metadata: { row_count_estimate: 500000 },
      });
      setTestResponse(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setTestResponse(JSON.stringify({ error: err?.message }, null, 2));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>EXTERNAL AGENT REST API & CLIENT SDK</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Connect any AI agent framework (LangChain, AutoGen, CrewAI, Python, TypeScript) to Sentinel Runtime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>API ACTIVE & HEALTHY</span>
          </div>
        </div>
      </div>

      {/* Integration Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="text-slate-500 font-bold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>HTTP Endpoint</span>
          </div>
          <div className="font-bold text-slate-900 dark:text-white">POST /api/actions</div>
          <p className="text-[11px] text-slate-500">Evaluates proposed actions before tools execute</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="text-slate-500 font-bold flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Authentication</span>
          </div>
          <div className="font-bold text-slate-900 dark:text-white">Bearer &lt;API_KEY&gt;</div>
          <p className="text-[11px] text-slate-500">Configured via SENTINEL_AGENT_API_KEY</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
          <div className="text-slate-500 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>SDK Clients</span>
          </div>
          <div className="font-bold text-slate-900 dark:text-white">TypeScript & Python</div>
          <p className="text-[11px] text-slate-500">Included in external-agent/ directory</p>
        </div>
      </div>

      {/* cURL Request & Response Live Test */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>cURL Command</span>
          </h3>
          <button
            onClick={() => copyToClipboard(curlSnippet, 'curl')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            {copiedKey === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'curl' ? 'Copied' : 'Copy cURL'}</span>
          </button>
        </div>

        <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono text-xs">
          <pre className="overflow-x-auto">{curlSnippet}</pre>
        </div>
      </div>

      {/* TypeScript & Python SDK Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TypeScript Client */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">TypeScript SDK</span>
            <button
              onClick={() => copyToClipboard(tsSdkSnippet, 'ts')}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              {copiedKey === 'ts' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>Copy</span>
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-950 text-slate-100 p-3.5 font-mono text-[11px]">
            <pre className="overflow-x-auto max-h-56">{tsSdkSnippet}</pre>
          </div>
        </div>

        {/* Python Client */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">Python 3 SDK</span>
            <button
              onClick={() => copyToClipboard(pythonSnippet, 'py')}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              {copiedKey === 'py' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>Copy</span>
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-950 text-slate-100 p-3.5 font-mono text-[11px]">
            <pre className="overflow-x-auto max-h-56">{pythonSnippet}</pre>
          </div>
        </div>
      </div>

      {/* Live API Tester */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">Interactive API Test Sandbox</span>
          <button
            onClick={runLiveTest}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-teal-600 hover:bg-teal-500 transition-colors shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isTesting ? 'Sending Request...' : 'Trigger Live Test'}</span>
          </button>
        </div>

        {testResponse && (
          <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-950 text-emerald-400 p-3.5 font-mono text-[11px]">
            <pre className="overflow-x-auto">{testResponse}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
