/**
 * Comprehensive Automated Test Suite for BreakTym Activity Invitation Delivery
 * Tests validation, lifecycle states, delivery filtering, authorization, and throttling.
 */

import assert from 'assert';

console.log('====================================================');
console.log('🧪 BreakTym Activity Invitation Delivery Test Suite');
console.log('====================================================\n');

// Simulated in-memory storage for test validation
let dbInvitations = [];
let dbUsers = {
  'user_a': { id: 'user_a', display_name: 'Aarav Sharma', username: 'aarav_s' },
  'user_b': { id: 'user_b', display_name: 'Priya Patel', username: 'priya_p' },
  'user_c': { id: 'user_c', display_name: 'Rohan Gupta', username: 'rohan_g' },
};

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
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  // Authorization check: Only recipient can accept/decline
  if (inv.recipientId !== userId) {
    return { success: false, error: 'Only the recipient can respond to this invitation.' };
  }
  // Cannot respond if already resolved
  if (inv.status !== 'pending' && inv.status !== 'sent') {
    return { success: false, error: `Invitation has already been ${inv.status}.` };
  }

  inv.status = action;
  inv.updatedAt = new Date().toISOString();
  return {
    success: true,
    message: action === 'accepted' ? 'Break invitation accepted! Enjoy your break ✨' : 'Break invitation declined.',
  };
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
  console.log(`  ✓ Invitation created successfully! ID: ${invitationId1}`);
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
// TEST 5: Unauthorized Third Party Attempt
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
// TEST 6: User B Accepts Invitation
// ==========================================
console.log('\nTest 6: User B Accepts EVENING CHAI');
{
  const acceptResult = respondToInvitation({
    invitationId: invitationId1,
    userId: 'user_b',
    action: 'accepted',
  });
  assert.strictEqual(acceptResult.success, true, 'User B should successfully accept');
  assert.match(acceptResult.message, /accepted!/i);

  // Verify status is now 'accepted'
  const userBList = getUserInvitations('user_b', 'incoming');
  assert.strictEqual(userBList[0].status, 'accepted');

  const userAList = getUserInvitations('user_a', 'sent');
  assert.strictEqual(userAList[0].status, 'accepted');
  console.log('  ✓ Status updated to "accepted" for both User A and User B.');

  // Responding again should fail
  const doubleAccept = respondToInvitation({
    invitationId: invitationId1,
    userId: 'user_b',
    action: 'accepted',
  });
  assert.strictEqual(doubleAccept.success, false, 'Double-accept should fail');
  console.log('  ✓ Double-acceptance blocked safely.');
}

// ==========================================
// TEST 7: Decline Flow
// ==========================================
console.log('\nTest 7: User A sends NIGHT RIDE to User B and User B Declines');
{
  const invite2 = createInvitation({
    senderId: 'user_a',
    recipientId: 'user_b',
    activityId: 'act_ride',
    activityTitle: 'NIGHT RIDE',
  });
  assert.strictEqual(invite2.success, true);

  const declineResult = respondToInvitation({
    invitationId: invite2.invitationId,
    userId: 'user_b',
    action: 'declined',
  });
  assert.strictEqual(declineResult.success, true);
  assert.match(declineResult.message, /declined/i);

  const userBList = getUserInvitations('user_b', 'incoming');
  const declinedInv = userBList.find((i) => i.id === invite2.invitationId);
  assert.strictEqual(declinedInv.status, 'declined');
  console.log('  ✓ Decline flow verified with status "declined".');
}

console.log('\n====================================================');
console.log('🎉 ALL 7 TEST SCENARIOS PASSED WITH ZERO FAILURES!');
console.log('====================================================\n');
