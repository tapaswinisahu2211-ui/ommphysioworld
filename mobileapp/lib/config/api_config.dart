class ApiConfig {
  const ApiConfig._();

  static const String defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://ommphysioworld.com/api',
  );
}
