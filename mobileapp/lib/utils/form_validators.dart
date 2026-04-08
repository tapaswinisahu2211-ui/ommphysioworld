class FormValidators {
  static final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
  static final _phonePattern = RegExp(r'^[6-9]\d{9}$');

  static String cleanPhone(String value) => value.trim().replaceAll(RegExp(r'\D'), '');

  static bool isValidEmail(String value) => _emailPattern.hasMatch(value.trim().toLowerCase());

  static bool isValidPhone(String value) => _phonePattern.hasMatch(cleanPhone(value));

  static String? email(String value, {bool required = true}) {
    final email = value.trim();
    if (email.isEmpty && required) {
      return 'Email is required.';
    }
    if (email.isNotEmpty && !isValidEmail(email)) {
      return 'Please enter a valid email address.';
    }
    return null;
  }

  static String? phone(String value, {bool required = true}) {
    final phone = cleanPhone(value);
    if (phone.isEmpty && required) {
      return 'Phone number is required.';
    }
    if (phone.isNotEmpty && !isValidPhone(phone)) {
      return 'Please enter a valid 10-digit phone number.';
    }
    return null;
  }

  static bool isPastDate(DateTime date) {
    final today = DateTime.now();
    final normalizedToday = DateTime(today.year, today.month, today.day);
    final normalizedDate = DateTime(date.year, date.month, date.day);
    return normalizedDate.isBefore(normalizedToday);
  }
}
