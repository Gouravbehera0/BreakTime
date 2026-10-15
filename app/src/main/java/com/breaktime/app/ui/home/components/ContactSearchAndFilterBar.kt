package com.breaktime.app.ui.home.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.contact.ContactFilter
import com.breaktime.app.ui.theme.BreakTimeTheme
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.PlaceholderColor
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryBackground
import com.breaktime.app.ui.theme.SecondaryText
import com.breaktime.app.ui.theme.SubtleBorderColor

/**
 * Integrated Search Box and Category Filter Chips row matching the BreakTime dashboard UI.
 */
@Composable
fun ContactSearchAndFilterBar(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    selectedFilter: ContactFilter,
    onFilterSelected: (ContactFilter) -> Unit,
    allCount: Int,
    onlineCount: Int,
    offlineCount: Int,
    pinnedCount: Int,
    onFilterSettingsClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val focusManager = LocalFocusManager.current
    val searchShape = RoundedCornerShape(22.dp)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
    ) {
        // 1. Search Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .shadow(
                    elevation = 6.dp,
                    shape = searchShape,
                    spotColor = DarkShadow,
                    ambientColor = DarkShadow
                )
                .clip(searchShape)
                .background(SecondaryBackground)
                .border(width = 1.dp, color = SubtleBorderColor, shape = searchShape)
                .padding(horizontal = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.Search,
                contentDescription = null,
                tint = SecondaryText,
                modifier = Modifier.size(20.dp)
            )

            Spacer(modifier = Modifier.width(10.dp))

            Box(
                modifier = Modifier.weight(1f),
                contentAlignment = Alignment.CenterStart
            ) {
                if (searchQuery.isEmpty()) {
                    Text(
                        text = "Search your people...",
                        color = PlaceholderColor,
                        fontSize = 14.sp
                    )
                }

                BasicTextField(
                    value = searchQuery,
                    onValueChange = onSearchQueryChange,
                    singleLine = true,
                    textStyle = TextStyle(
                        color = PrimaryText,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal
                    ),
                    cursorBrush = SolidColor(PrimaryAccent),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { focusManager.clearFocus() }),
                    modifier = Modifier.fillMaxWidth()
                )
            }

            if (searchQuery.isNotEmpty()) {
                IconButton(
                    onClick = { onSearchQueryChange("") },
                    modifier = Modifier.size(26.dp)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Close,
                        contentDescription = "Clear search",
                        tint = SecondaryText,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            IconButton(
                onClick = onFilterSettingsClick,
                modifier = Modifier.size(28.dp)
            ) {
                Icon(
                    imageVector = Icons.Outlined.Tune,
                    contentDescription = "Filter options",
                    tint = SecondaryText,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 2. Filter Chips Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            FilterChipItem(
                label = "All ($allCount)",
                isSelected = selectedFilter == ContactFilter.ALL,
                onClick = { onFilterSelected(ContactFilter.ALL) }
            )
            FilterChipItem(
                label = "Online ($onlineCount)",
                isSelected = selectedFilter == ContactFilter.ONLINE,
                onClick = { onFilterSelected(ContactFilter.ONLINE) }
            )
            FilterChipItem(
                label = "Offline ($offlineCount)",
                isSelected = selectedFilter == ContactFilter.OFFLINE,
                onClick = { onFilterSelected(ContactFilter.OFFLINE) }
            )
            FilterChipItem(
                label = "Pinned ($pinnedCount)",
                isSelected = selectedFilter == ContactFilter.PINNED,
                onClick = { onFilterSelected(ContactFilter.PINNED) }
            )
        }
    }
}

@Composable
private fun FilterChipItem(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val chipShape = RoundedCornerShape(18.dp)
    val interactionSource = remember { MutableInteractionSource() }

    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) PrimaryAccent else RaisedCardSurface,
        label = "chipBg"
    )
    val textColor by animateColorAsState(
        targetValue = if (isSelected) PrimaryText else SecondaryText,
        label = "chipText"
    )
    val borderColor = if (isSelected) PrimaryAccent else SubtleBorderColor

    Box(
        modifier = Modifier
            .shadow(
                elevation = if (isSelected) 6.dp else 2.dp,
                shape = chipShape,
                spotColor = if (isSelected) PrimaryAccent.copy(alpha = 0.4f) else DarkShadow,
                ambientColor = DarkShadow
            )
            .clip(chipShape)
            .background(backgroundColor)
            .border(width = 1.dp, color = borderColor, shape = chipShape)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                role = Role.Tab,
                onClick = onClick
            )
            .padding(horizontal = 14.dp, vertical = 7.dp)
            .semantics { contentDescription = "$label filter" },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
        )
    }
}

@Preview(name = "Search & Filter Bar")
@Composable
private fun ContactSearchAndFilterBarPreview() {
    BreakTimeTheme {
        Box(
            modifier = Modifier
                .background(Color(0xFF17171C))
                .padding(vertical = 16.dp)
        ) {
            ContactSearchAndFilterBar(
                searchQuery = "",
                onSearchQueryChange = {},
                selectedFilter = ContactFilter.ALL,
                onFilterSelected = {},
                allCount = 12,
                onlineCount = 5,
                offlineCount = 7,
                pinnedCount = 3,
                onFilterSettingsClick = {}
            )
        }
    }
}
