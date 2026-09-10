import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, Code, ExternalLink, ShieldCheck } from 'lucide-react';
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
-d '{
  "action_id": "a_external_${Date.now().toString().slice(-4)}",
  "session_id": "sess_external_agent",
  "principal_id": "user_42",
  "resource_type": "database",
  "operation": "delete_table",
  "scope_required": "db.write",
  "target": "orders_prod",
  "metadata": {
    "row_count_estimate": 500000
  }
}'`;

  const pythonSnippet = `import requests

url = "http://localhost:3001/api/actions"
payload = {
    "session_id": "sess_langchain_agent",
    "principal_id": "user_42",
    "resource_type": "database",
    "operation": "delete_table",
    "scope_required": "db.write",
    "target": "orders_prod",
    "metadata": {"row_count_estimate": 500000}
}

response = requests.post(url, json=payload)
decision = response.json()

print(f"Decision: {decision['decision']}")
print(f"Drift Score: {decision['drift_score']}")
print(f"Reason: {decision['reason']}")`;

  const tsSnippet = `import axios from 'axios';

async function executeAgentTool(toolCall) {
  // Intercept tool call before execution
  const { data: sentinelDecision } = await axios.post('http://localhost:3001/api/actions', {
    session_id: 'sess_autogen_01',
    principal_id: 'admin_migration_01',
    resource_type: toolCall.resourceType,
    operation: toolCall.operation,
    scope_required: toolCall.scope,
    target: toolCall.target,
  });

  if (sentinelDecision.decision === 'BLOCK') {
    throw new Error(\`Sentinel Intercepted Action: \${sentinelDecision.reason}\`);
  }

  if (sentinelDecision.decision === 'CONFIRM') {
    return { status: 'PENDING_HUMAN_APPROVAL', decisionId: sentinelDecision.action_id };
  }

  // Execute actual tool when ALLOWED
  return await dispatchToDatabase(toolCall);
}`;

  const runLiveTest = async () => {
    setIsTesting(true);
    try {
      const res = await api.submitAction({
        session_id: 'sess_live_curl_test',
        principal_id: 'user_42',
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
    <div className="cyber-panel rounded-2xl p-6 border border-slate-700 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>EXTERNAL AGENT INTEGRATION API</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Integrate LangChain, AutoGen, CrewAI, or autonomous bots via deterministic HTTP middleware
          </p>
        </div>

        <button
          onClick={runLiveTest}
          disabled={isTesting}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-all shadow-md disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isTesting ? 'Sending...' : 'Test cURL Payload Live'}</span>
        </button>
      </div>

      {/* Live Test Response Output */}
      {testResponse && (
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/50 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-cyan-300 font-bold">
            <span>LIVE API RESPONSE (POST /api/actions)</span>
            <button onClick={() => setTestResponse(null)} className="text-slate-500 hover:text-white">✕</button>
          </div>
          <pre className="text-emerald-300 text-[11px] overflow-x-auto whitespace-pre-wrap">{testResponse}</pre>
        </div>
      )}

      {/* Code Snippets */}
      <div className="space-y-4 text-xs font-mono">
        
        {/* cURL */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
              <Code className="w-4 h-4 text-cyan-400" /> cURL Command
            </span>
            <button
              onClick={() => copyToClipboard(curlSnippet, 'curl')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700 text-[11px]"
            >
              {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'curl' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="text-slate-300 text-[11px] overflow-x-auto p-2 rounded bg-black/40 border border-slate-900 leading-relaxed">
            {curlSnippet}
          </pre>
        </div>

        {/* Python */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-indigo-300 font-bold flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-400" /> Python (LangChain / Agent Hook)
            </span>
            <button
              onClick={() => copyToClipboard(pythonSnippet, 'python')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700 text-[11px]"
            >
              {copiedKey === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'python' ? 'Copied' : 'Copy Python'}</span>
            </button>
          </div>
          <pre className="text-slate-300 text-[11px] overflow-x-auto p-2 rounded bg-black/40 border border-slate-900 leading-relaxed">
            {pythonSnippet}
          </pre>
        </div>

        {/* TypeScript */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-teal-300 font-bold flex items-center gap-1.5">
              <Code className="w-4 h-4 text-teal-400" /> Node.js / TypeScript Middleware Wrapper
            </span>
            <button
              onClick={() => copyToClipboard(tsSnippet, 'ts')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700 text-[11px]"
            >
              {copiedKey === 'ts' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'ts' ? 'Copied' : 'Copy TypeScript'}</span>
            </button>
          </div>
          <pre className="text-slate-300 text-[11px] overflow-x-auto p-2 rounded bg-black/40 border border-slate-900 leading-relaxed">
            {tsSnippet}
          </pre>
        </div>

      </div>
    </div>
  );
};
