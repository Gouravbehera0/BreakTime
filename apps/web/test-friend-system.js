import assert from 'node:assert/strict';

// Helper functions matching production validation logic
function normalizeUsername(input) {
  if (!input) return '';
  return input.trim().toLowerCase().replace(/^@/, '');
}

function validateUsername(input) {
  const clean = normalizeUsername(input);
  if (!clean) {
    return { valid: false, error: 'Username cannot be empty.' };
  }
  if (clean.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.' };
  }
  if (clean.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters.' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores.' };
  }
  return { valid: true, error: null, username: clean };
}

// Simulated mock in-memory service replicating friendService logic
class MockFriendService {
  constructor() {
    this.profiles = [
      { id: 'usr-1', username: 'priya_k', displayName: 'Priya K', avatarUrl: null, bio: 'Coffee & Code ☕' },
      { id: 'usr-2', username: 'rahul_sharma', displayName: 'Rahul Sharma', avatarUrl: null, bio: 'Night rides' },
      { id: 'usr-3', username: 'aisha_sen', displayName: 'Aisha Sen', avatarUrl: null, bio: 'Music & sunsets' },
      { id: 'usr-4', username: 'kabir_speed', displayName: 'Kabir', avatarUrl: null, bio: 'Speedrunner' },
    ];
    this.friendships = [
      { userId: 'usr-1', friendId: 'usr-3' },
      { userId: 'usr-3', friendId: 'usr-1' },
    ];
    this.requests = [];
  }

  searchByUserId(searchQuery, currentUserId) {
    const clean = normalizeUsername(searchQuery);
    if (!clean || clean.length < 2) {
      return [];
    }

    const matches = this.profiles.filter(p => 
      p.username.toLowerCase().includes(clean) || p.id.toLowerCase() === clean
    );

    return matches.map(p => {
      let friendshipStatus = 'none';
      if (p.id === currentUserId) {
        friendshipStatus = 'self';
      } else if (this.friendships.some(f => f.userId === currentUserId && f.friendId === p.id)) {
        friendshipStatus = 'friends';
      } else if (this.requests.some(r => r.senderId === currentUserId && r.recipientId === p.id && r.status === 'pending')) {
        friendshipStatus = 'pending_sent';
      } else if (this.requests.some(r => r.senderId === p.id && r.recipientId === currentUserId && r.status === 'pending')) {
        friendshipStatus = 'pending_received';
      }

      return {
        userId: p.id,
        username: p.username,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        bio: p.bio,
        friendshipStatus,
      };
    });
  }

  sendFriendRequest(senderId, recipientId) {
    if (senderId === recipientId) {
      return { success: false, error: 'You cannot send a friend request to yourself' };
    }

    const targetUser = this.profiles.find(p => p.id === recipientId);
    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    const alreadyFriends = this.friendships.some(f => f.userId === senderId && f.friendId === recipientId);
    if (alreadyFriends) {
      return { success: false, error: 'You are already friends with this user' };
    }

    const existingOutgoing = this.requests.find(
      r => r.senderId === senderId && r.recipientId === recipientId && r.status === 'pending'
    );
    if (existingOutgoing) {
      return { success: false, error: 'Friend request already sent' };
    }

    // Check reciprocal request
    const existingIncoming = this.requests.find(
      r => r.senderId === recipientId && r.recipientId === senderId && r.status === 'pending'
    );
    if (existingIncoming) {
      existingIncoming.status = 'accepted';
      this.friendships.push({ userId: senderId, friendId: recipientId });
      this.friendships.push({ userId: recipientId, friendId: senderId });
      return { success: true, action: 'accepted_reciprocal', message: 'Reciprocal request detected! Friendship formed ✨' };
    }

    const newReq = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      senderId,
      recipientId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.requests.push(newReq);
    return { success: true, action: 'created', request: newReq, message: 'Friend request sent! ✨' };
  }

  acceptFriendRequest({ requestId, senderUserId, currentUserId }) {
    if (!currentUserId) return { success: false, error: 'Authentication required' };

    let req = null;
    if (requestId) {
      req = this.requests.find(r => r.id === requestId);
    } else if (senderUserId) {
      req = this.requests.find(r => r.senderId === senderUserId && r.recipientId === currentUserId && r.status === 'pending');
    }

    if (!req) {
      // Check if already friends
      if (senderUserId && this.friendships.some(f => f.userId === currentUserId && f.friendId === senderUserId)) {
        return { success: true, alreadyFriends: true, message: 'Already friends' };
      }
      return { success: false, error: 'No pending friend request found.' };
    }

    if (req.recipientId !== currentUserId) {
      return { success: false, error: 'Unauthorized: You can only respond to requests sent to you' };
    }

    if (req.status !== 'pending') {
      return { success: false, error: 'Request is no longer pending' };
    }

    req.status = 'accepted';
    this.friendships.push({ userId: req.senderId, friendId: req.recipientId });
    this.friendships.push({ userId: req.recipientId, friendId: req.senderId });
    return { success: true, message: 'Friend request accepted! Added to your circle ✨' };
  }

