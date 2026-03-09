import { NextRequest, NextResponse } from 'next/server';
import { findTaskByName, postComment, updateCustomField } from '@/lib/asana';

/*  POST /api/feedback
 *  Body JSON:
 *  {
 *    taskRef:   "SQ-00012"          – task name prefix
 *    ratings:   { key: number }     – e.g. { "Card Design": 7, "Readability": 9 }
 *    comment:   "Free-text notes"   – optional
 *    selection: "Option B"          – for PM-spec decision pages (optional)
 *    waitingForFieldGid: "123..."   – GID of "Waiting for" custom field  (optional)
 *    waitingForOptionGid: "456..."  – GID of the option to set            (optional)
 *  }
 *
 *  The route:
 *   1. Looks up the Asana task by SQ-XXXXX prefix
 *   2. Builds a formatted comment from ratings + comment + selection
 *   3. Posts the comment as a story on the task
 *   4. Optionally flips the "Waiting for" custom field
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskRef, ratings, comment, selection,
            waitingForFieldGid, waitingForOptionGid } = body;

    if (!taskRef) {
      return NextResponse.json(
        { error: 'taskRef is required (e.g. "SQ-00012")' },
        { status: 400 }
      );
    }

    // 1. Find the task
    const taskGid = await findTaskByName(taskRef);
    if (!taskGid) {
      return NextResponse.json(
        { error: `Task starting with "${taskRef}" not found in project` },
        { status: 404 }
      );
    }

    // 2. Build comment text
    const lines: string[] = [`📋 Feedback received for ${taskRef}`];

    if (selection) {
      lines.push(`\n🎯 Selection: ${selection}`);
    }

    if (ratings && Object.keys(ratings).length > 0) {
      lines.push('\n📊 Ratings:');
      for (const [key, val] of Object.entries(ratings)) {
        const bar = '█'.repeat(Number(val)) + '░'.repeat(10 - Number(val));
        lines.push(`  ${key}: ${bar} ${val}/10`);
      }
    }

    if (comment) {
      lines.push(`\n💬 Comment:\n${comment}`);
    }

    lines.push(`\n⏰ Submitted: ${new Date().toISOString()}`);

    const fullComment = lines.join('\n');

    // 3. Post the comment
    await postComment(taskGid, fullComment);

    // 4. Optionally update the "Waiting for" field
    if (waitingForFieldGid && waitingForOptionGid) {
      await updateCustomField(taskGid, waitingForFieldGid, waitingForOptionGid);
    }

    return NextResponse.json({ ok: true, taskGid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[feedback route]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
