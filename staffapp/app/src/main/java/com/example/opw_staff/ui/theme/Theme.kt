package com.example.opw_staff.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = OpwSky,
    secondary = OpwBlue,
    tertiary = OpwWarning,
    background = OpwInk,
    surface = OpwSurfaceDark,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
)

private val LightColorScheme = lightColorScheme(
    primary = OpwBlue,
    secondary = OpwSky,
    tertiary = OpwWarning,
    background = OpwMist,
    surface = Color.White,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = OpwInk,
    onSurface = OpwInk,
    outline = OpwBorder,
)

private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(10),
    small = RoundedCornerShape(16),
    medium = RoundedCornerShape(24),
    large = RoundedCornerShape(30),
    extraLarge = RoundedCornerShape(36),
)

@Composable
fun OpwStaffTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = AppShapes,
        content = content,
    )
}