  determineButtonState(targetUserId, currentUserId) {
    if (targetUserId === currentUserId) return 'NONE'; // State 5: Show no friend action
    const isFriend = this.friendships.some(f => f.userId === currentUserId && f.friendId === targetUserId);
    if (isFriend) return 'FRIENDS'; // State 4: Show "Friends"
    const isSent = this.requests.some(r => r.senderId === currentUserId && r.recipientId === targetUserId && r.status === 'pending');
    if (isSent) return 'REQUEST_SENT'; // State 2: Show "Request Sent"
    const isReceived = this.requests.some(r => r.senderId === targetUserId && r.recipientId === currentUserId && r.status === 'pending');
    if (isReceived) return 'ACCEPT_DECLINE'; // State 3: Show "Accept" and "Decline"
    return 'ADD_FRIEND'; // State 1: Show "Add Friend"
  }

  respondToFriendRequest(requestId, recipientId, newStatus) {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };
    if (req.recipientId !== recipientId) {
      return { success: false, error: 'Unauthorized: You can only respond to requests sent to you' };
    }
    if (req.status !== 'pending') {
      return { success: false, error: 'Request is no longer pending' };
    }

    req.status = newStatus;
    if (newStatus === 'accepted') {
      this.friendships.push({ userId: req.senderId, friendId: req.recipientId });
      this.friendships.push({ userId: req.recipientId, friendId: req.senderId });
      return { success: true, message: 'Friend request accepted!' };
    }
    return { success: true, message: 'Friend request rejected.' };
  }

  cancelFriendRequest(requestId, senderId) {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };
    if (req.senderId !== senderId) {
      return { success: false, error: 'Unauthorized: You can only cancel requests you sent' };
    }

    req.status = 'cancelled';
    return { success: true, message: 'Friend request cancelled.' };
  }
}

// RUN TESTS
console.log('--- STARTING BREAKTYM USER ID SEARCH & FRIEND REQUEST TEST SUITE ---');

// Test 1: Username format validation & normalization
console.log('\n[TEST 1] Testing username validation & normalization:');
assert.equal(normalizeUsername('@Priya_K'), 'priya_k');
assert.equal(normalizeUsername('  Alex_99  '), 'alex_99');

assert.equal(validateUsername('ok').valid, false, 'Length < 3 should be invalid');
assert.equal(validateUsername('a'.repeat(21)).valid, false, 'Length > 20 should be invalid');
assert.equal(validateUsername('user@name').valid, false, 'Special chars @ should be invalid');
assert.equal(validateUsername('user name').valid, false, 'Spaces should be invalid');
assert.equal(validateUsername('priya_k').valid, true, 'Valid username should pass');
assert.equal(validateUsername('@rahul123').valid, true, 'Leading @ should be trimmed and pass');
console.log('✓ Username format validation passed.');

// Test 2: Search by User ID / Username with 5 distinct friendship states
console.log('\n[TEST 2] Testing search user ID & state computation:');
const svc = new MockFriendService();

// State 1: 'self'
const searchSelf = svc.searchByUserId('priya_k', 'usr-1');
assert.equal(searchSelf.length, 1);
assert.equal(searchSelf[0].friendshipStatus, 'self');
console.log('✓ State "self" correctly identified for current user profile.');

// State 2: 'friends' (usr-1 and usr-3 are already friends)
const searchFriend = svc.searchByUserId('aisha_sen', 'usr-1');
assert.equal(searchFriend.length, 1);
assert.equal(searchFriend[0].friendshipStatus, 'friends');
console.log('✓ State "friends" correctly identified for existing friendship.');

// State 3: 'none' (usr-1 and usr-2 are not friends yet)
const searchStranger = svc.searchByUserId('rahul_sharma', 'usr-1');
assert.equal(searchStranger.length, 1);
assert.equal(searchStranger[0].friendshipStatus, 'none');
console.log('✓ State "none" correctly identified for non-friend user.');

