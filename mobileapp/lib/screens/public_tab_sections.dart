import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:omphysioworld/screens/api_settings_screen.dart';
import 'package:omphysioworld/services/app_api_service.dart';
import 'package:omphysioworld/utils/form_validators.dart';

class WebsiteHomeTab extends StatelessWidget {
  const WebsiteHomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
      children: const [
        _HeroCard(
          eyebrow: 'Modern physiotherapy care for everyday movement',
          title: 'Relief that starts with the right movement plan.',
          body:
              'Personalized recovery programs for pain management, posture correction, and confident daily mobility at OmmPhysio World.',
          chips: [
            'Dr. Tapaswini Sahu',
            'Baripada, Odisha',
            'Same-week appointments',
          ],
        ),
        SizedBox(height: 16),
        _AccentInfoCard(
          title: 'Clinic Focus',
          body:
              'Pain relief, rehabilitation, posture support, and guided recovery in a calmer patient-first environment.',
        ),
        SizedBox(height: 16),
        _SectionTitle(
          eyebrow: 'What We Do',
          title: 'Care designed around movement and recovery',
        ),
        SizedBox(height: 12),
        _InfoCard(
          title: 'Pain Management',
          body:
              'Targeted treatment plans for back pain, neck stiffness, joint issues, and recurring discomfort.',
          icon: Icons.healing_rounded,
        ),
        SizedBox(height: 12),
        _InfoCard(
          title: 'Post Injury Rehab',
          body:
              'Structured recovery programs to restore mobility, strength, and confidence after injury.',
          icon: Icons.accessibility_new_rounded,
        ),
        SizedBox(height: 12),
        _InfoCard(
          title: 'Posture Correction',
          body:
              'Modern physiotherapy support for office posture, muscle imbalance, and movement quality.',
          icon: Icons.self_improvement_rounded,
        ),
        SizedBox(height: 16),
        _DoctorCard(),
      ],
    );
  }
}

class WebsiteAboutTab extends StatelessWidget {
  const WebsiteAboutTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
      children: const [
        _SectionTitle(
          eyebrow: 'About OmmPhysio World',
          title: 'Recovery care that feels calm, modern, and deeply personal.',
        ),
        SizedBox(height: 12),
        _AccentInfoCard(
          title: 'Patient-first recovery care',
          body:
              'We support patients with physiotherapy care that blends expert treatment, honest guidance, and a reassuring environment.',
        ),
        SizedBox(height: 16),
        _MetricRow(
          items: [
            _MetricData('12+', 'Years of care'),
            _MetricData('500+', 'Guided plans'),
            _MetricData('High', 'Patient trust'),
          ],
        ),
        SizedBox(height: 16),
        _InfoCard(
          title: 'Compassionate Care',
          body:
              'We focus on listening carefully and creating treatment journeys that feel human, clear, and encouraging.',
          icon: Icons.favorite_rounded,
        ),
        SizedBox(height: 12),
        _InfoCard(
          title: 'Clinical Precision',
          body:
              'Every therapy plan is shaped around patient condition, movement goals, and practical day-to-day improvement.',
          icon: Icons.verified_rounded,
        ),
        SizedBox(height: 12),
        _InfoCard(
          title: 'Trusted Guidance',
          body:
              'We aim to be a long-term recovery partner, not just a quick appointment provider.',
          icon: Icons.handshake_rounded,
        ),
        SizedBox(height: 16),
        _DoctorCard(),
      ],
    );
  }
}

class WebsiteServicesTab extends StatefulWidget {
  const WebsiteServicesTab({super.key});

  @override
  State<WebsiteServicesTab> createState() => _WebsiteServicesTabState();
}

