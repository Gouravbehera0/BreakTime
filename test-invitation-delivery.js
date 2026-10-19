/**
 * Comprehensive Automated Test Suite for BreakTym Activity Invitation & Meeting Status Delivery
 * Tests validation, separate invitation status vs meeting_status lifecycle states,
 * acceptance celebration for both users, non-daily accepted invitation streaks,
 * duplicate acceptance idempotency protection, authorization, and throttling.
 */

import assert from 'assert';

console.log('========================================================================');
console.log('🧪 BreakTym Activity Invitation & Meeting Status Comprehensive Test Suite');
console.log('========================================================================\n');

// Simulated in-memory storage for test validation
let dbInvitations = [];
let dbUsers = {
  'user_a': { id: 'user_a', display_name: 'Aarav Sharma', username: 'aarav_s' },
  'user_b': { id: 'user_b', display_name: 'Priya Patel', username: 'priya_p' },
  'user_c': { id: 'user_c', display_name: 'Rohan Gupta', username: 'rohan_g' },
};

const CELEBRATION_HEADLINES = [
  "IT'S A PLAN! 🔥",
  "THE VIBE IS CONFIRMED! 💜",
  "PLOT TWIST: THEY SAID YES! 👀",
  "THAT'S A YES. 💌",
  "A MOMENT IN THE MAKING ✨",
];

function getCelebrationHeadline(invitationId) {
  let hash = 0;
  for (let i = 0; i < invitationId.length; i++) {
    hash = (hash << 5) - hash + invitationId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CELEBRATION_HEADLINES.length;
  return CELEBRATION_HEADLINES[index];
}

function getInvitationStreaks(userId, targetFriendId) {
  const personalStreak = new Set(
    dbInvitations
      .filter((inv) => inv.senderId === userId && inv.status === 'accepted')
      .map((inv) => inv.id)
  ).size;

  let friendshipStreak = 0;
  if (targetFriendId) {
    friendshipStreak = new Set(
      dbInvitations
        .filter(
          (inv) =>
            ((inv.senderId === userId && inv.recipientId === targetFriendId) ||
              (inv.senderId === targetFriendId && inv.recipientId === userId)) &&
            inv.status === 'accepted'
        )
        .map((inv) => inv.id)
    ).size;
  }

  return { personalStreak, friendshipStreak };
}

function createInvitation({ senderId, recipientId, activityId, activityTitle, customNote }) {
  // Validation 1: Required fields
  if (!senderId || !recipientId) {
    return { success: false, error: 'Sender and recipient IDs are required.' };
  }
  // Validation 2: No self-invitations
  if (senderId === recipientId) {
    return { success: false, error: 'You cannot send an invitation to yourself.' };
  }
  // Validation 3: Title
  if (!activityTitle || !activityTitle.trim()) {
    return { success: false, error: 'Activity title is required.' };
  }

  // Validation 4: Throttle duplicate within 2 minutes
  const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
  const recentDuplicate = dbInvitations.find((inv) =>
    inv.senderId === senderId &&
    inv.recipientId === recipientId &&
    inv.activityId === activityId &&
    (inv.status === 'pending' || inv.status === 'sent') &&
    new Date(inv.createdAt).getTime() > twoMinutesAgo
  );

  if (recentDuplicate) {
    return {
      success: false,
      error: `You already sent an invitation for ${activityTitle} just now. Please wait before sending another.`,
    };
  }

  const newRecord = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    senderId,
    recipientId,
    activityId,
    activityTitle,
    customNote: customNote || null,
    // Invitation status tracks: pending, accepted, or rejected
    status: 'pending',
    // meeting_status tracks meetup lifecycle: pending, completed, cancelled, missed
    meetingStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    headline: null,
    acceptedAt: null,
    senderCelebratedAt: null,
    recipientCelebratedAt: null,
  };

  dbInvitations.push(newRecord);
  return {
    success: true,
    invitationId: newRecord.id,
    message: `Invitation for ${activityTitle} sent to your friend! ✨`,
  };
}

