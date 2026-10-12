import React, { useState } from 'react';
import { Terminal, X, Copy, Check, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth, DiagnosticLogEntry } from '../context/AuthContext';
import { SUPABASE_URL } from '../lib/supabase';

interface AuthDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthDiagnosticsModal: React.FC<AuthDiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const { user, diagnosticLogs, clearDiagnosticLogs } = useAuth();
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'success'>('all');

  if (!isOpen) return null;

  const filteredLogs = diagnosticLogs.filter(log => {
    if (filter === 'error') return log.status === 'error' || Boolean(log.error);
    if (filter === 'success') return log.status === 'success';
    return true;
  });

  const handleCopy = () => {
    const text = JSON.stringify({
      supabaseUrl: SUPABASE_URL,
      currentUser: user,
      logs: diagnosticLogs,
    }, null, 2);

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn text-xs">
        
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">System Authentication &amp; Cloud Diagnostics</h3>
              <p className="text-[11px] text-slate-400">Live inspection of authentication flow, sessions, and status</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer font-medium"
              title="Copy JSON Diagnostics"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cloud Status Banner */}
        <div className="p-3 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Cloud API Endpoint:</span>
            <span className="font-mono text-blue-400 font-semibold">{SUPABASE_URL}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Active User:</span>
            <span className="font-semibold text-white">{user ? user.email : 'None (Unauthenticated)'}</span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded-md font-medium cursor-pointer ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              All ({diagnosticLogs.length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2 py-1 rounded-md font-medium cursor-pointer ${filter === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Errors ({diagnosticLogs.filter(l => l.status === 'error' || l.error).length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-2 py-1 rounded-md font-medium cursor-pointer ${filter === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Success ({diagnosticLogs.filter(l => l.status === 'success').length})
            </button>
          </div>

          <button
            onClick={clearDiagnosticLogs}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        {/* Logs Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-[11px]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No diagnostic entries recorded yet.</p>
              <p className="text-[10px] mt-1 text-slate-600">Events will stream here in real time as you sign in or register.</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl border ${
                  log.status === 'error'
                    ? 'bg-red-950/30 border-red-800/50 text-red-200'
                    : log.status === 'success'
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                    : log.status === 'warning'
                    ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800/50">
                  <div className="flex items-center gap-1.5">
                    {log.status === 'error' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    ) : log.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : log.status === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                    <span className="font-bold text-white">{log.stage}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {log.details && (
                  <pre className="mt-2 text-[10px] p-2 bg-slate-950/90 rounded-lg overflow-x-auto text-slate-300 border border-slate-800/60">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}

                {log.error && (
                  <div className="mt-2 p-2 bg-red-950/60 border border-red-800/60 rounded-lg text-red-300 text-[10px]">
                    <span className="font-bold block text-red-400">Error Payload:</span>
                    <pre className="overflow-x-auto mt-1">{JSON.stringify(log.error, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Logs are continuously mirrored to the browser developer console (F12).</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