class _WebsiteServicesTabState extends State<WebsiteServicesTab> {
  final _apiService = AppApiService();
  List<Map<String, dynamic>> _services = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    try {
      final services = await _apiService.getServices();
      if (!mounted) {
        return;
      }
      setState(() {
        _services = services;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _services = [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
      children: [
        const _SectionTitle(
          eyebrow: 'Services',
          title:
              'Complete physiotherapy services presented in a practical, patient-friendly way.',
        ),
        const SizedBox(height: 12),
        const _AccentInfoCard(
          title: 'Complete care',
          body:
              'Our care covers pain relief, rehabilitation, posture correction, strength recovery, mobility improvement, and specialty physiotherapy support across different stages of life.',
        ),
        const SizedBox(height: 16),
        const _InfoCard(
          title: 'Orthopedic Physiotherapy',
          body:
              'Care for joint pain, fractures, stiffness, ligament issues, and musculoskeletal recovery.',
          icon: Icons.accessibility_rounded,
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Sports Rehabilitation',
          body:
              'Performance-focused therapy for injury recovery, strengthening, mobility, and return to sport.',
          icon: Icons.sports_handball_rounded,
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Posture And Spine Care',
          body:
              'Support for neck pain, back pain, posture correction, and workstation-related strain.',
          icon: Icons.airline_seat_recline_normal_rounded,
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Pain Relief Therapy',
          body:
              'Hands-on and exercise-based therapy to reduce pain and improve day-to-day movement quality.',
          icon: Icons.healing_rounded,
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Neurological Physiotherapy',
          body:
              'Balance, coordination, gait, and functional support for neurological recovery needs.',
          icon: Icons.psychology_rounded,
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Manual Therapy',
          body:
              'Hands-on joint and soft tissue techniques to ease stiffness, improve range, and relieve tension.',
          icon: Icons.back_hand_rounded,
        ),
        const SizedBox(height: 16),
        if (_isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: CircularProgressIndicator(),
            ),
          )
        else if (_services.isNotEmpty)
          _ServiceCatalogCard(services: _services),
        const SizedBox(height: 16),
        const _BulletGroupCard(
          title: 'Rehabilitation And Recovery',
          items: [
            'Pre and Post Operative Rehab',
            'Joint and Bone Rehabilitation',
            'Exercise Therapy',
            'Balance and Gait Training',
          ],
        ),
        const SizedBox(height: 12),
        const _BulletGroupCard(
          title: 'Specialized Physiotherapy',
          items: [
            'Pediatric Physiotherapy',
            'Geriatric Physiotherapy',
            'Women\'s Health Physiotherapy',
            'Dry Needling and Trigger Point Care',
          ],
        ),
        const SizedBox(height: 12),
        const _BulletGroupCard(
          title: 'Supportive Treatment Options',
          items: [
            'Electrotherapy',
            'Pain Management',
            'Mobility And Strength Programs',
            'Functional Movement Training',
          ],
        ),
      ],
    );
  }
}

class WebsiteCareerTab extends StatefulWidget {
  const WebsiteCareerTab({super.key});

  @override
  State<WebsiteCareerTab> createState() => _WebsiteCareerTabState();
}

class _WebsiteCareerTabState extends State<WebsiteCareerTab> {
  final _apiService = AppApiService();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _roleController = TextEditingController();
  final _experienceController = TextEditingController();
  final _messageController = TextEditingController();

  AppUploadFile? _resume;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _roleController.dispose();
    _experienceController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _pickResume() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      withData: true,
      allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    );

    final file = result?.files.single;
    if (file == null || file.bytes == null) {
      return;
    }

