package com.breaktime.app.ui.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.ui.theme.DividerColor
import com.breaktime.app.ui.theme.LightShadow
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryAccent
import com.breaktime.app.ui.theme.SecondaryBackground
import com.breaktime.app.ui.theme.SecondaryText

/**
 * Modal bottom sheet presenting rich contact connection details,
 * respecting all BreakTime privacy rules without navigating to a conventional chat screen.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactDetailsBottomSheet(
    contact: Contact,
    currentUserId: String,
    isInviting: Boolean,
    isInvited: Boolean,
    onInvite: () -> Unit,
    onTogglePin: () -> Unit,
    onDismiss: () -> Unit,
    onChooseActivityInvite: (() -> Unit)? = null,
    sheetState: SheetState = rememberModalBottomSheetState(),
    modifier: Modifier = Modifier
) {
    val displayName = contact.getVisibleName(currentUserId)
    val visibleRelationship = contact.getVisibleRelationship(currentUserId)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = RaisedCardSurface,
        scrimColor = Color.Black.copy(alpha = 0.65f),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 12.dp, bottom = 8.dp)
                    .size(width = 40.dp, height = 4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(LightShadow)
            )
        },
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 24.dp, vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header Row: Close button on right
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Contact Details",
                    color = SecondaryText,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Outlined.Close,
                        contentDescription = "Close details",
                        tint = SecondaryText,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Avatar with Presence indicator
            Box(
                modifier = Modifier.size(76.dp),
                contentAlignment = Alignment.BottomEnd
            ) {
                Box(
                    modifier = Modifier
                        .size(74.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Color(0xFF2E2B3D), Color(0xFF1E1C27))
                            )
                        )
                        .border(
                            width = 1.5.dp,
                            brush = Brush.sweepGradient(
                                listOf(PrimaryAccent, SecondaryAccent, PrimaryAccent)
                            ),
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    val initials = displayName.take(2).uppercase().filter { it.isLetter() }.ifEmpty { "BT" }
                    Text(
                        text = initials,
                        color = PrimaryText,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                OnlineIndicator(
                    isOnline = contact.isOnline,
                    size = 14.dp
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Contact Name
            Text(
                text = displayName,
                color = PrimaryText,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )

            // If private nickname is used, show the original contact name to creator
            if (displayName != contact.name) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Name: ${contact.name}",
                    color = SecondaryText,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Status Line
            Text(
                text = if (contact.isOnline) "Online • ${contact.statusText}" else "Offline • ${contact.statusText}",
                color = SecondaryText,
                fontSize = 13.sp
            )

            if (visibleRelationship != null) {
                Spacer(modifier = Modifier.height(10.dp))
                RelationshipBadge(
                    relationship = visibleRelationship,
                    viewerUserId = currentUserId,
                    relationshipCreatorId = contact.relationshipCreatorId
                )
            }

            if (!contact.bio.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(SecondaryBackground)
                        .padding(14.dp)
                ) {
                    Text(
                        text = contact.bio,
                        color = PrimaryText.copy(alpha = 0.9f),
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )
                }
            }

            if (!contact.phoneNumber.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(SecondaryBackground)
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Phone,
                        contentDescription = null,
                        tint = SecondaryText,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = contact.phoneNumber,
                        color = SecondaryText,
                        fontSize = 13.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
            HorizontalDivider(color = DividerColor)
            Spacer(modifier = Modifier.height(16.dp))

            // Actions Row: Pin toggle and One-Tap Invite Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    PinButton(
                        isPinned = contact.isPinned,
                        onTogglePin = onTogglePin
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (contact.isPinned) "Pinned to top" else "Pin to top",
                        color = if (contact.isPinned) PrimaryAccent else SecondaryText,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                InstantInviteButton(
                    isInviting = isInviting,
                    isInvited = isInvited,
                    onInvite = onInvite
                )
            }

            if (onChooseActivityInvite != null) {
                Spacer(modifier = Modifier.height(14.dp))
                com.breaktime.app.ui.components.PrimaryGradientButton(
                    text = "Swipe to Choose Activity ⚡",
                    showArrow = true,
                    onClick = {
                        onDismiss()
                        onChooseActivityInvite()
                    }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
