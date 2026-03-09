/**
 * Asana API helper for SideQuest.me feedback integration.
 * Used by /api/feedback to post comments and update tasks.
 */

const ASANA_BASE = 'https://app.asana.com/api/1.0';

function getHeaders(): HeadersInit {
  const pat = process.env.ASANA_PAT;
  if (!pat || pat === 'REPLACE_ME_WITH_YOUR_ASANA_PAT') {
    throw new Error('ASANA_PAT not configured — add it to .env.local');
  }
  return {
    'Authorization': `Bearer ${pat}`,
    'Content-Type': 'application/json',
  };
}

/** Look up a task by its SQ-XXXXX name prefix */
export async function findTaskByName(name: string): Promise<string | null> {
  const projectGid = process.env.ASANA_SIDEQUEST_PROJECT_GID;
  const res = await fetch(
    `${ASANA_BASE}/tasks?project=${projectGid}&opt_fields=name&limit=100`,
    { headers: getHeaders() }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const task = json.data?.find((t: { name: string }) =>
    t.name.startsWith(name)
  );
  return task?.gid ?? null;
}

/** Post a comment (story) on an Asana task */
export async function postComment(
  taskGid: string,
  text: string
): Promise<{ gid: string }> {
  const res = await fetch(`${ASANA_BASE}/tasks/${taskGid}/stories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data: { text } }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Asana comment failed: ${JSON.stringify(err)}`);
  }
  const json = await res.json();
  return json.data;
}

/** Update a custom field on a task (e.g. "Waiting for") */
export async function updateCustomField(
  taskGid: string,
  fieldGid: string,
  optionGid: string
): Promise<void> {
  const res = await fetch(`${ASANA_BASE}/tasks/${taskGid}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      data: { custom_fields: { [fieldGid]: optionGid } },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Asana field update failed: ${JSON.stringify(err)}`);
  }
}

/** Search for a task by GID directly */
export async function getTask(
  taskGid: string
): Promise<{ gid: string; name: string } | null> {
  const res = await fetch(
    `${ASANA_BASE}/tasks/${taskGid}?opt_fields=name,completed`,
    { headers: getHeaders() }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}