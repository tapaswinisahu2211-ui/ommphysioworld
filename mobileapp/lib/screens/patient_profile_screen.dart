import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import 'package:omphysioworld/services/app_api_service.dart';

class PatientProfileScreen extends StatefulWidget {
  const PatientProfileScreen({
    super.key,
    required this.user,
  });

  final Map<String, dynamic> user;

  @override
  State<PatientProfileScreen> createState() => _PatientProfileScreenState();
}

class _PatientProfileScreenState extends State<PatientProfileScreen> {
  final _apiService = AppApiService();

  Map<String, dynamic>? _patient;
  String _profileImageUrl = '';
  bool _isLoading = true;
  bool _isUploading = false;

  String get _patientId => widget.user['patientId']?.toString() ?? '';
  String get _fallbackName => widget.user['name']?.toString() ?? 'Patient';
  String get _fallbackEmail => widget.user['email']?.toString() ?? '';
  String get _fallbackMobile => widget.user['mobile']?.toString() ?? '';

  String get _name => _patient?['name']?.toString().trim().isNotEmpty == true
      ? _patient!['name'].toString()
      : _fallbackName;

  String get _email => _patient?['email']?.toString().trim().isNotEmpty == true
      ? _patient!['email'].toString()
      : _fallbackEmail;

  String get _mobile => _patient?['mobile']?.toString().trim().isNotEmpty == true
      ? _patient!['mobile'].toString()
      : _fallbackMobile;

