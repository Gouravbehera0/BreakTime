package com.breaktime.app.ui.home.components

import androidx.compose.animation.animateColorAsState
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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.theme.BreakTimeTheme
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.GlassBorderColor
import com.breaktime.app.ui.theme.GlassSurfaceColor
import com.breaktime.app.ui.theme.LightShadow
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryPurpleGradient
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.SecondaryAccent
import com.breaktime.app.ui.theme.SecondaryText

/**
 * Navigation tabs represented in the BreakTime navigation architecture.
 */
enum class DashboardTab(val label: String) {
    HOME("Home"),
    EXPLORE("Explore"),
    CREATE_BREAK("Break"),
    CIRCLES("Circles"),
    PROFILE("Profile")
}

/**
 * Floating glassmorphic bottom navigation bar implementing the Midnight Neomorphism aesthetic:
 * - Rounded pill capsule floating above the screen bottom
 * - Translucent midnight charcoal surface
 * - Subtle purple outer rim and ambient luminescence
 * - Elevated center '+' action button
 * - Radiant purple active indicator dot underneath selected tab
 * - System navigation bar inset handling
 */
@Composable
fun FloatingGlassNavigationBar(
    currentTab: DashboardTab,
    onTabSelected: (DashboardTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val barShape = RoundedCornerShape(32.dp)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 20.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        // Outer glowing glass container
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(68.dp)
                .shadow(
                    elevation = 16.dp,
                    shape = barShape,
                    spotColor = PrimaryAccent.copy(alpha = 0.3f),
                    ambientColor = DarkShadow
                )
                .clip(barShape)
                .background(GlassSurfaceColor)
                .border(
                    width = 1.dp,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            PrimaryAccent.copy(alpha = 0.35f),
                            GlassBorderColor,
                            LightShadow.copy(alpha = 0.2f)
                        )
                    ),
                    shape = barShape
                )
                .padding(horizontal = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 1. Home Tab
                NavItem(
                    label = "Home",
                    icon = if (currentTab == DashboardTab.HOME) Icons.Filled.Home else Icons.Outlined.Home,
                    isSelected = currentTab == DashboardTab.HOME,
                    onClick = { onTabSelected(DashboardTab.HOME) },
                    modifier = Modifier.weight(1f)
                )

                // 2. Explore Tab
                NavItem(
                    label = "Explore",
                    icon = Icons.Outlined.Explore,
                    isSelected = currentTab == DashboardTab.EXPLORE,
                    onClick = { onTabSelected(DashboardTab.EXPLORE) },
                    modifier = Modifier.weight(1f)
                )

                // 3. Center Elevated Break Action Button
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .offset(y = (-4).dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .shadow(
                                elevation = 12.dp,
                                shape = CircleShape,
                                spotColor = PrimaryAccent.copy(alpha = 0.6f),
                                ambientColor = PrimaryAccent.copy(alpha = 0.4f)
                            )
                            .clip(CircleShape)
                            .background(PrimaryPurpleGradient)
                            .border(
                                width = 1.5.dp,
                                color = Color.White.copy(alpha = 0.35f),
                                shape = CircleShape
                            )
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null,
                                role = Role.Button,
                                onClick = { onTabSelected(DashboardTab.CREATE_BREAK) }
                            )
                            .semantics { contentDescription = "Create instant break" },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Add,
                            contentDescription = null,
                            tint = PrimaryText,
                            modifier = Modifier.size(26.dp)
                        )
                    }
                }

                // 4. Circles Tab
                NavItem(
                    label = "Circles",
                    icon = Icons.Outlined.Groups,
                    isSelected = currentTab == DashboardTab.CIRCLES,
                    onClick = { onTabSelected(DashboardTab.CIRCLES) },
                    modifier = Modifier.weight(1f)
                )

                // 5. Profile Tab
                NavItem(
                    label = "Profile",
                    icon = Icons.Outlined.Person,
                    isSelected = currentTab == DashboardTab.PROFILE,
                    onClick = { onTabSelected(DashboardTab.PROFILE) },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun NavItem(
    label: String,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val tintColor by animateColorAsState(
        targetValue = if (isSelected) PrimaryText else SecondaryText,
        label = "navTint"
    )

    Column(
        modifier = modifier
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                role = Role.Tab,
                onClick = onClick
            )
            .padding(vertical = 4.dp)
            .semantics {
                contentDescription = "$label navigation tab"
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tintColor,
            modifier = Modifier.size(22.dp)
        )

        Spacer(modifier = Modifier.height(2.dp))

        Text(
            text = label,
            color = tintColor,
            fontSize = 10.sp,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
        )

        Spacer(modifier = Modifier.height(2.dp))

        // Purple Active Indicator Dot
        if (isSelected) {
            Box(
                modifier = Modifier
                    .size(4.dp)
                    .clip(CircleShape)
                    .background(PrimaryAccent)
            )
        } else {
            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}

@Preview(name = "Floating Bottom Bar")
@Composable
private fun FloatingGlassNavigationBarPreview() {
    BreakTimeTheme {
        Box(
            modifier = Modifier
                .background(Color(0xFF17171C))
                .padding(vertical = 20.dp)
        ) {
            FloatingGlassNavigationBar(
                currentTab = DashboardTab.HOME,
                onTabSelected = {}
            )
        }
    }
}
