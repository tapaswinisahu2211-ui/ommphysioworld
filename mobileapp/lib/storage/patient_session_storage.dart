import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class PatientSessionStorage {
  static const _patientUserKey = 'patient_user';
  static const _notificationsSeenAtPrefix = 'patient_notifications_seen_at_';

  Future<Map<String, dynamic>?> getPatientUser() async {
    final preferences = await SharedPreferences.getInstance();
    final rawValue = preferences.getString(_patientUserKey)?.trim() ?? '';

    if (rawValue.isEmpty) {
      return null;
    }

    try {
      final decoded = jsonDecode(rawValue);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
    } catch (_) {
      await clearPatientUser();
    }

    return null;
  }

  Future<void> savePatientUser(Map<String, dynamic> user) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_patientUserKey, jsonEncode(user));
  }

  Future<void> clearPatientUser() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_patientUserKey);
  }

  Future<DateTime?> getNotificationsSeenAt(String patientId) async {
    final normalizedId = patientId.trim();
    if (normalizedId.isEmpty) {
      return null;
    }

    final preferences = await SharedPreferences.getInstance();
    final rawValue =
        preferences.getString('$_notificationsSeenAtPrefix$normalizedId') ??
            '';

    if (rawValue.isEmpty) {
      return null;
    }

    return DateTime.tryParse(rawValue);
  }

  Future<void> saveNotificationsSeenAt(
    String patientId,
    DateTime value,
  ) async {
    final normalizedId = patientId.trim();
    if (normalizedId.isEmpty) {
      return;
    }

    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(
      '$_notificationsSeenAtPrefix$normalizedId',
      value.toUtc().toIso8601String(),
    );
  }
}