  @override
  void initState() {
    super.initState();
    _loadPatient();
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<String> _resolveProfileImageUrl(Map<String, dynamic> patient) async {
    final rawUrl = patient['profileImageUrl']?.toString() ?? '';
    if (rawUrl.isEmpty) {
      return '';
    }

    final version = patient['profileImageUpdatedAt']?.toString() ?? '';
    final cacheKey = version.isEmpty
        ? DateTime.now().millisecondsSinceEpoch.toString()
        : version;
    final urlWithCache =
        '$rawUrl${rawUrl.contains('?') ? '&' : '?'}v=${Uri.encodeComponent(cacheKey)}';

    return _apiService.resolveResourceUrl(urlWithCache);
  }

  Future<void> _loadPatient() async {
    if (_patientId.isEmpty) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final patient = await _apiService.getPatient(patientId: _patientId);
      final profileImageUrl = await _resolveProfileImageUrl(patient);

      if (!mounted) {
        return;
      }

      setState(() {
        _patient = patient;
        _profileImageUrl = profileImageUrl;
      });
    } catch (_) {
      if (mounted) {
        _showMessage('Unable to load profile right now.');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _pickAndUploadProfileImage() async {
    if (_patientId.isEmpty) {
      _showMessage('Patient profile link is missing. Please login again.');
      return;
    }

    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
      withData: true,
    );

    if (result == null || result.files.isEmpty) {
      return;
    }

    final file = result.files.first;
    final bytes = file.bytes;
    if (bytes == null) {
      _showMessage('Unable to read selected image. Please try again.');
      return;
    }

    setState(() {
      _isUploading = true;
    });

    try {
      final patient = await _apiService.uploadPatientProfileImage(
        patientId: _patientId,
        image: AppUploadFile(
          name: file.name,
          bytes: bytes,
        ),
      );
      final profileImageUrl = await _resolveProfileImageUrl(patient);

      if (!mounted) {
        return;
      }

      setState(() {
        _patient = patient;
        _profileImageUrl = profileImageUrl;
      });
      _showMessage('Profile image updated.');
    } on ApiException catch (error) {
      if (mounted) {
        _showMessage(error.message);
      }
    } catch (_) {
      if (mounted) {
        _showMessage('Unable to upload profile image.');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  String _formatDate(dynamic value) {
    final parsed = DateTime.tryParse(value?.toString() ?? '');
    if (parsed == null) {
      return 'Not available';
    }

    final day = parsed.day.toString().padLeft(2, '0');
    final month = parsed.month.toString().padLeft(2, '0');
    return '$day/$month/${parsed.year}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      body: Stack(
        children: [
          const _ProfileOrb(
            top: -120,
            right: -80,
            size: 260,
            colors: [Color(0x4438BDF8), Color(0x0038BDF8)],
          ),
          const _ProfileOrb(
            bottom: 80,
            left: -130,
            size: 260,
            colors: [Color(0x302563EB), Color(0x002563EB)],
          ),
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
              children: [
                Row(
                  children: [
                    _ProfileRoundButton(
                      icon: Icons.close_rounded,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                    const Spacer(),
                    _ProfileRoundButton(
                      icon: Icons.refresh_rounded,
                      onPressed: _loadPatient,
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFF081124),
                        Color(0xFF1D4ED8),
                        Color(0xFF38BDF8),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(32),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x1A2563EB),
                        blurRadius: 30,
                        offset: Offset(0, 18),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      _ProfileAvatar(
                        name: _name,
                        imageUrl: _profileImageUrl,
                        isUploading: _isUploading,
                        onUpload: _pickAndUploadProfileImage,
                      ),
                      const SizedBox(width: 18),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Patient Profile',
                              style: theme.textTheme.labelLarge?.copyWith(
                                color: const Color(0xFFE0F2FE),
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.1,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _email.isEmpty ? 'Email not added' : _email,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFFE0F2FE),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                if (_isLoading)
                  const _ProfileInfoCard(
                    icon: Icons.sync_rounded,
                    title: 'Loading Profile',
                    subtitle: 'Fetching your patient details from clinic records.',
                  )
                else ...[
                  _ProfileInfoCard(
                    icon: Icons.badge_rounded,
                    title: 'My Details',
                    subtitle: 'Connected with your website and mobile account.',
                    children: [
                      _ProfileDetailTile(
                        icon: Icons.person_rounded,
                        label: 'Name',
                        value: _name,
                      ),
                      _ProfileDetailTile(
                        icon: Icons.alternate_email_rounded,
                        label: 'Email',
                        value: _email.isEmpty ? 'Not added' : _email,
                      ),
                      _ProfileDetailTile(
                        icon: Icons.call_rounded,
                        label: 'Mobile',
                        value: _mobile.isEmpty ? 'Not added' : _mobile,
                      ),
                      _ProfileDetailTile(
                        icon: Icons.healing_rounded,
                        label: 'Disease / Concern',
                        value: (_patient?['disease']?.toString() ?? '').isEmpty
                            ? 'Not added'
                            : _patient!['disease'].toString(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _ProfileInfoCard(
                    icon: Icons.event_available_rounded,
                    title: 'Account Timeline',
                    subtitle:
                        'Joined: ${_formatDate(_patient?['createdAt'])}\nLast updated: ${_formatDate(_patient?['updatedAt'])}',
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({
    required this.name,
    required this.imageUrl,
    required this.isUploading,
    required this.onUpload,
  });

  final String name;
  final String imageUrl;
  final bool isUploading;
  final VoidCallback onUpload;

  @override
  Widget build(BuildContext context) {
    final initial = name.trim().isEmpty ? 'P' : name.trim()[0].toUpperCase();

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          height: 104,
          width: 104,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
          ),
          clipBehavior: Clip.antiAlias,
          child: imageUrl.isEmpty
              ? Center(
                  child: Text(
                    initial,
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                  ),
                )
              : Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Center(
                    child: Text(
                      initial,
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                          ),
                    ),
                  ),
                ),
        ),
        Positioned(
          right: -6,
          bottom: -6,
          child: InkWell(
            onTap: isUploading ? null : onUpload,
            borderRadius: BorderRadius.circular(18),
            child: Ink(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x220F172A),
                    blurRadius: 16,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: isUploading
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(strokeWidth: 2.2),
                    )
                  : const Icon(
                      Icons.photo_camera_rounded,
                      color: Color(0xFF2563EB),
                    ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ProfileInfoCard extends StatelessWidget {
  const _ProfileInfoCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.children = const [],
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x100F172A),
            blurRadius: 22,
            offset: Offset(0, 14),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 48,
                width: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Icon(icon, color: const Color(0xFF2563EB)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    if (subtitle.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        subtitle,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF64748B),
                          height: 1.5,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (children.isNotEmpty) ...[
            const SizedBox(height: 16),
            ...children,
          ],
        ],
      ),
    );
  }
}

class _ProfileDetailTile extends StatelessWidget {
  const _ProfileDetailTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBFF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF2563EB), size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: const Color(0xFF64748B),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: const Color(0xFF0F172A),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileRoundButton extends StatelessWidget {
  const _ProfileRoundButton({
    required this.icon,
    required this.onPressed,
  });

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          height: 48,
          width: 48,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Icon(icon, color: const Color(0xFF0F172A)),
        ),
      ),
    );
  }
}

class _ProfileOrb extends StatelessWidget {
  const _ProfileOrb({
    required this.size,
    required this.colors,
    this.top,
    this.bottom,
    this.left,
    this.right,
  });

  final double size;
  final List<Color> colors;
  final double? top;
  final double? bottom;
  final double? left;
  final double? right;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: IgnorePointer(
        child: Container(
          height: size,
          width: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: colors),
          ),
        ),
      ),
    );
  }
}