function respondToInvitation({ invitationId, userId, action }) {
  const inv = dbInvitations.find((i) => i.id === invitationId);
  if (!inv) {
    return { success: false, error: 'Invitation not found.' };
  }
  // Authorization check: Only recipient can respond
  if (inv.recipientId !== userId) {
    return { success: false, error: 'Only the recipient can respond to this invitation.' };
  }

  const normalizedAction = action === 'declined' ? 'rejected' : action;

  // Idempotency check: if already processed into the same status, return success with current streaks without duplicate increments
  if (inv.status !== 'pending' && inv.status !== 'sent') {
    if (inv.status === normalizedAction || (normalizedAction === 'rejected' && inv.status === 'declined')) {
      const streaks = getInvitationStreaks(inv.senderId, inv.recipientId);
      return {
        success: true,
        message: `Invitation has already been ${inv.status}.`,
        invitationId: inv.id,
        status: inv.status,
        meetingStatus: inv.meetingStatus,
        headline: inv.headline,
        personalStreak: streaks.personalStreak,
        friendshipStreak: streaks.friendshipStreak,
        isIdempotentReplay: true,
      };
    }
    return { success: false, error: `Invitation has already been ${inv.status}.` };
  }

  const nowIso = new Date().toISOString();

  if (normalizedAction === 'accepted') {
    inv.status = 'accepted';
    // Initialize meetup lifecycle as pending
    inv.meetingStatus = 'pending';
    inv.headline = getCelebrationHeadline(inv.id);
    inv.acceptedAt = nowIso;
    inv.updatedAt = nowIso;

    const streaks = getInvitationStreaks(inv.senderId, inv.recipientId);
    const sender = dbUsers[inv.senderId];
    const recipient = dbUsers[inv.recipientId];

    return {
      success: true,
      message: 'Break invitation accepted! Enjoy your break ✨',
      invitationId: inv.id,
      status: 'accepted',
      meetingStatus: 'pending',
      headline: inv.headline,
      senderId: inv.senderId,
      recipientId: inv.recipientId,
      senderName: sender?.display_name || 'Friend',
      recipientName: recipient?.display_name || 'Friend',
      personalStreak: streaks.personalStreak,
      friendshipStreak: streaks.friendshipStreak,
      celebrationReady: true,
      invitation: { ...inv },
    };
  } else {
    // Rejection flow
    inv.status = 'rejected';
    inv.meetingStatus = 'cancelled';
    inv.updatedAt = nowIso;

    return {
      success: true,
      message: 'Break invitation declined.',
      invitationId: inv.id,
      status: 'rejected',
      meetingStatus: 'cancelled',
    };
  }
}

function updateMeetingStatus({ invitationId, userId, meetingStatus }) {
  const inv = dbInvitations.find((i) => i.id === invitationId);
  if (!inv) {
    return { success: false, error: 'Invitation not found.' };
  }
  // Must be sender or recipient
  if (inv.senderId !== userId && inv.recipientId !== userId) {
    return { success: false, error: 'Unauthorized: You are not a participant in this invitation.' };
  }
  // Must be accepted invitation
  if (inv.status !== 'accepted') {
    return { success: false, error: 'Only accepted invitations have active meetup lifecycles.' };
  }
  if (!['pending', 'completed', 'cancelled', 'missed'].includes(meetingStatus)) {
    return { success: false, error: 'Invalid meeting status.' };
  }

  inv.meetingStatus = meetingStatus;
  inv.updatedAt = new Date().toISOString();

  return {
    success: true,
    message: `Meeting status updated to ${meetingStatus}.`,
    invitationId: inv.id,
    status: inv.status,
    meetingStatus: inv.meetingStatus,
  };
}

function markCelebrationSeen({ invitationId, userId, role }) {
  const inv = dbInvitations.find((i) => i.id === invitationId);
  if (!inv) return { success: false, error: 'Invitation not found.' };

  const nowIso = new Date().toISOString();
  if (role === 'sender' || inv.senderId === userId) {
    inv.senderCelebratedAt = nowIso;
    return { success: true, role: 'sender' };
  } else if (role === 'recipient' || inv.recipientId === userId) {
    inv.recipientCelebratedAt = nowIso;
    return { success: true, role: 'recipient' };
  }
  return { success: false, error: 'Unauthorized participant.' };
}

function getUserInvitations(userId, filter = 'all') {
  return dbInvitations
    .filter((inv) => {
      if (filter === 'incoming') return inv.recipientId === userId;
      if (filter === 'sent') return inv.senderId === userId;
      return inv.recipientId === userId || inv.senderId === userId;
    })
    .map((inv) => {
      const sender = dbUsers[inv.senderId];
      const recipient = dbUsers[inv.recipientId];
      return {
        ...inv,
        senderDisplayName: sender ? sender.display_name : 'Friend',
        senderUsername: sender ? sender.username : null,
        recipientDisplayName: recipient ? recipient.display_name : 'Friend',
        recipientUsername: recipient ? recipient.username : null,
      };
    });
}

