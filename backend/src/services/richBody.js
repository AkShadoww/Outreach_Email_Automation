// Renders the markdown-flavored template body into matching HTML and
// plain-text versions. Both are returned so the multipart/alternative
// email carries equivalent content for clients that prefer one or the
// other.
//
// Supported shorthand:
//   [text](https://example.com)   -> clickable link in HTML;
//                                    "text (https://example.com)" in plain text.
//   {{grey}}some text{{/grey}}    -> grey <span> in HTML;
//                                    passthrough (no markers) in plain text.
//
// URLs must start with http://, https://, or mailto:. Anything else is
// left as literal text so we never emit javascript: hrefs.

const URL_RE = /^(https?:\/\/|mailto:)/i;
const LINK_RE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const GREY_RE = /\{\{grey\}\}([\s\S]*?)\{\{\/grey\}\}/g;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toHtml(raw) {
  // Escape first so user text can't inject HTML; the markdown markers
  // ([](), {{grey}}) survive escaping because they're plain ASCII.
  let s = escapeHtml(raw);

  s = s.replace(LINK_RE, (match, label, url) => {
    if (!URL_RE.test(url)) return match;
    return `<a href="${url}" style="color:#2563eb;text-decoration:underline;">${label}</a>`;
  });

  s = s.replace(GREY_RE, (_match, inner) =>
    `<span style="color:#666666;">${inner}</span>`,
  );

  return s.replace(/\n/g, '<br/>');
}

function toText(raw) {
  let s = raw;
  s = s.replace(LINK_RE, (match, label, url) => {
    if (!URL_RE.test(url)) return match;
    return `${label} (${url})`;
  });
  s = s.replace(GREY_RE, (_match, inner) => inner);
  return s;
}

function renderRichBody(body) {
  const raw = String(body == null ? '' : body);
  return { html: toHtml(raw), text: toText(raw) };
}

module.exports = { renderRichBody };
