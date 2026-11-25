"use client";

import { useCallback, useEffect, useState } from "react";
import {  LoaderCircle } from "lucide-react";
import { CmsPanelDashboard, type CmsPanelSection } from "@/features/cms-panel/CmsPanelDashboard/CmsPanelDashboard";
import { LoginForm } from "@/features/cms-panel/LoginForm/LoginForm";
import type { InboxSummary } from "@/features/cms-panel/MessageInbox/MessageInbox";
import { apiJson, apiRequest } from "@/lib/api";
import { isPortfolioContent } from "@/lib/validations";
import type { PortfolioContent } from "@/types";

import "./CmsPanelShell.css";

export function CmsPanelShell() {
  const [setupRequired, setSetupRequired] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [savedContent, setSavedContent] = useState<PortfolioContent | null>(null);
  const [activeSection, setActiveSection] = useState<CmsPanelSection>("overview");
  const [inboxSummary, setInboxSummary] = useState<InboxSummary>({ unreadCount: 0, emailNotificationsEnabled: false });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sessionWarning, setSessionWarning] = useState(false);

  const load = useCallback(async () => {
    try {
      const status = await apiJson<{
        setupRequired: boolean;
        authenticated: boolean;
        content?: PortfolioContent;
        inboxSummary?: InboxSummary;
      }>("/api/auth/status");
      setSetupRequired(status.setupRequired);
      setAuthenticated(status.authenticated);
      if (status.authenticated && status.content && status.inboxSummary) {
        setContent(status.content);
        setSavedContent(status.content);
        setInboxSummary(status.inboxSummary);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Session expires after 8 hours. Warn 30 minutes before.
  useEffect(() => {
    if (!authenticated) return;
    const warningMs = 7.5 * 60 * 60 * 1000; // 7.5 hours
    const timer = setTimeout(() => setSessionWarning(true), warningMs);
    return () => clearTimeout(timer);
  }, [authenticated]);

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (requiresTotp) {
        await apiJson<{ authenticated: boolean }>("/api/auth/totp", {
          method: "POST",
          body: JSON.stringify({ action: "verify-login", code: totpCode })
        });
        setRequiresTotp(false);
        setTotpCode("");
      } else {
        const result = await apiJson<{ authenticated: boolean; requiresTotp?: boolean }>(setupRequired ? "/api/auth/setup" : "/api/auth/login", {
          method: "POST",
          body: JSON.stringify(setupRequired ? { code: accessCode, setupToken } : { code: accessCode })
        });
        if (result.requiresTotp) {
          setAccessCode("");
          setRequiresTotp(true);
          return;
        }
      }
      setAuthenticated(true);
      setSetupRequired(false);
      setSetupToken("");
      const [content, summary] = await Promise.all([
        apiJson<PortfolioContent>("/api/portfolio"),
        apiJson<InboxSummary>("/api/messages?summary=1")
      ]);
      setContent(content);
      setSavedContent(content);
      setInboxSummary(summary);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!isPortfolioContent(content)) throw new Error("Portfolio data is invalid or missing required sections.");
      await apiJson<{ saved: boolean }>("/api/portfolio", { method: "PUT", body: JSON.stringify({ content }) });
      setSavedContent(content);
      setMessage("Portfolio saved. Your public site is up to date.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save portfolio changes.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      setAuthenticated(false);
      setAccessCode("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      {loading ? <div className="admin-loading"><LoaderCircle className="spin" /> Loading your dashboard…</div> : authenticated && content ? (
        <>
          {sessionWarning && (
            <div className="session-warning" role="alert">
              Your session expires in 30 minutes. Save your work.
              <button onClick={() => setSessionWarning(false)}>Dismiss</button>
            </div>
          )}
          <CmsPanelDashboard
          content={content}
          savedContent={savedContent}
          inboxSummary={inboxSummary}
          busy={busy}
          error={error}
          message={message}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onSave={() => void save()}
          onDiscard={() => {
            setContent(savedContent);
            setError("");
            setMessage("");
          }}
          onContentChange={(nextContent) => {
            setContent(nextContent);
            setError("");
            setMessage("");
          }}
          onInboxSummaryChange={setInboxSummary}
          onLogout={() => void logout()}
        />
        </>
      ) : authenticated ? (
        <div className="admin-loading" role="alert">{error || "Portfolio content could not be loaded."}</div>
      ) : (
        <LoginForm
          setupRequired={setupRequired}
          requiresTotp={requiresTotp}
          accessCode={accessCode}
          setupToken={setupToken}
          totpCode={totpCode}
          busy={busy}
          error={error}
          onAccessCodeChange={setAccessCode}
          onSetupTokenChange={setSetupToken}
          onTotpCodeChange={setTotpCode}
          onCancelTotp={() => {
            setRequiresTotp(false);
            setTotpCode("");
            setError("");
          }}
          onSubmit={(event) => void submitAuth(event)}
        />
      )}
    </div>
  );
}
