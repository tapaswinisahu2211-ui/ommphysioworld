package com.ommphysioworld.userapp.util

import java.time.LocalDate

object FormValidators {
    private val emailPattern = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    private val phonePattern = Regex("^[6-9]\\d{9}$")

    fun cleanPhone(value: String): String = value.trim().replace(Regex("\\D"), "")

    fun isValidEmail(value: String): Boolean = emailPattern.matches(value.trim().lowercase())

    fun isValidPhone(value: String): Boolean = phonePattern.matches(cleanPhone(value))

    fun email(value: String, required: Boolean = true): String? {
        val normalized = value.trim()
        if (normalized.isEmpty() && required) {
            return "Email is required."
        }
        if (normalized.isNotEmpty() && !isValidEmail(normalized)) {
            return "Please enter a valid email address."
        }
        return null
    }

    fun phone(value: String, required: Boolean = true): String? {
        val normalized = cleanPhone(value)
        if (normalized.isEmpty() && required) {
            return "Phone number is required."
        }
        if (normalized.isNotEmpty() && !isValidPhone(normalized)) {
            return "Please enter a valid 10-digit phone number."
        }
        return null
    }

    fun isPastDate(value: LocalDate): Boolean = value.isBefore(LocalDate.now())
}