    setState(() {
      _resume = AppUploadFile(
        name: file.name,
        bytes: file.bytes!,
      );
    });
  }

  Future<void> _submitApplication() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final role = _roleController.text.trim();
    final experience = _experienceController.text.trim();
    final message = _messageController.text.trim();

    if (name.isEmpty ||
        role.isEmpty ||
        experience.isEmpty ||
        FormValidators.email(email) != null ||
        FormValidators.phone(phone) != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete the application details correctly.'),
        ),
      );
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _isSubmitting = true;
    });

    try {
      final response = await _apiService.submitStaffApplication(
        name: name,
        email: email.toLowerCase(),
        phone: FormValidators.cleanPhone(phone),
        role: role,
        experience: experience,
        message: message,
        resume: _resume,
      );

      if (!mounted) {
        return;
      }

      _nameController.clear();
      _emailController.clear();
      _phoneController.clear();
      _roleController.clear();
      _experienceController.clear();
      _messageController.clear();
      setState(() {
        _resume = null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            response['message']?.toString() ??
                'Your staff application has been sent successfully.',
          ),
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Unable to connect to the local server. Please check that it is running.',
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
      children: [
        const _SectionTitle(
          eyebrow: 'Career',
          title: 'Join our staff and grow with a patient-first physiotherapy team.',
        ),
        const SizedBox(height: 12),
        const _AccentInfoCard(
          title: 'Why apply here',
          body:
              'Whether you are applying for therapist, receptionist, assistant, or support staff roles, you can share your details and the clinic can review your application.',
        ),
        const SizedBox(height: 16),
        const _BulletGroupCard(
          title: 'Career Highlights',
          items: [
            'Apply directly to OPW',
            'Send your resume and role interest in one step',
            'Applications are delivered to the clinic inbox',
          ],
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Direct Review',
          body:
              'Applications are saved and also sent to the clinic email for faster follow-up.',
          icon: Icons.send_rounded,
        ),
        const SizedBox(height: 12),
        const _BulletGroupCard(
          title: 'Typical Roles',
          items: [
            'Physiotherapist',
            'Receptionist',
            'Assistant',
            'Support Staff',
          ],
        ),
        const SizedBox(height: 16),
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
                'Staff Application Form',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: const Color(0xFF0F172A),
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Fill in your details and tell us which role you want to apply for.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF64748B),
                      height: 1.55,
                    ),
              ),
              const SizedBox(height: 18),
              _FormField(
                controller: _nameController,
                label: 'Full Name',
                hint: 'Enter your full name',
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _emailController,
                label: 'Email Address',
                hint: 'Enter your email address',
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _phoneController,
                label: 'Phone Number',
                hint: 'Enter your phone number',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _roleController,
                label: 'Role You Are Applying For',
                hint: 'Physiotherapist / Receptionist / Assistant',
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _experienceController,
                label: 'Years of Experience',
                hint: 'Enter your experience',
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _messageController,
                label: 'Tell us about your skills, background, or availability',
                hint: 'Share a short message',
                maxLines: 5,
              ),
              const SizedBox(height: 14),
              _UploadActionCard(
                title: 'Upload Resume',
                body:
                    _resume == null
                        ? 'You can upload a resume in PDF, DOC, DOCX, or image format.'
                        : _resume!.name,
                buttonLabel: _resume == null ? 'Choose file' : 'Change file',
                onTap: _pickResume,
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _isSubmitting ? null : _submitApplication,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF38BDF8),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Apply Now'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class WebsiteAppointmentTab extends StatefulWidget {
  const WebsiteAppointmentTab({super.key});

  @override
  State<WebsiteAppointmentTab> createState() => _WebsiteAppointmentTabState();
}

class _WebsiteAppointmentTabState extends State<WebsiteAppointmentTab> {
  final _apiService = AppApiService();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _messageController = TextEditingController();
  DateTime? _selectedDate;
  List<Map<String, dynamic>> _services = [];
  String _selectedService = '';
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadServices() async {
    try {
      final services = await _apiService.getServices();
      if (!mounted) {
        return;
      }
      setState(() {
        _services = services;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _services = [];
      });
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? now,
      firstDate: now,
      lastDate: DateTime(now.year + 2),
    );

    if (picked == null) {
      return;
    }

    setState(() {
      _selectedDate = picked;
    });
  }

  Future<void> _submitForm() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final service = _selectedService.trim();
    final message = _messageController.text.trim();

