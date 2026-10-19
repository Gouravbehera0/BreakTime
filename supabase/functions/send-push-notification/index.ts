// Supabase Edge Function: send-push-notification
// Implements secure server-side Web Push delivery for BreakTym
// Uses npm:web-push in Deno Edge Runtime with VAPID authentication

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PushRequestBody {
  type: 'new_invitation' | 'invitation_accepted';
  invitation_id: string;
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Validate environment secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@breaktym.app';

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[BreakTym Push] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Supabase credentials missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[BreakTym Push] Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY secrets.');
      return new Response(
        JSON.stringify({
          error: 'VAPID keys not configured in Supabase secrets.',
          instructions: 'Run: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=...',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configure web-push with VAPID details
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // 3. Initialize Privileged Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 4. Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    let callerUserId: string | null = null;
    let isServiceRoleCaller = false;

    // Check if caller is service_role or regular authenticated user
    if (token === serviceRoleKey) {
      isServiceRoleCaller = true;
    } else {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid authentication session.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      callerUserId = user.id;
    }

    // 5. Parse and validate request body
    const body: PushRequestBody = await req.json().catch(() => ({}) as PushRequestBody);
    const { type, invitation_id } = body;

    if (!type || !invitation_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: type, invitation_id.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type !== 'new_invitation' && type !== 'invitation_accepted') {
      return new Response(
        JSON.stringify({ error: `Unsupported push notification type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Fetch invitation from DB — NEVER trust client-provided sender/recipient IDs
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('activity_invitations')
      .select('*')
      .eq('id', invitation_id)
      .single();

    if (invError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found in database.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetRecipientId: string;
    let notificationTitle: string;
    let notificationBody: string;
    let notificationTag: string;

    if (type === 'new_invitation') {
      // Authorization: caller must be the sender who created the invitation
      if (!isServiceRoleCaller && callerUserId !== invitation.sender_id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: You are not the sender of this invitation.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Must be in pending or sent status
      if (invitation.status !== 'pending' && invitation.status !== 'sent') {
        return new Response(
          JSON.stringify({ error: `Cannot send push for invitation in status "${invitation.status}".` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetRecipientId = invitation.recipient_id;

      // Fetch sender's display name
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('display_name')
        .eq('id', invitation.sender_id)
        .single();

      const senderName = senderProfile?.display_name || 'A friend';
      const activityTitle = invitation.activity_title || 'Break';

      notificationTitle = 'New Plan on BreakTym ☕';
      notificationBody = `${senderName} invited you to ${activityTitle}!`;
      notificationTag = `invite-${invitation.id}`;
    } else {
      // type === 'invitation_accepted'
      // Authorization: caller must be the recipient who accepted
      if (!isServiceRoleCaller && callerUserId !== invitation.recipient_id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Only the recipient can trigger acceptance notifications.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verification: invitation must genuinely be in accepted status
      if (invitation.status !== 'accepted') {
        return new Response(
          JSON.stringify({ error: 'Invitation is not accepted in database.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // CRITICAL: Notify the ORIGINAL SENDER, not the accepting recipient!
      targetRecipientId = invitation.sender_id;

      // Fetch recipient's display name
      const { data: recipientProfile } = await supabaseAdmin
        .from('profiles')
        .select('display_name')
        .eq('id', invitation.recipient_id)
        .single();

      const recipientName = recipientProfile?.display_name || 'Your friend';
      const activityTitle = invitation.activity_title || 'Break';

      notificationTitle = "It's a Plan! 💜";
      notificationBody = `${recipientName} accepted your ${activityTitle} invitation!`;
      notificationTag = `invite-accepted-${invitation.id}`;
    }

    // 7. Fetch active push subscriptions for target recipient
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', targetRecipientId)
      .is('disabled_at', null);

    if (subError) {
      console.error('[BreakTym Push] Error fetching subscriptions:', subError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to query push subscriptions.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[BreakTym Push] No active push subscriptions found for user ${targetRecipientId}.`);
      return new Response(
        JSON.stringify({
          success: true,
          delivered: 0,
          message: 'No active device subscriptions found for recipient. In-app notifications will handle delivery.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Construct standard Web Push payload
    const payload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      tag: notificationTag,
      icon: '/icon.svg',
      badge: '/icon.svg',
      timestamp: Date.now(),
      url: `/?invitation=${invitation.id}`,
      data: {
        invitationId: invitation.id,
        type,
        url: `/?invitation=${invitation.id}`,
      },
    });

    let deliveredCount = 0;
    let disabledCount = 0;

    // 9. Dispatch to all recipient's registered endpoints in parallel
    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload, {
            TTL: 86400, // 24 hours
            urgency: 'high',
          });

          deliveredCount++;

          // Update last_success_at
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ last_success_at: new Date().toISOString() })
            .eq('id', sub.id);
        } catch (pushErr: any) {
          const statusCode = pushErr?.statusCode || pushErr?.status;
          console.warn(`[BreakTym Push] Delivery error (HTTP ${statusCode}):`, pushErr?.message || pushErr);

          // If the push service returns 410 (Gone) or 404 (Not Found), the subscription has expired or was revoked
          if (statusCode === 410 || statusCode === 404) {
            disabledCount++;
            await supabaseAdmin
              .from('push_subscriptions')
              .update({ disabled_at: new Date().toISOString() })
              .eq('id', sub.id);
          }
        }
      })
    );

    console.log(
      `[BreakTym Push] Dispatched push for invitation ${invitation.id}: ${deliveredCount} delivered, ${disabledCount} deactivated.`
    );

    return new Response(
      JSON.stringify({
        success: true,
        delivered: deliveredCount,
        deactivated: disabledCount,
        title: notificationTitle,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[BreakTym Push] Unhandled edge function error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
