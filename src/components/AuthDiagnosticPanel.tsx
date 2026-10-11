import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Terminal, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth, AuthDiagnostic } from '../context/AuthContext';

interface AuthDiagnosticPanelProps {
  onNavigate?: (path: string) => void;
}

export const AuthDiagnosticPanel: React.FC<AuthDiagnosticPanelProps> = ({ onNavigate }) => {
  const { lastAuthDiagnostic, user, role, clearAuthDiagnostic } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const diag = lastAuthDiagnostic;

  const sessionStatus = diag?.supabaseSession?.status || (user ? 'SESSION_ACTIVE' : 'NO_SESSION');
  const hasError = Boolean(diag?.supabaseError);

  return (
    <div className="w-full mt-4 text-xs font-sans">
      <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 shadow-sm">
        
        {/* Summary Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-mono text-[11px] font-bold text-slate-200 truncate">
              Supabase Auth Diagnostic
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shrink-0 ${
              sessionStatus === 'ACTIVE_SESSION' || sessionStatus === 'SESSION_ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : sessionStatus === 'EMAIL_NOT_CONFIRMED'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : hasError
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-700/60 text-slate-300'
            }`}>
              {sessionStatus === 'EMAIL_NOT_CONFIRMED' ? 'Email Pending' : sessionStatus}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded cursor-pointer transition-colors"
                title="Force transition to Dashboard terminal"
              >
                Dashboard →
              </button>
            )}
            <button
              type="button"
              onClick={() => setExpanded(prev => !prev)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Toggle diagnostic telemetry details"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Telemetry Details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 font-mono text-[11px] text-slate-300">
            
            {/* Status overview */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <div>
                <span className="text-slate-500 block text-[10px]">SUPABASE ENDPOINT:</span>
                <span className="text-blue-300 truncate block">uztxsjbmugfbhgedpmpe.supabase.co</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CURRENT USER:</span>
                <span className="text-emerald-300 truncate block">
                  {user ? `${user.full_name} (${role || 'owner'})` : 'Unauthenticated'}
                </span>
              </div>
            </div>

            {/* Supabase User Object status */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/60 pb-1">
                <span>SUPABASE USER OBJECT:</span>
                <span className="text-slate-500">{diag?.timestamp ? new Date(diag.timestamp).toLocaleTimeString() : 'N/A'}</span>
              </div>
              {diag?.supabaseUser ? (
                <div className="space-y-0.5 text-[10px] text-slate-300">
                  <div><strong className="text-slate-400">User ID:</strong> {diag.supabaseUser.id || 'N/A'}</div>
                  <div><strong className="text-slate-400">Email:</strong> {diag.supabaseUser.email || 'N/A'}</div>
                  <div><strong className="text-slate-400">Role:</strong> {diag.supabaseUser.role || 'authenticated'}</div>
                  <div><strong className="text-slate-400">Confirmed At:</strong> {diag.supabaseUser.confirmed_at || 'Pending verification'}</div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">
                  {user ? `Active session established for ${user.email}` : 'No active Supabase user object returned yet.'}
                </div>
              )}
            </div>

            {/* Supabase Session Object status */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
              <div className="text-[10px] text-slate-400 border-b border-slate-800/60 pb-1">
                <span>SUPABASE SESSION OBJECT STATUS:</span>
              </div>
              <div className="space-y-0.5 text-[10px]">
                <div>
                  <strong className="text-slate-400">Session State: </strong>
                  <span className={diag?.supabaseSession?.has_token ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {diag?.supabaseSession?.status || (user ? 'ACTIVE_SESSION' : 'NULL_SESSION')}
                  </span>
                </div>
                {diag?.supabaseSession?.token_preview && (
                  <div><strong className="text-slate-400">Access Token: </strong>{diag.supabaseSession.token_preview}</div>
                )}
                {diag?.supabaseSession?.status === 'EMAIL_NOT_CONFIRMED' && (
                  <p className="text-amber-300/90 text-[10px] leading-relaxed pt-1">
                    ℹ️ Note: Supabase project settings require email confirmation before issuing a session token. Store owner account has been established with full POS capabilities.
                  </p>
                )}
              </div>
            </div>

            {/* Potential Error Object */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
              <div className="text-[10px] text-slate-400 border-b border-slate-800/60 pb-1">
                <span>SUPABASE ERROR OBJECT STATUS:</span>
              </div>
              {diag?.supabaseError ? (
                <div className="text-[10px] text-rose-300 space-y-0.5">
                  <div><strong>Error Name:</strong> {diag.supabaseError.name}</div>
                  <div><strong>Message:</strong> {diag.supabaseError.message}</div>
                  {diag.supabaseError.code && <div><strong>Code:</strong> {diag.supabaseError.code}</div>}
                  {diag.supabaseError.status && <div><strong>Status:</strong> {diag.supabaseError.status}</div>}
                </div>
              ) : (
                <div className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>null (No authentication errors returned)</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={clearAuthDiagnostic}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Clear Diagnostic Log
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  Proceed to Terminal Now →
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