    if (name.isEmpty ||
        email.isEmpty ||
        phone.isEmpty ||
        service.isEmpty ||
        _selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete the required appointment details.'),
        ),
      );
      return;
    }

    final emailError = FormValidators.email(email);
    if (emailError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(emailError)),
      );
      return;
    }

    final phoneError = FormValidators.phone(phone);
    if (phoneError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(phoneError)),
      );
      return;
    }

    if (FormValidators.isPastDate(_selectedDate!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Preferred appointment date cannot be in the past.')),
      );
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _isSubmitting = true;
    });

    try {
      final response = await _apiService.submitAppointment(
        name: name,
        email: email.toLowerCase(),
        phone: FormValidators.cleanPhone(phone),
        service: service,
        date: _formatApiDate(_selectedDate!),
        message: message,
      );

      if (!mounted) {
        return;
      }

      _nameController.clear();
      _emailController.clear();
      _phoneController.clear();
      _messageController.clear();
      setState(() {
        _selectedDate = null;
        _selectedService = '';
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            response['message']?.toString() ??
                'Appointment request submitted successfully.',
          ),
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } catch (_) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Unable to connect to the local server. Please check that it is running.',
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  String _formatApiDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
      children: [
        const _SectionTitle(
          eyebrow: 'Book Appointment',
          title: 'Start your recovery journey with a calm, simple booking flow.',
        ),
        const SizedBox(height: 12),
        const _AccentInfoCard(
          title: 'Appointment flow',
          body:
              'Fill in your details and preferred service. OPW will review your appointment request.',
        ),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const ApiSettingsScreen(),
                ),
              );
            },
            icon: const Icon(Icons.settings_ethernet_rounded),
            label: const Text('Server settings'),
          ),
        ),
        const SizedBox(height: 16),
        const _BulletGroupCard(
          title: 'Booking Benefits',
          items: [
            'Quick appointment request flow',
            'Friendly follow-up confirmation',
            'Easy service and date selection',
          ],
        ),
        const SizedBox(height: 16),
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
                'Appointment Request Form',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: const Color(0xFF0F172A),
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Share your details and preferred service for OPW review.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF64748B),
                      height: 1.55,
                    ),
              ),
              const SizedBox(height: 18),
              _FormField(
                controller: _nameController,
                label: 'Full Name',
                hint: 'Enter your full name',
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _emailController,
                label: 'Email Address',
                hint: 'Enter your email address',
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _phoneController,
                label: 'Phone Number',
                hint: 'Enter your phone number',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                value: _selectedService.isEmpty ? null : _selectedService,
                isExpanded: true,
                decoration: const InputDecoration(
                  labelText: 'Service Needed',
                  prefixIcon: Icon(Icons.medical_services_rounded),
                ),
                items: _services
                    .map(
                      (service) => DropdownMenuItem<String>(
                        value: service['name']?.toString() ?? '',
                        child: Text(
                          service['name']?.toString() ?? '',
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                    )
                    .toList(),
                selectedItemBuilder: (context) {
                  return _services.map((service) {
                    return Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        service['name']?.toString() ?? '',
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    );
                  }).toList();
                },
                onChanged: (value) {
                  setState(() {
                    _selectedService = value ?? '';
                  });
                },
              ),
              const SizedBox(height: 14),
              _PickerField(
                label: 'Preferred Date',
                value: _selectedDate == null
                    ? 'Select appointment date'
                    : '${_selectedDate!.day.toString().padLeft(2, '0')}/${_selectedDate!.month.toString().padLeft(2, '0')}/${_selectedDate!.year}',
                onTap: _pickDate,
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _messageController,
                label: 'Tell us about your pain, injury, or concern',
                hint: 'Write a short message',
                maxLines: 5,
              ),
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 40,
                      width: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE0F2FE),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.upload_file_rounded,
                        color: Color(0xFF2563EB),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Upload Image or PDF',
                            style:
                                Theme.of(context).textTheme.titleSmall?.copyWith(
                                      color: const Color(0xFF0F172A),
                                      fontWeight: FontWeight.w700,
                                    ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Prescription, report, scan, or related image attachment can be connected here next.',
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: const Color(0xFF64748B),
                                      height: 1.5,
                                    ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _isSubmitting ? null : _submitForm,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF38BDF8),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Submit Request'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Flexible Timing',
          body: 'Choose a date that works for your visit.',
          icon: Icons.calendar_today_rounded,
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Direct Email Delivery',
          body: 'Your request goes straight to the clinic inbox.',
          icon: Icons.mark_email_read_rounded,
        ),
      ],
    );
  }
}

class WebsiteContactTab extends StatelessWidget {
  const WebsiteContactTab({super.key});

  Future<void> _openMaps(BuildContext context) async {
    final uri = Uri.parse('https://maps.app.goo.gl/Ph78XSeNRtXFNKpE9');
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);

    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open Google Maps right now.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
      children: [
        const _SectionTitle(
          eyebrow: 'Contact',
          title: 'Reach the clinic easily and plan your visit with confidence.',
        ),
        const SizedBox(height: 12),
        const _AccentInfoCard(
          title: 'Need directions?',
          body:
              'Use the map or open the exact clinic area in Google Maps for faster navigation.',
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => _openMaps(context),
            icon: const Icon(Icons.map_rounded),
            label: const Text('Open in Google Maps'),
          ),
        ),
        const SizedBox(height: 16),
        const _InfoCard(
          title: 'Clinic Address',
          body: 'City clinic road, near davaindia, Baripada',
          icon: Icons.location_on_rounded,
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Contact Details',
          body: '+91 88955 55519 / contact@ommphysioworld.com',
          icon: Icons.call_rounded,
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Doctor',
          body: 'Dr. Tapaswini Sahu',
          icon: Icons.medical_information_rounded,
        ),
        const SizedBox(height: 12),
        const _InfoCard(
          title: 'Working Hours',
          body: 'Monday to Saturday, 9:00 AM to 7:00 PM',
          icon: Icons.schedule_rounded,
        ),
        const SizedBox(height: 16),
        const _SocialMediaButtons(),
        const SizedBox(height: 16),
        const _ContactFormCard(),
        const SizedBox(height: 16),
        const _AccentInfoCard(
          title: 'Find us',
          body:
              'Reach out for service guidance, clinic timings, or visit planning. Your message goes directly to the OPW team.',
        ),
      ],
    );
  }
}

