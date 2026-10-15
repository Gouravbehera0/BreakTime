package com.breaktime.app.ui.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.theme.BreakTimeTheme
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryText

/**
 * Section header introducing the "YOUR PEOPLE" contact dashboard:
 * - Title: "YOUR PEOPLE"
 * - Supporting text: "Your favourite people, one tap away."
 * - Action: "+ Add People" pill button with subtle purple luminescence
 */
@Composable
fun YourPeopleHeader(
    onAddPeopleClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val pillShape = RoundedCornerShape(18.dp)
    val interactionSource = remember { MutableInteractionSource() }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "YOUR PEOPLE",
                color = PrimaryText,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.8.sp
            )

            Spacer(modifier = Modifier.height(2.dp))

            Text(
                text = "Your favourite people, one tap away.",
                color = SecondaryText,
                fontSize = 12.sp,
                fontWeight = FontWeight.Normal
            )
        }

        // "+ Add People" Pill Button
        Box(
            modifier = Modifier
                .shadow(
                    elevation = 6.dp,
                    shape = pillShape,
                    spotColor = PrimaryAccent.copy(alpha = 0.35f),
                    ambientColor = PrimaryAccent.copy(alpha = 0.15f)
                )
                .clip(pillShape)
                .background(RaisedCardSurface)
                .border(
                    width = 1.dp,
                    color = PrimaryAccent.copy(alpha = 0.6f),
                    shape = pillShape
                )
                .clickable(
                    interactionSource = interactionSource,
                    indication = null,
                    role = Role.Button,
                    onClick = onAddPeopleClick
                )
                .padding(horizontal = 14.dp, vertical = 7.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Outlined.PersonAdd,
                    contentDescription = null,
                    tint = PrimaryAccent,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Add People",
                    color = PrimaryText,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Preview(name = "Your People Header")
@Composable
private fun YourPeopleHeaderPreview() {
    BreakTimeTheme {
        YourPeopleHeader(onAddPeopleClick = {})
    }
}
