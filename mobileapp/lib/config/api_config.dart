import 'package:flutter/foundation.dart';

class ApiConfig {
  const ApiConfig._();

  static const String _defaultAndroidDeviceBaseUrl = String.fromEnvironment(
    'ANDROID_DEVICE_API_BASE_URL',
    defaultValue: 'http://192.168.31.50:5000/api',
  );
  static const String _defaultAndroidEmulatorBaseUrl = String.fromEnvironment(
    'ANDROID_EMULATOR_API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
  );
  static const bool _useAndroidEmulatorBaseUrl = bool.fromEnvironment(
    'USE_ANDROID_EMULATOR_API',
    defaultValue: false,
  );
  static const String _overrideBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
  );

  static String get defaultBaseUrl {
    if (_overrideBaseUrl.isNotEmpty) {
      return _overrideBaseUrl;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return _useAndroidEmulatorBaseUrl
            ? _defaultAndroidEmulatorBaseUrl
            : _defaultAndroidDeviceBaseUrl;
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
        return 'http://127.0.0.1:5000/api';
      default:
        return 'http://localhost:5000/api';
    }
  }
}
