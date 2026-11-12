import { useEffect, useState } from "react";
import {
  X,
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  ChevronRight,
  ArrowLeft,
  Paperclip,
  CheckCircle2,
} from "lucide-react";

import { helpArticles } from "./helpArticles";
import { supportApi } from "../services/api";

import { SUPPORT_EMAIL } from "../config/constants";

export default function HelpSupportModal({ isOpen, onClose }) {
  const [view, setView] = useState("menu");
  // "menu" | "helpCenter" | "contactSupport" | "emailSupport"

  const [query, setQuery] = useState("");

  // Contact Support form state
  const [issueType, setIssueType] = useState("Technical Issue");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Low");
  const [screenshotName, setScreenshotName] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    if (!emailCopied) return;
    const timeout = setTimeout(() => setEmailCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [emailCopied]);

  if (!isOpen) return null;

  function resetContactForm() {
    setIssueType("Technical Issue");
    setSubject("");
    setPriority("Low");
    setScreenshotName("");
    setScreenshotFile(null);
    setSubmitError("");
    setSubmitting(false);
    setSubmitted(false);
  }

  function handleClose() {
    setView("menu");
    setQuery("");
    resetContactForm();
    onClose();
  }

  function handleBack() {
    setView("menu");
    setQuery("");
    resetContactForm();
  }

  function handleSearchChange(e) {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length > 0 && view !== "helpCenter") {
      setView("helpCenter");
    }
  }

  function handleScreenshotChange(e) {
    const file = e.target.files?.[0];

    setScreenshotFile(file || null);
    setScreenshotName(file ? file.name : "");
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();

    setSubmitError("");
    setSubmitting(true);

    try {
      await supportApi.createTicket({
        issueType,
        subject,
        priority,
        screenshot: screenshotFile,
      });

      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.detail ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setEmailCopied(true);
    } catch {
      setEmailCopied(false);
    }
  }

  const filteredArticles = helpArticles.filter((article) => {
    const q = query.trim().toLowerCase();

    if (!q) return true;

    return (
      article.question.toLowerCase().includes(q) ||
      article.answer.toLowerCase().includes(q) ||
      article.category.toLowerCase().includes(q)
    );
  });

  const groupedArticles = filteredArticles.reduce((groups, article) => {
    if (!groups[article.category]) {
      groups[article.category] = [];
    }

    groups[article.category].push(article);

    return groups;
  }, {});

  const titles = {
    menu: "Help & Support",
    helpCenter: "Help Center",
    contactSupport: "Contact Support",
    emailSupport: "Email Support",
  };

  const subtitles = {
    menu: "Find answers or get help with AssistEdge",
    helpCenter: "Browse guides and frequently asked questions",
    contactSupport: "Submit a request to our support team",
    emailSupport: "Reach us directly by email",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center
                 bg-slate-900/40 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">

          <div>
            {view !== "menu" ? (
              <button
                onClick={handleBack}
                className="mb-1 flex items-center gap-1 text-sm
                           font-medium text-indigo-600 hover:text-indigo-700"
              >
                <ArrowLeft size={15} />
                Back
              </button>
            ) : null}

            <h2 className="text-xl font-bold text-gray-900">
              {titles[view]}
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              {subtitles[view]}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center
                       rounded-xl text-gray-400 hover:bg-gray-100"
          >
            <X size={20} />
          </button>

        </div>

        {/* CONTENT */}
        <div className="max-h-[70vh] overflow-y-auto bg-[#f8f9ff] p-7">

          {/* SEARCH */}
          {(view === "menu" || view === "helpCenter") && (
            <div className="relative">

              <Search
                size={18}
                className="absolute left-4 top-1/2
                           -translate-y-1/2 text-gray-400"
              />

              <input
                value={query}
                onChange={handleSearchChange}
                placeholder="Search for help..."
                className="w-full rounded-xl border border-gray-200
                           bg-white py-3 pl-11 pr-4 text-sm
                           outline-none focus:border-indigo-500"
              />

            </div>
          )}

          {/* MAIN MENU */}
          {view === "menu" && (
            <div className="mt-5 space-y-3">

              {/* HELP CENTER */}
              <button
                onClick={() => setView("helpCenter")}
                className="flex w-full items-center gap-4 rounded-2xl
                           border border-gray-100 bg-white p-4
                           text-left hover:border-indigo-100
                           hover:bg-indigo-50/40"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center
                             rounded-xl bg-indigo-50 text-indigo-600"
                >
                  <BookOpen size={18} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    Help Center
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Browse guides and frequently asked questions
                  </p>
                </div>

                <ChevronRight size={17} className="text-gray-400" />
              </button>

              {/* CONTACT SUPPORT */}
              <button
                onClick={() => setView("contactSupport")}
                className="flex w-full items-center gap-4 rounded-2xl
                           border border-gray-100 bg-white p-4
                           text-left hover:border-indigo-100
                           hover:bg-indigo-50/40"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center
                             rounded-xl bg-purple-50 text-purple-600"
                >
                  <MessageCircle size={18} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    Contact Support
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Talk to our support team
                  </p>
                </div>

                <ChevronRight size={17} className="text-gray-400" />
              </button>

              {/* EMAIL SUPPORT */}
              <button
                onClick={() => setView("emailSupport")}
                className="flex w-full items-center gap-4 rounded-2xl
                           border border-gray-100 bg-white p-4
                           text-left hover:border-indigo-100
                           hover:bg-indigo-50/40"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center
                             rounded-xl bg-blue-50 text-blue-600"
                >
                  <Mail size={18} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    Email Support
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Send us your question by email
                  </p>
                </div>

                <ChevronRight size={17} className="text-gray-400" />
              </button>

            </div>
          )}

          {/* HELP CENTER */}
          {view === "helpCenter" && (
            <div className="mt-5 space-y-6">

              {Object.keys(groupedArticles).length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  No results for &quot;{query}&quot;
                </p>
              ) : (
                Object.entries(groupedArticles).map(
                  ([category, articles]) => (
                    <div key={category}>

                      <h3
                        className="mb-2 text-xs font-semibold uppercase
                                   tracking-wide text-gray-400"
                      >
                        {category}
                      </h3>

                      <div className="space-y-2">
                        {articles.map((article) => (
                          <div
                            key={article.id}
                            className="rounded-2xl border border-gray-100
                                       bg-white p-4"
                          >
                            <p className="text-sm font-semibold text-gray-800">
                              {article.question}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {article.answer}
                            </p>
                          </div>
                        ))}
                      </div>

                    </div>
                  )
                )
              )}

            </div>
          )}

          {/* CONTACT SUPPORT */}
          {view === "contactSupport" && (
            submitted ? (
              <div
                className="mt-5 flex flex-col items-center rounded-2xl
                           border border-gray-100 bg-white px-6 py-10 text-center"
              >
                <CheckCircle2 size={36} className="text-green-500" />

                <p className="mt-3 text-sm font-semibold text-gray-800">
                  Support request submitted
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Your request has been recorded. Our support team will review
                  it.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitRequest}
                className="mt-5 space-y-4 rounded-2xl border
                           border-gray-100 bg-white p-5"
              >

                {/* ISSUE TYPE */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Issue Type
                  </label>

                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200
                               px-3 py-2 text-sm outline-none
                               focus:border-indigo-500"
                  >
                    <option>Technical Issue</option>
                    <option>Coaching Session Issue</option>
                    <option>Knowledge Base Issue</option>
                    <option>Account Issue</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* SUBJECT */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Subject
                  </label>

                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Describe your issue"
                    required
                    className="w-full rounded-lg border border-gray-200
                               px-3 py-2 text-sm outline-none
                               focus:border-indigo-500"
                  />
                </div>

                {/* PRIORITY */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-gray-200
                               px-3 py-2 text-sm outline-none
                               focus:border-indigo-500"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                {/* SCREENSHOT */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Attach screenshot (optional)
                  </label>

                  <label
                    className="flex cursor-pointer items-center gap-2
                               rounded-lg border border-dashed border-gray-300
                               px-3 py-2 text-sm text-gray-500
                               hover:border-indigo-400"
                  >
                    <Paperclip size={15} />

                    {screenshotName || "Choose a file"}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* ERROR */}
                {submitError && (
                  <p className="text-xs text-red-500">
                    {submitError}
                  </p>
                )}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-indigo-600 py-2.5
                             text-sm font-semibold text-white
                             hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>

              </form>
            )
          )}

          {/* EMAIL SUPPORT */}
          {view === "emailSupport" && (
            <div
              className="mt-5 space-y-4 rounded-2xl border
                         border-gray-100 bg-white p-5"
            >

              <p className="text-sm text-gray-600">
                Need help with something specific? Send us an email and
                include details about the issue you&apos;re experiencing.
              </p>

              <div>
                <p
                  className="text-xs font-semibold uppercase
                             tracking-wide text-gray-400"
                >
                  Support Email
                </p>

                <p className="mt-1 text-sm font-medium text-indigo-600">
                  {SUPPORT_EMAIL}
                </p>
              </div>

              <div>
                <p
                  className="text-xs font-semibold uppercase
                             tracking-wide text-gray-400"
                >
                  Recommended information to include
                </p>

                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-gray-500">
                  <li>Your issue</li>
                  <li>Coaching mode you were using</li>
                  <li>Session/report involved</li>
                  <li>Screenshot or error message, if applicable</li>
                </ul>
              </div>

              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=AssistEdge%20Support`}
                className="w-full rounded-xl bg-indigo-600 py-2.5
                           text-sm font-semibold text-white
                           hover:bg-indigo-700"
                style={{ display: "block", textAlign: "center" }}
              >
                Open Email
              </a>

              <div className="flex items-center justify-center gap-4 text-xs text-indigo-600">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=AssistEdge%20Support`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Open in Gmail
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="hover:underline"
                  aria-live="polite"
                >
                  {emailCopied ? "Copied!" : "Copy email address"}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