class WebsiteFaqTab extends StatefulWidget {
  const WebsiteFaqTab({super.key});

  @override
  State<WebsiteFaqTab> createState() => _WebsiteFaqTabState();
}

class _WebsiteFaqTabState extends State<WebsiteFaqTab> {
  final _searchController = TextEditingController();
  String _query = '';

  static const _items = [
    _FaqItem(
      category: 'Pain Relief',
      question: 'Can physiotherapy help with back pain?',
      answer:
          'Yes. Physiotherapy can help many back pain cases by improving mobility, reducing muscle tightness, strengthening support muscles, and correcting posture or movement patterns. The exact plan depends on assessment.',
      keywords: ['back pain', 'low back', 'spine', 'pain relief', 'posture'],
    ),
    _FaqItem(
      category: 'Pain Relief',
      question: 'What should I do for neck stiffness or shoulder pain?',
      answer:
          'Avoid forceful stretching at home. A physiotherapist can check posture, muscle tightness, joint movement, and daily habits, then guide safe exercises and treatment.',
      keywords: ['neck', 'shoulder', 'stiffness', 'office posture', 'cervical'],
    ),
    _FaqItem(
      category: 'Rehab',
      question: 'Do you support post-injury rehabilitation?',
      answer:
          'Yes. OmmPhysio World supports guided rehabilitation after sprain, strain, sports injury, weakness, or mobility restriction. Rehab usually includes pain control, movement retraining, strengthening, and gradual return to activity.',
      keywords: ['injury', 'rehab', 'sports', 'sprain', 'weakness'],
    ),
    _FaqItem(
      category: 'Posture',
      question: 'Can posture correction reduce recurring pain?',
      answer:
          'In many cases, yes. Poor sitting, phone use, work setup, and muscle imbalance can increase strain. We help patients understand posture habits and follow practical correction exercises.',
      keywords: ['posture', 'office', 'desk', 'recurring pain', 'ergonomics'],
    ),
    _FaqItem(
      category: 'Treatment',
      question: 'How many sessions will I need?',
      answer:
          'It depends on the condition, pain duration, strength, mobility, and recovery goal. After assessment, the clinic team can suggest a practical treatment and session plan.',
      keywords: ['session', 'treatment plan', 'how many', 'duration'],
    ),
    _FaqItem(
      category: 'Appointments',
      question: 'How do I book an appointment?',
      answer:
          'Create a patient account, login, and request an appointment from your dashboard. The clinic team can approve or reschedule it, and the update will be visible in your web and mobile account.',
      keywords: ['appointment', 'book', 'reschedule', 'approve', 'login'],
    ),
    _FaqItem(
      category: 'Clinical Notes',
      question: 'Can I share previous doctor notes or reports?',
      answer:
          'Yes. After login, you can add clinical notes and upload PDF or image documents from your dashboard. These documents help the clinic understand your history before planning care.',
      keywords: ['clinical notes', 'report', 'pdf', 'image', 'doctor notes'],
    ),
    _FaqItem(
      category: 'Help',
      question: 'What if I am not sure which service I need?',
      answer:
          'Use Live Chat if a staff member is online, or send a message from the contact form. You can briefly describe your pain, duration, and previous treatment so the team can guide the next step.',
      keywords: ['help', 'service', 'live chat', 'contact', 'guidance'],
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<_FaqItem> get _filteredItems {
    final keyword = _query.trim().toLowerCase();
    if (keyword.isEmpty) {
      return _items;
    }

    return _items.where((item) {
      return [
        item.category,
        item.question,
        item.answer,
        ...item.keywords,
      ].join(' ').toLowerCase().contains(keyword);
    }).toList();
  }

  void _setQuery(String value) {
    _searchController.text = value;
    _searchController.selection = TextSelection.collapsed(offset: value.length);
    setState(() {
      _query = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    final items = _filteredItems;

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
      children: [
        const _SectionTitle(
          eyebrow: 'FAQ',
          title: 'Learn about your pain, recovery, and how to get help.',
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF07111F), Color(0xFF1D4ED8), Color(0xFF38BDF8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(30),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1A1D4ED8),
                blurRadius: 24,
                offset: Offset(0, 14),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Smart FAQ Search',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: const Color(0xFFE0F2FE),
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Search common physiotherapy questions about pain, posture, rehab, notes, appointments, and sessions.',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            height: 1.25,
                          ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${items.length} answers',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _searchController,
                onChanged: (value) => setState(() => _query = value),
                style: const TextStyle(color: Color(0xFF0F172A)),
                decoration: InputDecoration(
                  hintText: 'Ask about pain, rehab, appointment...',
                  prefixIcon: const Icon(Icons.search_rounded),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  'Back pain',
                  'Neck',
                  'Posture',
                  'Reports',
                  'Appointment',
                  'Session',
                  'Clinical notes',
                  'Help',
                ].map((item) {
                  return ActionChip(
                    label: Text(
                      item,
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                    onPressed: () => _setQuery(item),
                    backgroundColor: Colors.white,
                    side: BorderSide(
                      color: const Color(0xFFBFDBFE),
                    ),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    labelPadding: const EdgeInsets.symmetric(horizontal: 4),
                    labelStyle: const TextStyle(
                      color: Color(0xFF1D4ED8),
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.14),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      height: 38,
                      width: 38,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.support_agent_rounded,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'If you do not find your answer here, use Live Chat or Contact and OPW will guide you.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: const Color(0xFFE0F2FE),
                              height: 1.5,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (items.isEmpty)
          const _AccentInfoCard(
            title: 'No answer found',
            body:
                'Try a shorter word like pain, posture, report, appointment, or use Contact to message the clinic team.',
          )
        else
          ...items.expand(
            (item) => [
              _FaqCard(item: item),
              const SizedBox(height: 12),
            ],
          ),
        const SizedBox(height: 4),
          const _AccentInfoCard(
            title: 'Need personal guidance?',
            body:
                'Use Live Chat if staff is online, or send your concern from Contact. After login, you can upload doctor notes, request an appointment, and follow OPW updates.',
          ),
      ],
    );
  }
}

class _FaqItem {
  const _FaqItem({
    required this.category,
    required this.question,
    required this.answer,
    required this.keywords,
  });

  final String category;
  final String question;
  final String answer;
  final List<String> keywords;
}

class _ServiceCatalogCard extends StatelessWidget {
  const _ServiceCatalogCard({
    required this.services,
  });

  final List<Map<String, dynamic>> services;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x120F172A),
            blurRadius: 20,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'All OPW Services',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '${services.length} services',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: const Color(0xFF2563EB),
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'The same active service list used for appointment booking is shown here too.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF64748B),
                  height: 1.5,
                ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: services.map((service) {
              final label = service['name']?.toString().trim() ?? '';
              if (label.isEmpty) {
                return const SizedBox.shrink();
              }

              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF334155),
                        fontWeight: FontWeight.w700,
                      ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _UploadActionCard extends StatelessWidget {
  const _UploadActionCard({
    required this.title,
    required this.body,
    required this.buttonLabel,
    required this.onTap,
  });

  final String title;
  final String body;
  final String buttonLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 40,
            width: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFE0F2FE),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.upload_file_rounded,
              color: Color(0xFF2563EB),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF64748B),
                        height: 1.5,
                      ),
                ),
                const SizedBox(height: 10),
                TextButton.icon(
                  onPressed: onTap,
                  icon: const Icon(Icons.attach_file_rounded),
                  label: Text(buttonLabel),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FaqCard extends StatefulWidget {
  const _FaqCard({required this.item});

  final _FaqItem item;

  @override
  State<_FaqCard> createState() => _FaqCardState();
}

class _FaqCardState extends State<_FaqCard> {
  bool _isOpen = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOut,
      decoration: BoxDecoration(
        gradient: _isOpen
            ? const LinearGradient(
                colors: [Color(0xFFFFFFFF), Color(0xFFF8FBFF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        color: _isOpen ? null : Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: _isOpen ? const Color(0xFFBAE6FD) : const Color(0xFFE2E8F0),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F0F172A),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => setState(() => _isOpen = !_isOpen),
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFE0F2FE),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                widget.item.category,
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(
                                      color: const Color(0xFF2563EB),
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'Tap to ${_isOpen ? 'hide' : 'view'} answer',
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: const Color(0xFF94A3B8),
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              widget.item.question,
                              style:
                                  Theme.of(context).textTheme.titleMedium?.copyWith(
                                        color: const Color(0xFF0F172A),
                                        fontWeight: FontWeight.w800,
                                      ),
                            ),
                          ],
                        ),
                      ),
                      AnimatedRotation(
                        turns: _isOpen ? 0.5 : 0,
                        duration: const Duration(milliseconds: 180),
                        curve: Curves.easeOut,
                        child: Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: _isOpen
                              ? const Color(0xFF2563EB)
                              : const Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                  AnimatedCrossFade(
                    firstChild: const SizedBox.shrink(),
                    secondChild: Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Text(
                          widget.item.answer,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF475569),
                                height: 1.6,
                              ),
                        ),
                      ),
                    ),
                    crossFadeState: _isOpen
                        ? CrossFadeState.showSecond
                        : CrossFadeState.showFirst,
                    duration: const Duration(milliseconds: 180),
                    sizeCurve: Curves.easeOut,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SocialMediaButtons extends StatelessWidget {
  const _SocialMediaButtons();

  static const _links = [
    _SocialLink(
      label: 'WhatsApp',
      url: 'https://wa.me/918895555519',
      badge: 'WA',
      color: Color(0xFF16A34A),
    ),
    _SocialLink(
      label: 'Call',
      url: 'tel:+918895555519',
      badge: 'Call',
      color: Color(0xFF0284C7),
    ),
    _SocialLink(
      label: 'Email',
      url: 'mailto:contact@ommphysioworld.com',
      badge: 'Mail',
      color: Color(0xFF475569),
    ),
  ];

  Future<void> _openLink(BuildContext context, String url) async {
    final uri = Uri.parse(url);
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);

    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open this link right now.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F0F172A),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Social Media',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Connect quickly through call, WhatsApp, email, or social channels.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF64748B),
                  height: 1.45,
                ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _links.map((link) {
              return InkWell(
                borderRadius: BorderRadius.circular(999),
                onTap: () => _openLink(context, link.url),
                child: Ink(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 9,
                  ),
                  decoration: BoxDecoration(
                    color: link.color.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: link.color.withValues(alpha: 0.24),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        height: 26,
                        constraints: const BoxConstraints(minWidth: 26),
                        alignment: Alignment.center,
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        decoration: BoxDecoration(
                          color: link.color,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          link.badge,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        link.label,
                        style: TextStyle(
                          color: link.color,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _SocialLink {
  const _SocialLink({
    required this.label,
    required this.url,
    required this.badge,
    required this.color,
  });

  final String label;
  final String url;
  final String badge;
  final Color color;
}

class _ContactFormCard extends StatefulWidget {
  const _ContactFormCard();

  @override
  State<_ContactFormCard> createState() => _ContactFormCardState();
}

class _ContactFormCardState extends State<_ContactFormCard> {
  final _apiService = AppApiService();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submitContact() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final message = _messageController.text.trim();

    if (name.isEmpty || message.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your name and message.')),
      );
      return;
    }

    final emailError = FormValidators.email(email, required: false);
    if (emailError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(emailError)),
      );
      return;
    }

    final phoneError = FormValidators.phone(phone, required: false);
    if (phoneError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(phoneError)),
      );
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _isSubmitting = true;
    });

    try {
      final response = await _apiService.submitContactMessage(
        name: name,
        email: email.toLowerCase(),
        phone: FormValidators.cleanPhone(phone),
        subject: _subjectController.text.trim().isEmpty
            ? 'Mobile contact request'
            : _subjectController.text.trim(),
        message: message,
      );

      if (!mounted) {
        return;
      }

      _nameController.clear();
      _emailController.clear();
      _phoneController.clear();
      _subjectController.clear();
      _messageController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            response['message']?.toString() ??
                'Your message has been sent to the clinic team.',
          ),
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } catch (_) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unable to send contact message right now.'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x120F172A),
            blurRadius: 20,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Contact Form',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Send a message to the clinic team. We will respond through phone, email, or chat.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF64748B),
                  height: 1.55,
                ),
          ),
          const SizedBox(height: 18),
          _FormField(
            controller: _nameController,
            label: 'Full Name',
            hint: 'Enter your name',
          ),
          const SizedBox(height: 14),
          _FormField(
            controller: _emailController,
            label: 'Email Address',
            hint: 'Enter your email',
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 14),
          _FormField(
            controller: _phoneController,
            label: 'Phone Number',
            hint: 'Enter your phone number',
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 14),
          _FormField(
            controller: _subjectController,
            label: 'Subject',
            hint: 'How can we help?',
          ),
          const SizedBox(height: 14),
          _FormField(
            controller: _messageController,
            label: 'Message',
            hint: 'Write your message',
            maxLines: 5,
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _isSubmitting ? null : _submitContact,
              icon: _isSubmitting
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.send_rounded),
              label: Text(_isSubmitting ? 'Sending...' : 'Send Message'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.eyebrow,
    required this.title,
  });