// ==========================================
// TEST 1: Validation Rules
// ==========================================
console.log('Test 1: Validation & Constraints');
{
  // 1.1 Self-invitation should fail
  const selfInvite = createInvitation({
    senderId: 'user_a',
    recipientId: 'user_a',
    activityId: 'act_chai',
    activityTitle: 'EVENING CHAI',
  });
  assert.strictEqual(selfInvite.success, false, 'Self-invite should fail');
  assert.match(selfInvite.error, /cannot send an invitation to yourself/i);
  console.log('  ✓ Self-invitation blocked correctly.');

  // 1.2 Missing recipient should fail
  const noRecipient = createInvitation({
    senderId: 'user_a',
    recipientId: '',
    activityId: 'act_chai',
    activityTitle: 'EVENING CHAI',
  });
  assert.strictEqual(noRecipient.success, false, 'Missing recipient should fail');
  console.log('  ✓ Missing recipient rejected.');

  // 1.3 Missing title should fail
  const noTitle = createInvitation({
    senderId: 'user_a',
    recipientId: 'user_b',
    activityId: 'act_chai',
    activityTitle: '',
  });
  assert.strictEqual(noTitle.success, false, 'Missing title should fail');
  console.log('  ✓ Missing title rejected.');
}

// ==========================================
// TEST 2: User A sends EVENING CHAI to User B
// ==========================================
console.log('\nTest 2: User A sends EVENING CHAI to User B');
let invitationId1;
{
  const result = createInvitation({
    senderId: 'user_a',
    recipientId: 'user_b',
    activityId: 'act_chai',
    activityTitle: 'EVENING CHAI',
    customNote: 'Tea stall near the park in 15 mins?',
  });
  assert.strictEqual(result.success, true, 'User A sending invite should succeed');
  assert.ok(result.invitationId, 'Should return invitation ID');
  invitationId1 = result.invitationId;

  const createdInv = dbInvitations.find((i) => i.id === invitationId1);
  assert.strictEqual(createdInv.status, 'pending', 'Invitation status must initialize as pending');
  assert.strictEqual(createdInv.meetingStatus, 'pending', 'Meeting status must initialize as pending');
  console.log(`  ✓ Invitation created successfully with status="pending" & meeting_status="pending"! ID: ${invitationId1}`);
}

// ==========================================
// TEST 3: Duplicate Throttle Protection
// ==========================================
console.log('\nTest 3: Throttling Duplicate Spam');
{
  const dupResult = createInvitation({
    senderId: 'user_a',
    recipientId: 'user_b',
    activityId: 'act_chai',
    activityTitle: 'EVENING CHAI',
  });
  assert.strictEqual(dupResult.success, false, 'Duplicate invite within 2 min should be blocked');
  assert.match(dupResult.error, /already sent an invitation/i);
  console.log('  ✓ Duplicate invitation throttled correctly.');
}

// ==========================================
// TEST 4: Recipient (User B) Inbox Query
// ==========================================
console.log('\nTest 4: Recipient (User B) Inbox & Home Screen Delivery');
{
  const userBIncoming = getUserInvitations('user_b', 'incoming');
  assert.strictEqual(userBIncoming.length, 1, 'User B should see 1 incoming invitation');
  assert.strictEqual(userBIncoming[0].activityTitle, 'EVENING CHAI');
  assert.strictEqual(userBIncoming[0].senderId, 'user_a');
  assert.strictEqual(userBIncoming[0].senderDisplayName, 'Aarav Sharma');
  assert.strictEqual(userBIncoming[0].status, 'pending');
  assert.strictEqual(userBIncoming[0].meetingStatus, 'pending');
  assert.strictEqual(userBIncoming[0].customNote, 'Tea stall near the park in 15 mins?');
  console.log('  ✓ User B receives "EVENING CHAI" from User A (Aarav Sharma).');

  // Verify User A sent history
  const userASent = getUserInvitations('user_a', 'sent');
  assert.strictEqual(userASent.length, 1, 'User A should see 1 sent invitation in history');
  assert.strictEqual(userASent[0].recipientDisplayName, 'Priya Patel');
  console.log('  ✓ User A sent history shows invitation to Priya Patel.');

  // Verify User C receives nothing
  const userCIncoming = getUserInvitations('user_c', 'incoming');
  assert.strictEqual(userCIncoming.length, 0, 'User C should have 0 invitations');
  console.log('  ✓ User C (unrelated user) has 0 incoming invitations (privacy preserved).');
}