// Test 3: Sending friend request & duplicate prevention
console.log('\n[TEST 3] Testing friend request creation & rules:');
// Rule A: Cannot send to self
const selfSend = svc.sendFriendRequest('usr-1', 'usr-1');
assert.equal(selfSend.success, false);
assert.match(selfSend.error, /cannot send a friend request to yourself/i);
console.log('✓ Self friend-request correctly rejected.');

// Rule B: Cannot send to existing friend
const friendSend = svc.sendFriendRequest('usr-1', 'usr-3');
assert.equal(friendSend.success, false);
assert.match(friendSend.error, /already friends/i);
console.log('✓ Friend request to existing friend correctly rejected.');

// Rule C: Successful send
const normalSend = svc.sendFriendRequest('usr-1', 'usr-2');
assert.equal(normalSend.success, true);
assert.equal(normalSend.action, 'created');
console.log('✓ Normal friend request sent successfully.');

// Rule D: Prevent duplicate pending request
const dupSend = svc.sendFriendRequest('usr-1', 'usr-2');
assert.equal(dupSend.success, false);
assert.match(dupSend.error, /already sent/i);
console.log('✓ Duplicate pending request correctly prevented.');

// Now usr-1 searching usr-2 should yield 'pending_sent'
const searchSent = svc.searchByUserId('rahul_sharma', 'usr-1');
assert.equal(searchSent[0].friendshipStatus, 'pending_sent');
console.log('✓ State "pending_sent" correctly reflected in search results.');

// And usr-2 searching usr-1 should yield 'pending_received'
const searchRecv = svc.searchByUserId('priya_k', 'usr-2');
assert.equal(searchRecv[0].friendshipStatus, 'pending_received');
console.log('✓ State "pending_received" correctly reflected for target user.');

// Test 4: Friend Request tabs and Accept flow
console.log('\n[TEST 4] Testing Received tab Accept flow:');
const pendingReqId = normalSend.request.id;

// Accept by unauthorized user (e.g. usr-4) should fail
const unauthorizedAccept = svc.respondToFriendRequest(pendingReqId, 'usr-4', 'accepted');
assert.equal(unauthorizedAccept.success, false);
assert.match(unauthorizedAccept.error, /unauthorized/i);
console.log('✓ Unauthorized response attempt blocked.');

// Accept by intended recipient (usr-2)
const acceptRes = svc.respondToFriendRequest(pendingReqId, 'usr-2', 'accepted');
assert.equal(acceptRes.success, true);
console.log('✓ Recipient successfully accepted friend request.');

// Check that usr-1 and usr-2 are now friends
const nowFriends1 = svc.friendships.some(f => f.userId === 'usr-1' && f.friendId === 'usr-2');
const nowFriends2 = svc.friendships.some(f => f.userId === 'usr-2' && f.friendId === 'usr-1');
assert.equal(nowFriends1, true, 'usr-1 should have usr-2 as friend');
assert.equal(nowFriends2, true, 'usr-2 should have usr-1 as friend');
console.log('✓ Bidirectional friendship established upon acceptance.');

// Test 5: Cancel request flow
console.log('\n[TEST 5] Testing Cancel request by sender:');
const sendKabir = svc.sendFriendRequest('usr-1', 'usr-4');
assert.equal(sendKabir.success, true);
const reqKabirId = sendKabir.request.id;

// Only sender (usr-1) can cancel
const cancelByOther = svc.cancelFriendRequest(reqKabirId, 'usr-4');
assert.equal(cancelByOther.success, false);
assert.match(cancelByOther.error, /unauthorized/i);

const cancelBySender = svc.cancelFriendRequest(reqKabirId, 'usr-1');
assert.equal(cancelBySender.success, true);
console.log('✓ Request cancelled by sender successfully and unauthorized cancel blocked.');

// Test 6: Reciprocal request detection
console.log('\n[TEST 6] Testing Reciprocal request automatic acceptance:');
// usr-4 sends request to usr-1
const sendFrom4 = svc.sendFriendRequest('usr-4', 'usr-1');
assert.equal(sendFrom4.success, true);

// usr-1 now sends request to usr-4 (reciprocal request)
const reciprocalSend = svc.sendFriendRequest('usr-1', 'usr-4');
assert.equal(reciprocalSend.success, true);
assert.equal(reciprocalSend.action, 'accepted_reciprocal');
console.log('✓ Reciprocal request detected and safely resolved into friendship!');