  final String eyebrow;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFE0F2FE),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            eyebrow.toUpperCase(),
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: const Color(0xFF2563EB),
                  letterSpacing: 1.0,
                  fontWeight: FontWeight.w800,
                ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.w800,
                height: 1.15,
              ),
        ),
      ],
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.eyebrow,
    required this.title,
    required this.body,
    required this.chips,
  });

  final String eyebrow;
  final String title;
  final String body;
  final List<String> chips;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(26),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF081124),
            Color(0xFF1D4ED8),
            Color(0xFF38BDF8),
            Color(0xFF7DD3FC),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(30),
        boxShadow: const [
          BoxShadow(
            color: Color(0x2238BDF8),
            blurRadius: 34,
            offset: Offset(0, 18),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  eyebrow.toUpperCase(),
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: Colors.white,
                        letterSpacing: 1.0,
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Icon(
                  Icons.waves_rounded,
                  size: 18,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  height: 1.1,
                ),
          ),
          const SizedBox(height: 12),
          Text(
            body,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: const Color(0xFFEFF6FF),
                  height: 1.6,
                ),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: chips
                .map(
                  (chip) => Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      chip,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _AccentInfoCard extends StatelessWidget {
  const _AccentInfoCard({
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF0F172A),
            Color(0xFF1E293B),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(26),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 22,
            offset: Offset(0, 14),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 42,
            width: 42,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 10),
          Text(
            body,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFFE0F2FE),
                  height: 1.6,
                ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.title,
    required this.body,
    required this.icon,
  });

  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x120F172A),
            blurRadius: 20,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 52,
            width: 52,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [
                  Color(0xFFE0F2FE),
                  Color(0xFFBFDBFE),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(
              icon,
              color: const Color(0xFF2563EB),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  body,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF475569),
                        height: 1.6,
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

class _DoctorCard extends StatelessWidget {
  const _DoctorCard();

  @override
  Widget build(BuildContext context) {
    return const _InfoCard(
      title: 'Lead Doctor',
      body:
          'Dr. Tapaswini Sahu guides patient-focused physiotherapy care with a calm and modern recovery approach.',
      icon: Icons.medical_services_rounded,
    );
  }
}

class _MetricRow extends StatelessWidget {
  const _MetricRow({
    required this.items,
  });

  final List<_MetricData> items;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: items
          .map(
            (item) => Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  right: item == items.last ? 0 : 12,
                ),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFFFFFFFF),
                        Color(0xFFF8FBFF),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x120F172A),
                        blurRadius: 16,
                        offset: Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.value,
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(
                              color: const Color(0xFF0F172A),
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.label,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _BulletGroupCard extends StatelessWidget {
  const _BulletGroupCard({
    required this.title,
    required this.items,
  });

  final String title;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x120F172A),
            blurRadius: 20,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 14),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 1),
                    height: 24,
                    width: 24,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE0F2FE),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Icon(
                      Icons.check_rounded,
                      size: 15,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      item,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF334155),
                            height: 1.55,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  const _FormField({
    required this.controller,
    required this.label,
    required this.hint,
    this.keyboardType,
    this.maxLines = 1,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final TextInputType? keyboardType;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: maxLines == 1
                ? const Icon(
                    Icons.edit_note_rounded,
                    color: Color(0xFF94A3B8),
                  )
                : null,
          ),
        ),
      ],
    );
  }
}

class _PickerField extends StatelessWidget {
  const _PickerField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Ink(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FBFF),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF334155),
                        ),
                  ),
                ),
                const Icon(
                  Icons.calendar_month_rounded,
                  color: Color(0xFF2563EB),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MetricData {
  const _MetricData(this.value, this.label);

  final String value;
  final String label;
}
