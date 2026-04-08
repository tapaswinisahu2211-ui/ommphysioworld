import 'package:flutter/material.dart';

import 'package:omphysioworld/config/api_config.dart';
import 'package:omphysioworld/services/app_api_service.dart';
import 'package:omphysioworld/storage/api_settings_storage.dart';

class ApiSettingsScreen extends StatefulWidget {
  const ApiSettingsScreen({super.key});

  @override
  State<ApiSettingsScreen> createState() => _ApiSettingsScreenState();
}

class _ApiSettingsScreenState extends State<ApiSettingsScreen> {
  final _apiService = AppApiService();
  final _storage = ApiSettingsStorage();
  final _baseUrlController = TextEditingController();

  bool _isLoading = true;
  bool _isSaving = false;
  bool _isTesting = false;
  String? _savedBaseUrl;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  @override
  void dispose() {
    _baseUrlController.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    final savedBaseUrl = await _storage.getSavedBaseUrl();

    if (!mounted) {
      return;
    }

    _baseUrlController.text = savedBaseUrl ?? ApiConfig.defaultBaseUrl;
    setState(() {
      _savedBaseUrl = savedBaseUrl;
      _isLoading = false;
    });
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  String? _validatedUrl() {
    final candidate = _baseUrlController.text.trim();
    final uri = Uri.tryParse(candidate);

    if (candidate.isEmpty ||
        uri == null ||
        !uri.hasScheme ||
        !candidate.startsWith('http')) {
      return null;
    }

    return candidate;
  }

  Future<void> _saveBaseUrl() async {
    final validatedUrl = _validatedUrl();
    if (validatedUrl == null) {
      _showMessage('Please enter a valid server URL like http://192.168.31.50:5000/api');
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _isSaving = true;
    });

    await _storage.saveBaseUrl(validatedUrl);

    if (!mounted) {
      return;
    }

    setState(() {
      _savedBaseUrl = validatedUrl;
      _isSaving = false;
    });
    _showMessage('Server URL saved. New requests will use this address.');
  }

  Future<void> _resetToDefault() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _isSaving = true;
    });

    await _storage.clearBaseUrl();

    if (!mounted) {
      return;
    }

    _baseUrlController.text = ApiConfig.defaultBaseUrl;
    setState(() {
      _savedBaseUrl = null;
      _isSaving = false;
    });
    _showMessage('Server URL reset to the app default.');
  }

  Future<void> _testConnection() async {
    final validatedUrl = _validatedUrl();
    if (validatedUrl == null) {
      _showMessage('Please enter a valid server URL before testing.');
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _isTesting = true;
    });

    try {
      final response = await _apiService.healthCheck(
        baseUrlOverride: validatedUrl,
      );

      if (!mounted) {
        return;
      }

      _showMessage(
        response['message']?.toString() ?? 'Server connection looks good.',
      );
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      _showMessage(error.message);
    } catch (_) {
      if (!mounted) {
        return;
      }
      _showMessage('Unable to reach the server at this address.');
    } finally {
      if (mounted) {
        setState(() {
          _isTesting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF3FAFF),
      appBar: AppBar(
        title: const Text('Server Settings'),
        backgroundColor: Colors.transparent,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFF2563EB),
                        Color(0xFF38BDF8),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Connect This App To Your Local Server',
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Use your computer IP when testing on a physical phone. You can change it here anytime without rebuilding the app.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFFE0F2FE),
                          height: 1.55,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x120F172A),
                        blurRadius: 18,
                        offset: Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'API Base URL',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: const Color(0xFF0F172A),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Default for this build: ${ApiConfig.defaultBaseUrl}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _baseUrlController,
                        keyboardType: TextInputType.url,
                        decoration: InputDecoration(
                          labelText: 'Server URL',
                          hintText: 'http://192.168.31.50:5000/api',
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(18),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _savedBaseUrl == null
                            ? 'Using app default URL right now.'
                            : 'Saved custom URL: $_savedBaseUrl',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: const Color(0xFF475569),
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _isSaving ? null : _saveBaseUrl,
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF38BDF8),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: _isSaving
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Save Server URL'),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _isTesting ? null : _testConnection,
                              child: _isTesting
                                  ? const SizedBox(
                                      height: 18,
                                      width: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.2,
                                      ),
                                    )
                                  : const Text('Test Connection'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _isSaving ? null : _resetToDefault,
                              child: const Text('Use Default'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
