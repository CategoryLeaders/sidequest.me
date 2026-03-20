/* ── Notification helpers — comment, reply, resolution emails ── [SQ.S-W-2603-0069] */

import { createServiceClient } from "@/lib/supabase/service";
import { sendNotificationEmail } from "@/lib/digest/email";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sidequest.me";

// ─── Queue a comment notification for the post author ───────────────────────

export async function queueCommentNotification(
  postId: string,
  commentId: string,
  commenterName: string,
  commentBody: string
) {
  const supabase = createServiceClient();

  // Get post + author info
  const { data: post } = await supabase
    .from("microblog_posts")
    .select("profile_id, short_id, body")
    .eq("id", postId)
    .single();

  if (!post) return;

  // Queue as a job (batched by frequency setting)
  await supabase.from("job_queue").insert({
    job_type: "send_comment_notification",
    payload: {
      profile_id: post.profile_id,
      post_id: postId,
      post_short_id: post.short_id,
      post_body: ((post.body as string) ?? "").slice(0, 80),
      comment_id: commentId,
      commenter_name: commenterName,
      comment_body: commentBody,
    },
    status: "pending",
    run_at: new Date().toISOString(), // processed by batch worker based on frequency
  });
}

// ─── Queue a reply notification for the commenter ───────────────────────────

export async function queueReplyNotification(
  postId: string,
  parentCommentId: string,
  replyBody: string,
  authorProfileId: string
) {
  const supabase = createServiceClient();

  // Get parent comment + commenter email
  const { data: parentComment } = await supabase
    .from("microblog_comments")
    .select("user_id")
    .eq("id", parentCommentId)
    .single();

  if (!parentComment?.user_id) return; // anonymous import — can't notify

  // Check opt-out
  const { data: optout } = await supabase
    .from("commenter_notification_optouts")
    .select("user_id")
    .eq("user_id", parentComment.user_id as string)
    .eq("profile_id", authorProfileId)
    .single();

  if (optout) return; // opted out

  // Get commenter email from mini_profiles
  const { data: commenter } = await supabase
    .from("mini_profiles")
    .select("email, display_name")
    .eq("id", parentComment.user_id as string)
    .single();

  if (!commenter?.email) return;

  // Get post info for link
  const { data: post } = await supabase
    .from("microblog_posts")
    .select("short_id, profile_id")
    .eq("id", postId)
    .single();

  // Get author profile for username
  const { data: authorProfile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", authorProfileId)
    .single();

  if (!post || !authorProfile) return;

  const postUrl = `${BASE_URL}/${authorProfile.username}/thoughts/${post.short_id}`;
  const optoutUrl = `${BASE_URL}/api/notifications/optout?user_id=${parentComment.user_id}&profile_id=${authorProfileId}`;

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <p style="font-size: 14px; line-height: 1.6; color: #333;">
        <strong>${authorProfile.display_name ?? authorProfile.username}</strong> replied to your comment:
      </p>
      <div style="border-left: 3px solid #e8590c; padding: 8px 16px; margin: 16px 0; font-size: 14px; color: #555;">
        ${replyBody}
      </div>
      <a href="${postUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-size: 13px; font-weight: 700;">
        View conversation
      </a>
      <p style="font-size: 11px; color: #999; margin-top: 24px;">
        <a href="${optoutUrl}" style="color: #999;">Stop notifications from this author</a> ·
        <a href="${BASE_URL}/privacy" style="color: #999;">Privacy Policy</a>
      </p>
    </div>
  `;

  await sendNotificationEmail({
    to: commenter.email as string,
    subject: `${authorProfile.display_name ?? authorProfile.username} replied to your comment`,
    html,
  });
}

// ─── Send question resolution notification to all commenters ────────────────

export async function sendResolutionNotifications(
  questionId: string,
  profileId: string,
  resolvedSummary: string | null
) {
  const supabase = createServiceClient();

  // Get question info
  const { data: question } = await supabase
    .from("questions")
    .select("short_id, question_text")
    .eq("id", questionId)
    .single();

  // Get author profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", profileId)
    .single();

  if (!question || !profile) return;

  // Get all commenters on this question's microblog comments (if comments exist)
  // Questions share the microblog_comments table via post_id
  const { data: comments } = await supabase
    .from("microblog_comments")
    .select("user_id")
    .eq("post_id", questionId)
    .eq("status", "visible")
    .not("user_id", "is", null);

  if (!comments || comments.length === 0) return;

  // Unique commenter IDs
  const userIds = [...new Set(comments.map((c) => c.user_id as string))];

  // Get their emails
  const { data: commenterProfiles } = await supabase
    .from("mini_profiles")
    .select("id, email, display_name")
    .in("id", userIds);

  const postUrl = `${BASE_URL}/${profile.username}/thoughts/${question.short_id}`;

  for (const cp of commenterProfiles ?? []) {
    // Skip the author themselves
    if ((cp.id as string) === profileId) continue;

    // Check opt-out
    const { data: optout } = await supabase
      .from("commenter_notification_optouts")
      .select("user_id")
      .eq("user_id", cp.id as string)
      .eq("profile_id", profileId)
      .single();
    if (optout) continue;

    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <p style="font-size: 14px; line-height: 1.6; color: #333;">
          A question you commented on has been resolved:
        </p>
        <div style="border: 2px solid #000; padding: 16px; margin: 16px 0;">
          <div style="font-weight: 700; font-size: 15px; margin-bottom: 8px;">
            ${question.question_text}
          </div>
          ${resolvedSummary ? `<div style="font-size: 13px; color: #555; border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px;"><strong>Resolution:</strong> ${resolvedSummary}</div>` : ""}
        </div>
        <a href="${postUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-size: 13px; font-weight: 700;">
          View question
        </a>
        <p style="font-size: 11px; color: #999; margin-top: 24px;">
          <a href="${BASE_URL}/privacy" style="color: #999;">Privacy Policy</a>
        </p>
      </div>
    `;

    try {
      await sendNotificationEmail({
        to: cp.email as string,
        subject: `Question resolved: "${((question.question_text as string) ?? "").slice(0, 50)}..."`,
        html,
      });
    } catch (err) {
      console.error(`[notification] Failed to send resolution to ${cp.email}:`, err);
    }
  }
}