// Test 7: Verify all 5 Button States from STEP 2
console.log('\n[TEST 7] Testing STEP 2 Five Distinct Relationship Button States:');
const stateSvc = new MockFriendService();
// Setup:
// usr-1 and usr-3 are friends
// usr-1 sends request to usr-2 (outgoing pending)
// usr-4 sends request to usr-1 (incoming pending)
// usr-5 has no relationship with usr-1
stateSvc.profiles.push({ id: 'usr-5', username: 'stranger_bob', displayName: 'Bob', avatarUrl: null, bio: null });
stateSvc.sendFriendRequest('usr-1', 'usr-2');
stateSvc.sendFriendRequest('usr-4', 'usr-1');

// State 1: No relationship -> 'ADD_FRIEND'
assert.equal(stateSvc.determineButtonState('usr-5', 'usr-1'), 'ADD_FRIEND', 'No relationship should show Add Friend');
console.log('✓ State 1 verified: No relationship shows "Add Friend".');

// State 2: Pending sent by logged-in user -> 'REQUEST_SENT'
assert.equal(stateSvc.determineButtonState('usr-2', 'usr-1'), 'REQUEST_SENT', 'Pending sent should show Request Sent');
console.log('✓ State 2 verified: Pending request sent shows "Request Sent".');

// State 3: Pending received by logged-in user -> 'ACCEPT_DECLINE'
assert.equal(stateSvc.determineButtonState('usr-4', 'usr-1'), 'ACCEPT_DECLINE', 'Pending received should show Accept and Decline');
console.log('✓ State 3 verified: Pending request received shows "Accept" and "Decline".');

// State 4: Already friends -> 'FRIENDS'
assert.equal(stateSvc.determineButtonState('usr-3', 'usr-1'), 'FRIENDS', 'Friends should show Friends');
console.log('✓ State 4 verified: Already friends shows "Friends".');

// State 5: Viewing own profile -> 'NONE'
assert.equal(stateSvc.determineButtonState('usr-1', 'usr-1'), 'NONE', 'Own profile should show no friend action');
console.log('✓ State 5 verified: Own profile shows no friend action.');

// Test 8: Verify Accept directly by senderUserId (Search Card Acceptance)
console.log('\n[TEST 8] Testing STEP 3 Search Card Accept by Sender User ID:');
// usr-1 receives request from usr-4 (sender = usr-4, recipient = usr-1)
// Attempt accept from unauthorized account (usr-5) should fail
const unauthAccept = stateSvc.acceptFriendRequest({ senderUserId: 'usr-4', currentUserId: 'usr-5' });
assert.equal(unauthAccept.success, false, 'Unauthorized user cannot accept request');
assert.match(unauthAccept.error, /unauthorized|no pending/i);
console.log('✓ Unauthorized third-party accept attempt rejected.');

// Intended recipient (usr-1) accepts request from usr-4 directly by senderUserId
const validAccept = stateSvc.acceptFriendRequest({ senderUserId: 'usr-4', currentUserId: 'usr-1' });
assert.equal(validAccept.success, true);
assert.match(validAccept.message, /accepted/i);
console.log('✓ Accept by senderUserId succeeded.');

// Verify bidirectional friendship is created
const f1 = stateSvc.friendships.some(f => f.userId === 'usr-1' && f.friendId === 'usr-4');
const f2 = stateSvc.friendships.some(f => f.userId === 'usr-4' && f.friendId === 'usr-1');
assert.equal(f1, true, 'usr-1 must have usr-4 as friend');
assert.equal(f2, true, 'usr-4 must have usr-1 as friend');
console.log('✓ Bidirectional friendship verified in friendships store.');

// Verify button state now transitions to FRIENDS
assert.equal(stateSvc.determineButtonState('usr-4', 'usr-1'), 'FRIENDS', 'Status must now be Friends');
assert.equal(stateSvc.determineButtonState('usr-1', 'usr-4'), 'FRIENDS', 'Status for both users must now be Friends');
console.log('✓ Both users now see "Friends" state.');

// Verify duplicate accept safely handled without duplicate rows
const countBefore = stateSvc.friendships.length;
const secondAccept = stateSvc.acceptFriendRequest({ senderUserId: 'usr-4', currentUserId: 'usr-1' });
assert.equal(secondAccept.success, true);
assert.equal(stateSvc.friendships.length, countBefore, 'Duplicate friendship records must never be created');
console.log('✓ Re-accepting handled safely without duplicate friendship records.');

console.log('\n>>> ALL 8 SUITES PASSED CLEANLY! <<<');

