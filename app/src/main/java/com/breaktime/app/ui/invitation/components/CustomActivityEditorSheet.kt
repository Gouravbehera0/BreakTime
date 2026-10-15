package com.breaktime.app.ui.invitation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.activity.BreakActivity
import com.breaktime.app.ui.components.NeomorphicTextField
import com.breaktime.app.ui.components.PrimaryGradientButton
import com.breaktime.app.ui.theme.ErrorColor
import com.breaktime.app.ui.theme.LightShadow
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryBackground
import com.breaktime.app.ui.theme.SecondaryText

/**
 * Editor sheet allowing users to create, edit, or delete bespoke custom BreakTime activities.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomActivityEditorSheet(
    existingActivity: BreakActivity?,
    onSave: (title: String, subtitle: String, tags: List<String>) -> Unit,
    onDelete: ((id: String) -> Unit)? = null,
    onDismiss: () -> Unit,
    sheetState: SheetState = rememberModalBottomSheetState(),
    modifier: Modifier = Modifier
) {
    var title by remember(existingActivity) {
        mutableStateOf(existingActivity?.title?.takeIf { !it.contains("CUSTOM") }.orEmpty())
    }
    var subtitle by remember(existingActivity) {
        mutableStateOf(existingActivity?.subtitle?.takeIf { !it.contains("Create your own") }.orEmpty())
    }
    var tag1 by remember(existingActivity) {
        mutableStateOf(existingActivity?.tags?.getOrNull(0) ?: "Just the two of us")
    }
    var tag2 by remember(existingActivity) {
        mutableStateOf(existingActivity?.tags?.getOrNull(1) ?: "Anywhere nearby")
    }
    var titleError by remember { mutableStateOf<String?>(null) }

    val focusManager = LocalFocusManager.current
    val isEditMode = existingActivity != null && existingActivity.isCustom && !existingActivity.id.startsWith("act_custom_default")

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
                .imePadding()
                .padding(horizontal = 24.dp, vertical = 8.dp)
        ) {
            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (isEditMode) "Edit Custom Activity" else "Create Custom Activity",
                    color = PrimaryText,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold
                )

                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Outlined.Close,
                        contentDescription = "Close editor",
                        tint = SecondaryText,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Title Field
            NeomorphicTextField(
                value = title,
                onValueChange = {
                    title = it
                    titleError = null
                },
                label = "Activity Name",
                placeholder = "e.g. SUNSET DRIVE, STUDY COFFEE",
                isError = titleError != null,
                errorMessage = titleError,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Subtitle Field
            NeomorphicTextField(
                value = subtitle,
                onValueChange = { subtitle = it },
                label = "Tagline / Mood",
                placeholder = "e.g. Catch the golden hour together.",
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Metadata Tags Row
            Text(
                text = "Invitation Tags",
                color = SecondaryText,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(6.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                Box(modifier = Modifier.weight(1f)) {
                    NeomorphicTextField(
                        value = tag1,
                        onValueChange = { tag1 = it },
                        label = "Tag 1",
                        placeholder = "Just the two of us",
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Box(modifier = Modifier.weight(1f)) {
                    NeomorphicTextField(
                        value = tag2,
                        onValueChange = { tag2 = it },
                        label = "Tag 2",
                        placeholder = "Anywhere nearby",
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() })
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Save Button
            PrimaryGradientButton(
                text = if (isEditMode) "Save Changes" else "Add to Activities",
                showArrow = false,
                onClick = {
                    val cleanTitle = title.trim()
                    if (cleanTitle.isBlank()) {
                        titleError = "Please enter an activity name"
                        return@PrimaryGradientButton
                    }
                    onSave(
                        cleanTitle,
                        subtitle.trim().ifEmpty { "A memorable break moment." },
                        listOf(tag1.trim().ifEmpty { "Just the two of us" }, tag2.trim().ifEmpty { "Anywhere nearby" })
                    )
                }
            )

            // Delete Button if editing an existing saved custom activity
            if (isEditMode && onDelete != null) {
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onDelete(existingActivity.id) }
                        .padding(vertical = 10.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Delete,
                        contentDescription = "Delete activity",
                        tint = ErrorColor,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Delete Custom Activity",
                        color = ErrorColor,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
