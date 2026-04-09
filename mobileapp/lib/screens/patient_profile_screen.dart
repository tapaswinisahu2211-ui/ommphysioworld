import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import 'package:omphysioworld/services/app_api_service.dart';
import 'package:omphysioworld/storage/patient_session_storage.dart';
import 'package:omphysioworld/utils/form_validators.dart';

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
  final _sessionStorage = PatientSessionStorage();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _mobileController = TextEditingController();
  final _diseaseController = TextEditingController();
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  Map<String, dynamic>? _patient;
  Map<String, dynamic>? _sessionUser;
  String _profileImageUrl = '';
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isUploading = false;
  bool _isChangingPassword = false;

  String get _patientId => widget.user['patientId']?.toString() ?? '';

  @override
  void initState() {
    super.initState();
    _sessionUser = Map<String, dynamic>.from(widget.user);
    _loadPatient();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _mobileController.dispose();
    _diseaseController.dispose();
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _showMessage(String message) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  String _createdFromLabel(String value) {
    switch (value.trim()) {
      case 'mobile_app':
        return 'Mobile App';
      case 'website':
        return 'Website';
      default:
        return 'Admin';
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

  void _applyPatient(Map<String, dynamic> patient) {
    _patient = patient;
    _nameController.text = patient['name']?.toString() ?? '';
    _emailController.text = patient['email']?.toString() ?? '';
    _mobileController.text = patient['mobile']?.toString() ?? '';
    _diseaseController.text = patient['disease']?.toString() ?? '';
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
        _applyPatient(patient);
        _profileImageUrl = profileImageUrl;
      });
    } on ApiException catch (error) {
      _showMessage(error.message);
    } catch (_) {
      _showMessage('Unable to load your profile right now.');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _saveProfile() async {
    if (_patientId.isEmpty) {
      _showMessage('Patient profile link is missing. Please login again.');
      return;
    }

    final name = _nameController.text.trim();
    final mobile = _mobileController.text.trim();
    final disease = _diseaseController.text.trim();

    if (name.isEmpty) {
      _showMessage('Full name is required.');
      return;
    }

    if (name.length < 2) {
      _showMessage('Full name must be at least 2 characters.');
      return;
    }

    final phoneError = FormValidators.phone(mobile);
    if (phoneError != null) {
      _showMessage(phoneError);
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final patient = await _apiService.updatePatientProfile(
        patientId: _patientId,
        name: name,
        mobile: FormValidators.cleanPhone(mobile),
        disease: disease,
      );
      final profileImageUrl = await _resolveProfileImageUrl(patient);

      final nextUser = {
        ...?_sessionUser,
        'name': patient['name'],
        'email': patient['email'],
        'mobile': patient['mobile'],
        'patientId': patient['id'],
        'createdFrom': patient['createdFrom'],
      };
      await _sessionStorage.savePatientUser(nextUser);

      if (!mounted) {
        return;
      }

      setState(() {
        _sessionUser = nextUser;
        _applyPatient(patient);
        _profileImageUrl = profileImageUrl;
      });
      _showMessage('Profile updated successfully.');
    } on ApiException catch (error) {
      _showMessage(error.message);
    } catch (_) {
      _showMessage('Unable to update your profile right now.');
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  Future<void> _changePassword() async {
    final oldPassword = _oldPasswordController.text.trim();
    final newPassword = _newPasswordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (oldPassword.isEmpty || newPassword.isEmpty || confirmPassword.isEmpty) {
      _showMessage('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      _showMessage('New password must be at least 6 characters.');
      return;
    }

    if (newPassword != confirmPassword) {
      _showMessage('New password and confirm password must match.');
      return;
    }

    setState(() {
      _isChangingPassword = true;
    });

    try {
      final response = await _apiService.changePassword(
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      _oldPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
      _showMessage(
        response['message']?.toString() ??
            'Password changed successfully. The updated password has been sent to your email.',
      );
    } on ApiException catch (error) {
      _showMessage(error.message);
    } catch (_) {
      _showMessage('Unable to change your password right now.');
    } finally {
      if (mounted) {
        setState(() {
          _isChangingPassword = false;
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
        _applyPatient(patient);
        _profileImageUrl = profileImageUrl;
      });
      _showMessage('Profile image updated.');
    } on ApiException catch (error) {
      _showMessage(error.message);
    } catch (_) {
      _showMessage('Unable to upload profile image.');
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final patient = _patient;
    final createdFrom = _createdFromLabel(
      patient?['createdFrom']?.toString() ??
          _sessionUser?['createdFrom']?.toString() ??
          'mobile_app',
    );
    final displayName = patient?['name']?.toString() ??
        _sessionUser?['name']?.toString() ??
        'Patient';
    final displayEmail = patient?['email']?.toString() ??
        _sessionUser?['email']?.toString() ??
        '';

    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFFF5F9FF),
        surfaceTintColor: const Color(0xFFF5F9FF),
        foregroundColor: const Color(0xFF0F172A),
        title: const Text('Profile'),
      ),
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
            top: false,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
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
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x1A2563EB),
                        blurRadius: 26,
                        offset: Offset(0, 18),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      _ProfileAvatar(
                        name: displayName,
                        imageUrl: _profileImageUrl,
                        isUploading: _isUploading,
                        onUpload: _pickAndUploadProfileImage,
                      ),
                      const SizedBox(width: 16),
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
                              displayName,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              displayEmail.isEmpty ? 'Email not added' : displayEmail,
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
                const SizedBox(height: 18),
                if (_isLoading)
                  const _ProfileInfoCard(
                    icon: Icons.sync_rounded,
                    title: 'Loading Profile',
                    subtitle: 'Fetching your patient details from OPW records.',
                  )
                else ...[
                  _ProfileInfoCard(
                    icon: Icons.badge_rounded,
                    title: 'My Details',
                    subtitle: 'Update your basic profile details here.',
                    children: [
                      _ProfileEditableField(
                        controller: _nameController,
                        label: 'Full Name',
                        icon: Icons.person_rounded,
                      ),
                      _ProfileEditableField(
                        controller: _emailController,
                        label: 'Email Address',
                        icon: Icons.alternate_email_rounded,
                        enabled: false,
                      ),
                      _ProfileEditableField(
                        controller: _mobileController,
                        label: 'Mobile Number',
                        icon: Icons.call_rounded,
                        keyboardType: TextInputType.phone,
                      ),
                      _ProfileEditableField(
                        controller: _diseaseController,
                        label: 'Disease / Concern',
                        icon: Icons.healing_rounded,
                      ),
                      _StaticInfoTile(
                        icon: Icons.device_hub_rounded,
                        label: 'Created From',
                        value: createdFrom,
                      ),
                      _StaticInfoTile(
                        icon: Icons.event_available_rounded,
                        label: 'Joined',
                        value: _formatDate(patient?['createdAt']),
                      ),
                      FilledButton(
                        onPressed: _isSaving ? null : _saveProfile,
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
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
                            : const Text('Save Profile'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _ProfileInfoCard(
                    icon: Icons.lock_reset_rounded,
                    title: 'Change Password',
                    subtitle:
                        'Enter your old password, set a new one, and OPW will also send it to your email.',
                    children: [
                      _ProfileEditableField(
                        controller: _oldPasswordController,
                        label: 'Old Password',
                        icon: Icons.lock_outline_rounded,
                        obscureText: true,
                      ),
                      _ProfileEditableField(
                        controller: _newPasswordController,
                        label: 'New Password',
                        icon: Icons.lock_rounded,
                        obscureText: true,
                      ),
                      _ProfileEditableField(
                        controller: _confirmPasswordController,
                        label: 'Confirm New Password',
                        icon: Icons.verified_user_rounded,
                        obscureText: true,
                      ),
                      FilledButton(
                        onPressed: _isChangingPassword ? null : _changePassword,
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _isChangingPassword
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Change Password'),
                      ),
                    ],
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
          height: 100,
          width: 100,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(28),
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
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
              ),
              child: isUploading
                  ? const Padding(
                      padding: EdgeInsets.all(11),
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
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF64748B),
                        height: 1.5,
                      ),
                    ),
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

class _ProfileEditableField extends StatelessWidget {
  const _ProfileEditableField({
    required this.controller,
    required this.label,
    required this.icon,
    this.enabled = true,
    this.obscureText = false,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final bool enabled;
  final bool obscureText;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        enabled: enabled,
        obscureText: obscureText,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
          filled: true,
          fillColor: enabled ? const Color(0xFFF8FBFF) : const Color(0xFFF1F5F9),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          disabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
        ),
      ),
    );
  }
}

class _StaticInfoTile extends StatelessWidget {
  const _StaticInfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBFF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF2563EB)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
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