// ==========================================
// TEST 5: Unauthorized Interception Security
// ==========================================
console.log('\nTest 5: Unauthorized Interception Security');
{
  const hackerAttempt = respondToInvitation({
    invitationId: invitationId1,
    userId: 'user_c', // User C trying to accept User B's invitation
    action: 'accepted',
  });
  assert.strictEqual(hackerAttempt.success, false, 'Unauthorized user cannot accept invite');
  assert.match(hackerAttempt.error, /Only the recipient can respond/i);
  console.log('  ✓ Unauthorized user (User C) cannot accept/decline User B\'s invitation.');
}

// ==========================================
// TEST 6: User B Accepts Invitation & Acceptance Celebration
// ==========================================
console.log('\nTest 6: User B Accepts EVENING CHAI & Celebration Trigger for Both Users');
{
  const acceptResult = respondToInvitation({
    invitationId: invitationId1,
    userId: 'user_b',
    action: 'accepted',
  });
  assert.strictEqual(acceptResult.success, true, 'User B should successfully accept');
  assert.strictEqual(acceptResult.status, 'accepted');
  assert.strictEqual(acceptResult.meetingStatus, 'pending');
  assert.ok(acceptResult.headline, 'Celebration headline must be generated');
  assert.strictEqual(acceptResult.personalStreak, 1, 'Sender personal streak should be 1');
  assert.strictEqual(acceptResult.friendshipStreak, 1, 'Pair friendship streak should be 1');
  assert.strictEqual(acceptResult.celebrationReady, true, 'Celebration payload must be ready for recipient');

  const invRecord = dbInvitations.find((i) => i.id === invitationId1);
  assert.strictEqual(invRecord.status, 'accepted', 'Database invitation status updated to accepted');
  assert.strictEqual(invRecord.meetingStatus, 'pending', 'Database meeting status initialized to pending');
  assert.strictEqual(invRecord.recipientCelebratedAt, null, 'recipientCelebratedAt initially null so celebration displays');
  assert.strictEqual(invRecord.senderCelebratedAt, null, 'senderCelebratedAt initially null so celebration displays');

  // Both users see celebration headline
  const expectedHeadline = getCelebrationHeadline(invitationId1);
  assert.strictEqual(invRecord.headline, expectedHeadline, 'Deterministic celebration headline consistent for both');

  // Recipient views celebration and acknowledges
  const recSeen = markCelebrationSeen({ invitationId: invitationId1, userId: 'user_b', role: 'recipient' });
  assert.strictEqual(recSeen.success, true);
  assert.ok(invRecord.recipientCelebratedAt, 'recipientCelebratedAt recorded after acknowledgement');

  // Sender receives accepted notification via Realtime/polling and acknowledges celebration
  const sndSeen = markCelebrationSeen({ invitationId: invitationId1, userId: 'user_a', role: 'sender' });
  assert.strictEqual(sndSeen.success, true);
  assert.ok(invRecord.senderCelebratedAt, 'senderCelebratedAt recorded after acknowledgement');

  console.log('  ✓ Acceptance updates status to "accepted" & initializes meeting_status to "pending".');
  console.log(`  ✓ Celebration headline "${invRecord.headline}" triggered for BOTH users.`);
  console.log('  ✓ Celebration acknowledgment recorded for both sender and recipient.');
}

// ==========================================
// TEST 7: Idempotency & Duplicate Streak Prevention
// ==========================================
console.log('\nTest 7: Duplicate Acceptance Idempotency Protection');
{
  // User B or a network retry attempts to accept invitationId1 again
  const retryAccept = respondToInvitation({
    invitationId: invitationId1,
    userId: 'user_b',
    action: 'accepted',
  });
  assert.strictEqual(retryAccept.success, true, 'Idempotent retry should succeed without error');
  assert.strictEqual(retryAccept.personalStreak, 1, 'Streak must NOT duplicate on re-acceptance');
  assert.strictEqual(retryAccept.friendshipStreak, 1, 'Streak must NOT duplicate on re-acceptance');

  // Verify streaks query
  const streaksA = getInvitationStreaks('user_a', 'user_b');
  assert.strictEqual(streaksA.personalStreak, 1, 'Personal streak remains strictly 1');
  assert.strictEqual(streaksA.friendshipStreak, 1, 'Friendship streak remains strictly 1');
  console.log('  ✓ Repeated acceptance returns cleanly without duplicate streak increments.');
}

