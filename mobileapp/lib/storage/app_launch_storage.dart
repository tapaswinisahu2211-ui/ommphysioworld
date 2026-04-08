import 'package:shared_preferences/shared_preferences.dart';

abstract class AppLaunchStorage {
  Future<bool> shouldShowOnboarding();

  Future<void> setOnboardingSeen();
}

class SharedPrefsLaunchStorage implements AppLaunchStorage {
  SharedPrefsLaunchStorage(this._preferences);

  static const _onboardingKey = 'has_seen_onboarding';

  final SharedPreferences _preferences;

  @override
  Future<bool> shouldShowOnboarding() async {
    return !(_preferences.getBool(_onboardingKey) ?? false);
  }

  @override
  Future<void> setOnboardingSeen() async {
    await _preferences.setBool(_onboardingKey, true);
  }
}

class MemoryLaunchStorage implements AppLaunchStorage {
  MemoryLaunchStorage({
    this.hasSeenOnboarding = false,
  });

  bool hasSeenOnboarding;

  @override
  Future<bool> shouldShowOnboarding() async {
    return !hasSeenOnboarding;
  }

  @override
  Future<void> setOnboardingSeen() async {
    hasSeenOnboarding = true;
  }
}