// ─── Batch comment notification processor ───────────────────────────────────

export async function processCommentNotificationBatch(profileId: string) {
  const supabase = createServiceClient();

  // Get notification settings
  const { data: settings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (!settings || (settings.comment_frequency as string) === "off") return;

  // Get pending comment notification jobs
  const { data: jobs } = await supabase
    .from("job_queue")
    .select("id, payload")
    .eq("job_type", "send_comment_notification")
    .eq("status", "pending")
    .filter("payload->profile_id", "eq", profileId)
    .order("created_at", { ascending: true });

  if (!jobs || jobs.length === 0) return;

  // Get author email
  const { data: author } = await supabase
    .from("mini_profiles")
    .select("email, display_name")
    .eq("id", profileId)
    .single();

  if (!author?.email) return;

  // Get author's profile for username
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .single();

  // Build batched email
  const commentsHtml = jobs
    .map((job) => {
      const p = job.payload as Record<string, string>;
      const postUrl = `${BASE_URL}/${profile?.username}/thoughts/${p.post_short_id}`;
      return `
        <div style="border-bottom: 1px solid #eee; padding: 12px 0;">
          <div style="font-size: 12px; color: #999; margin-bottom: 4px;">
            On: "${(p.post_body ?? "").slice(0, 60)}..."
          </div>
          <div style="font-size: 14px; color: #333;">
            <strong>${p.commenter_name}</strong>: ${p.comment_body}
          </div>
          <a href="${postUrl}" style="font-size: 12px; color: #e8590c;">View →</a>
        </div>
      `;
    })
    .join("");

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">
        ${jobs.length} new comment${jobs.length > 1 ? "s" : ""}
      </h2>
      ${commentsHtml}
      <p style="font-size: 11px; color: #999; margin-top: 24px;">
        <a href="${BASE_URL}/${profile?.username}/settings" style="color: #999;">Notification settings</a> ·
        <a href="${BASE_URL}/privacy" style="color: #999;">Privacy Policy</a>
      </p>
    </div>
  `;

  try {
    await sendNotificationEmail({
      to: author.email as string,
      subject: `${jobs.length} new comment${jobs.length > 1 ? "s" : ""} on your posts`,
      html,
    });

    // Mark jobs as completed
    const jobIds = jobs.map((j) => j.id);
    await supabase
      .from("job_queue")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .in("id", jobIds);
  } catch (err) {
    console.error("[notification] Failed to send comment batch:", err);
  }
}
