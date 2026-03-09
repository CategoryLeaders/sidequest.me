/**
 * SideQuest Feedback Widget  v1
 * ─────────────────────────────
 * Drop this into any mockup HTML page to get an interactive feedback panel
 * that posts results back to the matching Asana task.
 *
 * USAGE (in your HTML):
 *
 *   <script
 *     src="/dev/feedback-widget.js"
 *     data-task-ref="SQ-00012"
 *     data-type="ux"
 *   ></script>
 *
 * data-task-ref  – the SQ-XXXXX task ID (required)
 * data-type      – "ux" for rating sliders  |  "pm" for option selector
 *
 * For UX pages: add  data-criteria="Layout,Readability,Colour"
 *   (comma-separated rating criteria — each gets a 1-10 slider)
 *
 * For PM pages: add  data-options="Option A,Option B,Option C"
 *   (comma-separated choices — rendered as cards to pick from)
 *
 * Optional Asana field flipping:
 *   data-waiting-field-gid="12345"    – "Waiting for" field GID
 *   data-waiting-option-gid="67890"   – option GID to set after submit
 */

(function () {
  'use strict';

  /* ── Read config from script tag ── */
  const scriptTag = document.currentScript;
  const TASK_REF = scriptTag?.getAttribute('data-task-ref') || '';
  const PAGE_TYPE = scriptTag?.getAttribute('data-type') || 'ux';
  const CRITERIA = (scriptTag?.getAttribute('data-criteria') || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const OPTIONS = (scriptTag?.getAttribute('data-options') || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const FIELD_GID = scriptTag?.getAttribute('data-waiting-field-gid') || '';
  const OPTION_GID = scriptTag?.getAttribute('data-waiting-option-gid') || '';

  /* ── Styles ── */
  const STYLES = `
    .sq-fb { font-family: 'DM Sans', system-ui, sans-serif; position: fixed;
             bottom: 20px; right: 20px; z-index: 99999; }
    .sq-fb-toggle { background: #1a1a1a; color: #fffbe6; border: 3px solid #1a1a1a;
                    padding: 10px 18px; font-weight: 700; font-size: 14px;
                    cursor: pointer; font-family: inherit; }
    .sq-fb-toggle:hover { background: #ff6b35; }
    .sq-fb-panel { display: none; width: 380px; max-height: 80vh; overflow-y: auto;
                   background: #fffbe6; border: 3px solid #1a1a1a; padding: 20px;
                   margin-bottom: 10px; }
    .sq-fb-panel.open { display: block; }
    .sq-fb h3 { font-family: 'Archivo', system-ui, sans-serif; font-weight: 900;
                text-transform: uppercase; font-size: 16px; margin: 0 0 16px; }
    .sq-fb label { display: block; font-weight: 600; font-size: 13px; margin: 12px 0 4px; }
    .sq-fb input[type=range] { width: 100%; accent-color: #1a1a1a; }
    .sq-fb .sq-val { font-family: 'Space Mono', monospace; font-size: 13px; float: right; }
    .sq-fb textarea { width: 100%; min-height: 70px; border: 2px solid #1a1a1a;
                      background: #fff; padding: 8px; font-family: inherit;
                      font-size: 13px; resize: vertical; box-sizing: border-box; }
    .sq-fb button.sq-submit { background: #1a1a1a; color: #fffbe6; border: none;
                              padding: 10px 24px; font-weight: 700; font-size: 14px;
                              cursor: pointer; margin-top: 14px; width: 100%;
                              font-family: inherit; }
    .sq-fb button.sq-submit:hover { background: #ff6b35; }
    .sq-fb button.sq-submit:disabled { opacity: .5; cursor: wait; }
    .sq-fb .sq-opt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .sq-fb .sq-opt { border: 2px solid #1a1a1a; padding: 12px; cursor: pointer;
                     text-align: center; font-weight: 600; font-size: 13px;
                     transition: all .15s; }
    .sq-fb .sq-opt:hover { background: #e0e0e0; }
    .sq-fb .sq-opt.selected { background: #1a1a1a; color: #fffbe6; }
    .sq-fb .sq-status { text-align: center; padding: 10px; font-weight: 600;
                        font-size: 13px; margin-top: 10px; }
    .sq-fb .sq-status.ok { color: #16a34a; }
    .sq-fb .sq-status.err { color: #dc2626; }
    .sq-fb .sq-copy { background: none; border: 2px solid #1a1a1a; padding: 6px 14px;
                      cursor: pointer; font-size: 12px; font-weight: 600;
                      margin-top: 8px; width: 100%; font-family: inherit; }
  `;

  /* ── Build DOM ── */
  const wrapper = document.createElement('div');
  wrapper.className = 'sq-fb';

  const style = document.createElement('style');
  style.textContent = STYLES;
  wrapper.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'sq-fb-panel';

  const toggle = document.createElement('button');
  toggle.className = 'sq-fb-toggle';
  toggle.textContent = `💬 Feedback (${TASK_REF})`;
  toggle.onclick = () => panel.classList.toggle('open');

  /* ── Panel content ── */
  let html = `<h3>Feedback — ${TASK_REF}</h3>`;

  if (PAGE_TYPE === 'ux' && CRITERIA.length > 0) {
    // Rating sliders
    CRITERIA.forEach((c, i) => {
      html += `
        <label>${c} <span class="sq-val" id="sqv${i}">5</span></label>
        <input type="range" min="1" max="10" value="5" id="sqr${i}"
               oninput="document.getElementById('sqv${i}').textContent=this.value">
      `;
    });
  }

  if (PAGE_TYPE === 'pm' && OPTIONS.length > 0) {
    // Option selector cards
    html += '<label>Pick your preferred option:</label><div class="sq-opt-grid">';
    OPTIONS.forEach((o, i) => {
      html += `<div class="sq-opt" data-idx="${i}" onclick="sqSelect(this)">${o}</div>`;
    });
    html += '</div>';
  }

  html += `
    <label>Comments (optional)</label>
    <textarea id="sqComment" placeholder="Any thoughts, issues, suggestions…"></textarea>
    <button class="sq-submit" id="sqSubmit">Submit to Asana</button>
    <button class="sq-copy" id="sqCopy">📋 Copy as prompt (fallback)</button>
    <div class="sq-status" id="sqStatus"></div>
  `;

  panel.innerHTML = html;
  wrapper.appendChild(panel);
  wrapper.appendChild(toggle);
  document.body.appendChild(wrapper);

  /* ── Option selection (PM pages) ── */
  window.sqSelect = function (el) {
    panel.querySelectorAll('.sq-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
  };

  /* ── Gather payload ── */
  function gatherPayload() {
    const payload = { taskRef: TASK_REF };

    if (PAGE_TYPE === 'ux' && CRITERIA.length > 0) {
      const ratings = {};
      CRITERIA.forEach((c, i) => {
        const el = document.getElementById(`sqr${i}`);
        ratings[c] = el ? Number(el.value) : 5;
      });
      payload.ratings = ratings;
    }

    if (PAGE_TYPE === 'pm') {
      const sel = panel.querySelector('.sq-opt.selected');
      if (sel) payload.selection = sel.textContent;
    }

    const comment = document.getElementById('sqComment')?.value?.trim();
    if (comment) payload.comment = comment;

    if (FIELD_GID) payload.waitingForFieldGid = FIELD_GID;
    if (OPTION_GID) payload.waitingForOptionGid = OPTION_GID;

    return payload;
  }

  /* ── Submit to API ── */
  document.getElementById('sqSubmit').addEventListener('click', async function () {
    const btn = this;
    const status = document.getElementById('sqStatus');
    btn.disabled = true;
    status.className = 'sq-status';
    status.textContent = 'Sending…';

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gatherPayload()),
      });
      const data = await res.json();
      if (res.ok) {
        status.className = 'sq-status ok';
        status.textContent = '✓ Sent to Asana!';
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (e) {
      status.className = 'sq-status err';
      status.textContent = '✗ ' + e.message + ' — use Copy fallback';
    } finally {
      btn.disabled = false;
    }
  });

  /* ── Copy fallback (works even without API) ── */
  document.getElementById('sqCopy').addEventListener('click', function () {
    const p = gatherPayload();
    const lines = [`Feedback for ${p.taskRef}`];
    if (p.selection) lines.push(`Selection: ${p.selection}`);
    if (p.ratings) {
      lines.push('Ratings:');
      Object.entries(p.ratings).forEach(([k, v]) => lines.push(`  ${k}: ${v}/10`));
    }
    if (p.comment) lines.push(`Comment: ${p.comment}`);

    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      const status = document.getElementById('sqStatus');
      status.className = 'sq-status ok';
      status.textContent = '📋 Copied to clipboard!';
    });
  });
})();