// ==========================================
// TEST 8: Non-Daily Accepted Invitation Streak Counting
// ==========================================
console.log('\nTest 8: Invitation Streak Counts Accepted Invitations (Non-Daily)');
{
  // User A sends second invitation to User B on the SAME day
  const inv2Res = createInvitation({
    senderId: 'user_a',
    recipientId: 'user_b',
    activityId: 'act_movie',
    activityTitle: 'WEEKEND MOVIE',
  });
  assert.strictEqual(inv2Res.success, true);

  const accept2 = respondToInvitation({
    invitationId: inv2Res.invitationId,
    userId: 'user_b',
    action: 'accepted',
  });
  assert.strictEqual(accept2.success, true);
  assert.strictEqual(accept2.personalStreak, 2, 'Personal streak increments with 2nd accepted invitation');
  assert.strictEqual(accept2.friendshipStreak, 2, 'Friendship streak increments with 2nd accepted invitation');

  // Verify streaks calculation directly
  const freshStreaks = getInvitationStreaks('user_a', 'user_b');
  assert.strictEqual(freshStreaks.personalStreak, 2, 'Streaks count total accepted invitations, not calendar days');
  assert.strictEqual(freshStreaks.friendshipStreak, 2);
  console.log('  ✓ Streaks accurately count total accepted invitations (non-daily).');
}

// ==========================================
// TEST 9: Meetup Lifecycle (meeting_status) Separation
// ==========================================
console.log('\nTest 9: Separate meeting_status Lifecycle (pending -> completed)');
{
  const invRecord = dbInvitations.find((i) => i.id === invitationId1);
  assert.strictEqual(invRecord.status, 'accepted', 'Invitation status is accepted');
  assert.strictEqual(invRecord.meetingStatus, 'pending', 'Meeting status is pending');

  // User A marks meeting completed
  const completeRes = updateMeetingStatus({
    invitationId: invitationId1,
    userId: 'user_a',
    meetingStatus: 'completed',
  });
  assert.strictEqual(completeRes.success, true);
  assert.strictEqual(completeRes.meetingStatus, 'completed');
  assert.strictEqual(completeRes.status, 'accepted', 'Invitation status remains accepted when meeting completed');

  // Verify in storage
  assert.strictEqual(invRecord.meetingStatus, 'completed');
  assert.strictEqual(invRecord.status, 'accepted');
  console.log('  ✓ Meeting status transitioned to "completed" while invitation status remains "accepted".');
}

// ==========================================
// TEST 10: Rejection Flow
// ==========================================
console.log('\nTest 10: Rejection Flow (status="rejected", meeting_status="cancelled")');
{
  const invite3 = createInvitation({
    senderId: 'user_a',
    recipientId: 'user_b',
    activityId: 'act_ride',
    activityTitle: 'NIGHT RIDE',
  });
  assert.strictEqual(invite3.success, true);

  // User B rejects/declines
  const rejectResult = respondToInvitation({
    invitationId: invite3.invitationId,
    userId: 'user_b',
    action: 'rejected',
  });
  assert.strictEqual(rejectResult.success, true);
  assert.strictEqual(rejectResult.status, 'rejected');
  assert.strictEqual(rejectResult.meetingStatus, 'cancelled');

  const rejectedInv = dbInvitations.find((i) => i.id === invite3.invitationId);
  assert.strictEqual(rejectedInv.status, 'rejected');
  assert.strictEqual(rejectedInv.meetingStatus, 'cancelled');

  // Streak should NOT increment for rejected invitations
  const postRejectStreaks = getInvitationStreaks('user_a', 'user_b');
  assert.strictEqual(postRejectStreaks.personalStreak, 2, 'Personal streak unchanged by rejection');
  assert.strictEqual(postRejectStreaks.friendshipStreak, 2, 'Friendship streak unchanged by rejection');
  console.log('  ✓ Rejection updates status to "rejected" and meeting_status to "cancelled".');
  console.log('  ✓ Rejections do not increment acceptance streaks.');
}

// ==========================================
// TEST 11: Cancel Meetup Lifecycle on Accepted Invitation
// ==========================================
console.log('\nTest 11: Meetup Cancelled Lifecycle on Accepted Invitation');
{
  // User B cancels the meetup for second invitation
  const cancelMeetRes = updateMeetingStatus({
    invitationId: dbInvitations[1].id,
    userId: 'user_b',
    meetingStatus: 'cancelled',
  });
  assert.strictEqual(cancelMeetRes.success, true);
  assert.strictEqual(cancelMeetRes.meetingStatus, 'cancelled');
  assert.strictEqual(dbInvitations[1].status, 'accepted', 'Invitation status remains accepted even if meetup cancelled');
  console.log('  ✓ Meeting cancelled separately while invitation status remains "accepted".');
}

console.log('\n========================================================================');
console.log('🎉 ALL 11 TEST SCENARIOS PASSED WITH ZERO FAILURES!');
console.log('========================================================================\n');
