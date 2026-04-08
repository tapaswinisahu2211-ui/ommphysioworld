import 'package:shared_preferences/shared_preferences.dart';

import 'package:omphysioworld/config/api_config.dart';

class ApiSettingsStorage {
  static const _baseUrlKey = 'api_base_url_override';

  Future<String?> getSavedBaseUrl() async {
    final preferences = await SharedPreferences.getInstance();
    final value = preferences.getString(_baseUrlKey)?.trim() ?? '';
    return value.isEmpty ? null : value;
  }

  Future<String> resolveBaseUrl() async {
    return (await getSavedBaseUrl()) ?? ApiConfig.defaultBaseUrl;
  }

  Future<void> saveBaseUrl(String baseUrl) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_baseUrlKey, baseUrl.trim());
  }

  Future<void> clearBaseUrl() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_baseUrlKey);
  }
}
