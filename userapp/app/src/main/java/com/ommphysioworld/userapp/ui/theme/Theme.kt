package com.ommphysioworld.userapp.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.shape.RoundedCornerShape

private val LightColors = lightColorScheme(
    primary = OpwBlue,
    secondary = OpwSky,
    tertiary = Color(0xFF0EA5E9),
    background = OpwMist,
    surface = Color.White,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = OpwInk,
    onSurface = OpwInk,
    outline = OpwBorder,
)

private val DarkColors = darkColorScheme(
    primary = OpwSky,
    secondary = OpwBlue,
    tertiary = Color(0xFF38BDF8),
    background = Color(0xFF020817),
    surface = Color(0xFF0F172A),
    onPrimary = OpwInk,
    onSecondary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    outline = Color(0xFF334155),
)

private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(10),
    small = RoundedCornerShape(16),
    medium = RoundedCornerShape(24),
    large = RoundedCornerShape(30),
    extraLarge = RoundedCornerShape(36),
)

@Composable
fun OmmPhysioWorldTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme: ColorScheme = if (darkTheme) DarkColors else LightColors

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        shapes = AppShapes,
        content = content,
    )
}

@Composable
fun opwCardColors() = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
