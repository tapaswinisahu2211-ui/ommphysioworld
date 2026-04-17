import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';

import 'package:omphysioworld/screens/patient_chat_panel.dart';
import 'package:omphysioworld/screens/patient_profile_screen.dart';
import 'package:omphysioworld/services/app_api_service.dart';
import 'package:omphysioworld/storage/patient_session_storage.dart';
import 'package:omphysioworld/utils/form_validators.dart';

class PatientDashboardScreen extends StatefulWidget {
  const PatientDashboardScreen({
    super.key,
    required this.user,
  });

  final Map<String, dynamic> user;

  @override
  State<PatientDashboardScreen> createState() => _PatientDashboardScreenState();
}

class _PatientDashboardScreenState extends State<PatientDashboardScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final _apiService = AppApiService();
  final _sessionStorage = PatientSessionStorage();
  final _noteTitleController = TextEditingController();
  final _clinicalNoteController = TextEditingController();
  final _appointmentMessageController = TextEditingController();
  late final TabController _tabController;

  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  Map<String, dynamic>? _patient;
  List<AppUploadFile> _selectedDocuments = [];
  List<Map<String, dynamic>> _appointmentRequests = [];
  List<Map<String, dynamic>> _services = [];
  DateTime? _notificationsSeenAt;
  bool _isLoadingPatient = false;
  bool _isSubmittingNote = false;
  bool _isSubmittingAppointment = false;
  String _selectedService = '';

  String get _name => widget.user['name']?.toString() ?? '';
  String get _email => widget.user['email']?.toString() ?? '';
  String get _mobile => widget.user['mobile']?.toString() ?? '';
  String get _patientId => widget.user['patientId']?.toString() ?? '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _tabController.addListener(() {
      if (mounted) {
        setState(() {});
      }
    });
    _loadNotificationsSeenAt();
    _refreshPatient();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _noteTitleController.dispose();
    _clinicalNoteController.dispose();
    _appointmentMessageController.dispose();
    super.dispose();
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _loadNotificationsSeenAt() async {
    final seenAt = await _sessionStorage.getNotificationsSeenAt(_patientId);
    if (!mounted) {
      return;
    }

    setState(() {
      _notificationsSeenAt = seenAt?.toLocal();
    });
  }

  void _selectDashboardTab(int index) {
    _tabController.animateTo(index);
    Navigator.of(context).pop();
  }

  void _goHome() {
    Navigator.of(context).pop();
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  void _openSideChat() {
    Navigator.of(context).pop();
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _PatientChatScreen(
          visitorName: _name,
          visitorContact: _mobile.isNotEmpty ? _mobile : _email,
        ),
      ),
    );
  }

  void _openProfile() {
    Navigator.of(context).pop();
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => PatientProfileScreen(user: widget.user),
      ),
    );
  }

  Future<void> _logoutPatient() async {
    await _sessionStorage.clearPatientUser();
    if (!mounted) {
      return;
    }

    Navigator.of(context).pop();
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  Future<void> _refreshPatient() async {
    if (_patientId.isEmpty) {
      return;
    }

    setState(() {
      _isLoadingPatient = true;
    });

    try {
      final patient = await _apiService.getPatient(patientId: _patientId);
      final appointmentRequests = await _apiService.getPatientAppointmentRequests(
        patientId: _patientId,
      );
      final services = await _apiService.getServices();

      if (!mounted) {
        return;
      }

      setState(() {
        _patient = patient;
        _appointmentRequests = appointmentRequests;
        _services = services;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      _showMessage('Unable to refresh patient records right now.');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingPatient = false;
        });
      }
    }
  }

  Future<void> _markNotificationsSeen() async {
    final now = DateTime.now();
    await _sessionStorage.saveNotificationsSeenAt(_patientId, now);
    if (!mounted) {
      return;
    }

    setState(() {
      _notificationsSeenAt = now;
    });
  }

  Future<void> _pickClinicalDocuments() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      withData: true,
      type: FileType.custom,
      allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
    );

    if (result == null) {
      return;
    }

    final pickedFiles = result.files
        .where((file) => file.bytes != null)
        .map(
          (file) => AppUploadFile(
            name: file.name,
            bytes: file.bytes!,
          ),
        )
        .toList();

    if (pickedFiles.isEmpty) {
      _showMessage('Unable to read selected files. Please try again.');
      return;
    }

    setState(() {
      _selectedDocuments = [..._selectedDocuments, ...pickedFiles].take(10).toList();
    });
  }

  Future<void> _pickAppointmentDate() async {
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

  Future<void> _pickAppointmentTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
    );

    if (picked == null) {
      return;
    }

    setState(() {
      _selectedTime = picked;
    });
  }

  Future<void> _submitClinicalNote() async {
    final title = _noteTitleController.text.trim();
    final note = _clinicalNoteController.text.trim();

    if (_patientId.isEmpty) {
      _showMessage('Patient profile link is missing. Please register/login again.');
      return;
    }

    if (title.isEmpty && note.isEmpty && _selectedDocuments.isEmpty) {
      _showMessage('Please add a note title or clinical note details.');
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _isSubmittingNote = true;
    });

    try {
      final patient = await _apiService.submitPatientClinicalNote(
        patientId: _patientId,
        title: title.isEmpty ? 'Previous Doctor Clinical Note' : title,
        note: note,
        addedByLabel: _name.isEmpty ? 'Patient' : _name,
        documents: _selectedDocuments,
      );

      if (!mounted) {
        return;
      }

      _noteTitleController.clear();
      _clinicalNoteController.clear();
      setState(() {
        _selectedDocuments = [];
        _patient = patient;
      });
      _showMessage('Clinical note shared with OPW.');
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      _showMessage(error.message);
    } catch (_) {
      if (!mounted) {
        return;
      }
      _showMessage('Unable to share clinical note. Please check the server connection.');
    } finally {
      if (mounted) {
        setState(() {
          _isSubmittingNote = false;
        });
      }
    }
  }

  Future<void> _submitAppointmentRequest() async {
    final service = _selectedService.trim();
    final message = _appointmentMessageController.text.trim();

    if (service.isEmpty || _selectedDate == null) {
      _showMessage('Please add service needed and preferred appointment date.');
      return;
    }

    if (_selectedDate != null && FormValidators.isPastDate(_selectedDate!)) {
      _showMessage('Preferred appointment date cannot be in the past.');
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _isSubmittingAppointment = true;
    });

    try {
      final response = await _apiService.submitAppointment(
        name: _name,
        email: _email,
        phone: _mobile,
        patientId: _patientId,
        service: service,
        date: _formatApiDate(_selectedDate!),
        time: _selectedTime == null ? '' : _formatApiTime(_selectedTime!),
        message: message,
      );

      if (!mounted) {
        return;
      }

      _appointmentMessageController.clear();
      setState(() {
        _selectedDate = null;
        _selectedTime = null;
        _selectedService = '';
      });
      await _refreshPatient();
      _showMessage(
        response['message']?.toString() ?? 'Appointment request submitted.',
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
      _showMessage('Unable to submit appointment request. Please check the server connection.');
    } finally {
      if (mounted) {
        setState(() {
          _isSubmittingAppointment = false;
        });
      }
    }
  }

  String _formatApiDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  String _formatDisplayDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$day/$month/${date.year}';
  }

  String _formatApiTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  String _formatDisplayTime(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minute = time.minute.toString().padLeft(2, '0');
    final suffix = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $suffix';
  }

  String _formatRecordDateTime(Map<String, dynamic> record, String dateKey, String timeKey) {
    final date = record[dateKey]?.toString() ?? '';
    final time = record[timeKey]?.toString() ?? '';
    final dateText = date.isEmpty ? 'Date not added' : date;
    return time.isEmpty ? dateText : '$dateText at $time';
  }

  String _formatPaymentDate(Map<String, dynamic> record) {
    final rawDate = record['createdAt']?.toString() ?? '';
    if (rawDate.isEmpty) {
      return 'Date not added';
    }

    final parsed = DateTime.tryParse(rawDate);
    if (parsed == null) {
      return rawDate;
    }

    return _formatDisplayDate(parsed.toLocal());
  }

  DateTime? _parseNotificationDate(dynamic value) {
    final rawValue = value?.toString().trim() ?? '';
    if (rawValue.isEmpty) {
      return null;
    }

    final parsed = DateTime.tryParse(rawValue);
    return parsed?.toLocal();
  }

  DateTime? _firstValidDate(Iterable<dynamic> values) {
    for (final value in values) {
      final parsed = _parseNotificationDate(value);
      if (parsed != null) {
        return parsed;
      }
    }

    return null;
  }

  String _formatNotificationTime(DateTime? value) {
    if (value == null) {
      return 'Recent update';
    }

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final targetDay = DateTime(value.year, value.month, value.day);
    final difference = today.difference(targetDay).inDays;

    final hour = value.hour % 12 == 0 ? 12 : value.hour % 12;
    final minute = value.minute.toString().padLeft(2, '0');
    final suffix = value.hour >= 12 ? 'PM' : 'AM';
    final timeLabel = '$hour:$minute $suffix';

    if (difference == 0) {
      return 'Today, $timeLabel';
    }

    if (difference == 1) {
      return 'Yesterday, $timeLabel';
    }

    return '${_formatDisplayDate(value)} | $timeLabel';
  }

  List<Map<String, dynamic>> _listFromPatient(String key) {
    final value = _patient?[key];
    if (value is List) {
      return value.whereType<Map<String, dynamic>>().toList();
    }
    return const [];
  }

  num _numberFrom(dynamic value) {
    if (value is num) {
      return value;
    }
    return num.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _formatMoney(dynamic value) {
    return 'Rs. ${_numberFrom(value).toStringAsFixed(0)}';
  }

  List<Map<String, dynamic>> get _clinicalNotes =>
      _listFromPatient('clinicalNotes');

  List<Map<String, dynamic>> get _appointments =>
      _listFromPatient('appointments');

  List<Map<String, dynamic>> get _visibleAppointmentRequests {
    final bookedRequestIds = _appointments
        .map((appointment) => appointment['requestId']?.toString() ?? '')
        .where((requestId) => requestId.isNotEmpty)
        .toSet();

    return _appointmentRequests
        .where(
          (request) {
            final requestId = request['id']?.toString() ?? '';
            final status = request['status']?.toString() ?? '';
            return !bookedRequestIds.contains(requestId) &&
                status != 'cancelled' &&
                status != 'completed';
          },
        )
        .toList();
  }

  List<Map<String, dynamic>> get _treatmentPlans =>
      _listFromPatient('treatmentPlans');

  List<Map<String, dynamic>> get _payments => _listFromPatient('payments');

  int get _totalPaymentCount {
    final sessionPayments = _treatmentPlans.fold<int>(
      0,
      (count, plan) =>
          count + ((plan['payments'] is List) ? (plan['payments'] as List).length : 0),
    );
    return _payments.length + sessionPayments;
  }

  List<_PatientNotification> get _notifications {
    final notifications = <_PatientNotification>[];

    for (final note in _clinicalNotes) {
      final addedByType = note['addedByType']?.toString() ?? '';
      if (addedByType == 'patient') {
        continue;
      }

      final title = note['title']?.toString().trim().isNotEmpty == true
          ? note['title'].toString().trim()
          : 'New clinical note from OPW';
      final body = note['note']?.toString().trim().isNotEmpty == true
          ? note['note'].toString().trim()
          : 'OPW added a clinical note to your recovery record.';

      notifications.add(
        _PatientNotification(
          title: title,
          body: body,
          timestamp: _firstValidDate([
            note['updatedAt'],
            note['createdAt'],
          ]),
          icon: Icons.note_alt_rounded,
          color: const Color(0xFF2563EB),
        ),
      );
    }

    for (final request in _appointmentRequests) {
      final status = request['status']?.toString().toLowerCase() ?? 'pending';
      if (status == 'pending') {
        continue;
      }

      final service = request['service']?.toString().trim().isNotEmpty == true
          ? request['service'].toString().trim()
          : 'Appointment';
      final decisionNote = request['decisionNote']?.toString().trim() ?? '';
      final confirmedDate = request['confirmedDate']?.toString().trim() ?? '';
      final confirmedTime = request['confirmedTime']?.toString().trim() ?? '';
      final scheduleText = confirmedDate.isEmpty
          ? ''
          : confirmedTime.isEmpty
              ? confirmedDate
              : '$confirmedDate at $confirmedTime';

      notifications.add(
        _PatientNotification(
          title: switch (status) {
            'approved' => '$service confirmed',
            'rescheduled' => '$service rescheduled',
            'completed' => '$service marked done',
            'cancelled' => '$service cancelled',
            _ => '$service updated',
          },
          body: [
            if (scheduleText.isNotEmpty) 'Schedule: $scheduleText',
            if (decisionNote.isNotEmpty) 'OPW note: $decisionNote',
            if (scheduleText.isEmpty && decisionNote.isEmpty)
              'OPW updated your appointment request.',
          ].join('\n'),
          timestamp: _firstValidDate([
            request['updatedAt'],
            request['createdAt'],
            request['confirmedDate'],
          ]),
          icon: status == 'rescheduled'
              ? Icons.update_rounded
              : status == 'cancelled'
                  ? Icons.cancel_rounded
                  : status == 'completed'
                      ? Icons.task_alt_rounded
                      : Icons.event_available_rounded,
          color: status == 'cancelled'
              ? const Color(0xFFDC2626)
              : status == 'completed'
                  ? const Color(0xFF059669)
                  : const Color(0xFF0891B2),
        ),
      );
    }

    for (final plan in _treatmentPlans) {
      final treatmentLabel = plan['treatmentTypes'] is List &&
              (plan['treatmentTypes'] as List).isNotEmpty
          ? (plan['treatmentTypes'] as List).join(', ')
          : 'Session plan';
      final fromDate = plan['fromDate']?.toString().trim() ?? '';
      final toDate = plan['toDate']?.toString().trim() ?? '';
      final scheduleText = fromDate.isEmpty && toDate.isEmpty
          ? 'OPW added a session plan to your account.'
          : 'Plan period: ${fromDate.isEmpty ? 'not set' : fromDate} to ${toDate.isEmpty ? 'not set' : toDate}';

      notifications.add(
        _PatientNotification(
          title: 'Session plan updated',
          body: '$treatmentLabel\n$scheduleText',
          timestamp: _firstValidDate([
            plan['updatedAt'],
            plan['createdAt'],
            plan['fromDate'],
          ]),
          icon: Icons.healing_rounded,
          color: const Color(0xFF0F766E),
        ),
      );
    }

    for (final payment in _payments) {
      notifications.add(
        _PatientNotification(
          title: 'Payment update added',
          body:
              '${_formatMoney(payment['amount'])} | ${payment['method']?.toString() ?? 'Payment'}',
          timestamp: _firstValidDate([
            payment['updatedAt'],
            payment['createdAt'],
          ]),
          icon: Icons.payments_rounded,
          color: const Color(0xFFF97316),
        ),
      );
    }

    for (final plan in _treatmentPlans) {
      final treatmentLabel = plan['treatmentTypes'] is List &&
              (plan['treatmentTypes'] as List).isNotEmpty
          ? (plan['treatmentTypes'] as List).join(', ')
          : 'Treatment';
      final planPayments = (plan['payments'] is List)
          ? (plan['payments'] as List).whereType<Map<String, dynamic>>().toList()
          : const <Map<String, dynamic>>[];

      for (final payment in planPayments) {
        notifications.add(
          _PatientNotification(
            title: 'Treatment payment updated',
            body:
                '${_formatMoney(payment['amount'])} | $treatmentLabel',
            timestamp: _firstValidDate([
              payment['updatedAt'],
              payment['createdAt'],
            ]),
            icon: Icons.receipt_long_rounded,
            color: const Color(0xFFF97316),
          ),
        );
      }
    }

    notifications.sort(
      (a, b) => (b.timestamp ?? DateTime.fromMillisecondsSinceEpoch(0))
          .compareTo(a.timestamp ?? DateTime.fromMillisecondsSinceEpoch(0)),
    );

    return notifications;
  }

  int get _unreadNotificationCount {
    final seenAt = _notificationsSeenAt;
    if (seenAt == null) {
      return _notifications.length;
    }

    return _notifications.where((item) {
      final timestamp = item.timestamp;
      return timestamp == null || timestamp.isAfter(seenAt);
    }).length;
  }

  Future<void> _openNotificationsSheet() async {
    final notifications = _notifications;
    await _markNotificationsSeen();
    if (!mounted) {
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final theme = Theme.of(context);
        return DraggableScrollableSheet(
          initialChildSize: 0.72,
          minChildSize: 0.45,
          maxChildSize: 0.92,
          builder: (context, controller) {
            return Container(
              decoration: const BoxDecoration(
                color: Color(0xFFF8FBFF),
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    height: 5,
                    width: 56,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(22, 18, 22, 16),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Notifications',
                                style: theme.textTheme.headlineSmall?.copyWith(
                                  color: const Color(0xFF0F172A),
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                notifications.isEmpty
                                    ? 'No OPW updates yet.'
                                    : '${notifications.length} OPW updates in your account',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xFF64748B),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: notifications.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 28),
                              child: Text(
                                'OPW updates for notes, appointments, sessions, and payments will appear here.',
                                textAlign: TextAlign.center,
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  color: const Color(0xFF64748B),
                                  height: 1.5,
                                ),
                              ),
                            ),
                          )
                        : ListView.separated(
                            controller: controller,
                            padding: const EdgeInsets.fromLTRB(22, 0, 22, 24),
                            itemCount: notifications.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final item = notifications[index];
                              final isUnread = _notificationsSeenAt == null ||
                                  item.timestamp == null ||
                                  item.timestamp!.isAfter(_notificationsSeenAt!);
                              return _NotificationTile(
                                item: item,
                                isUnread: isUnread,
                                formatTime: _formatNotificationTime,
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildTabList(List<Widget> children) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: children,
    );
  }

  Widget _buildHeroCard(ThemeData theme) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF081124),
            Color(0xFF2563EB),
            Color(0xFF38BDF8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(26),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A2563EB),
            blurRadius: 20,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            height: 48,
            width: 48,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
            ),
            child: const Icon(
              Icons.account_circle_rounded,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _name.isEmpty ? 'Patient Dashboard' : _name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _isLoadingPatient ? 'Refreshing records' : 'OPW synced',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: const Color(0xFFE0F2FE),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'Live',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
      child: Row(
        children: [
          _RoundButton(
            icon: Icons.menu_rounded,
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          ),
          const Spacer(),
          _NotificationButton(
            count: _unreadNotificationCount,
            onPressed: _openNotificationsSheet,
          ),
          const SizedBox(width: 10),
          _RoundButton(
            icon: Icons.refresh_rounded,
            onPressed: _refreshPatient,
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 8,
            ),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.90),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Text(
              'Patient Area',
              style: theme.textTheme.labelLarge?.copyWith(
                color: const Color(0xFF2563EB),
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSideDrawer(ThemeData theme) {
    return Drawer(
      width: 310,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF081124),
              Color(0xFF15356B),
              Color(0xFF38BDF8),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.12),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Patient Area',
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: const Color(0xFFE0F2FE),
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.1,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        _name.isEmpty ? 'Patient Dashboard' : _name,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _mobile.isNotEmpty ? _mobile : _email,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFFE0F2FE),
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                Expanded(
                  child: ListView(
                    padding: EdgeInsets.zero,
                    children: [
                      _DashboardDrawerTile(
                        icon: Icons.account_circle_rounded,
                        label: 'Profile',
                        selected: false,
                        onTap: _openProfile,
                      ),
                      const SizedBox(height: 10),
                      _DashboardDrawerTile(
                        icon: Icons.dashboard_rounded,
                        label: 'Overview',
                        selected: _tabController.index == 0,
                        onTap: () => _selectDashboardTab(0),
                      ),
                      const SizedBox(height: 10),
                      _DashboardDrawerTile(
                        icon: Icons.note_alt_rounded,
                        label: 'Notes',
                        selected: _tabController.index == 1,
                        onTap: () => _selectDashboardTab(1),
                      ),
                      const SizedBox(height: 10),
                      _DashboardDrawerTile(
                        icon: Icons.event_available_rounded,
                        label: 'Appointments',
                        selected: _tabController.index == 2,
                        onTap: () => _selectDashboardTab(2),
                      ),
                      const SizedBox(height: 10),
                      _DashboardDrawerTile(
                        icon: Icons.healing_rounded,
                        label: 'Sessions',
                        selected: _tabController.index == 3,
                        onTap: () => _selectDashboardTab(3),
                      ),
                      const SizedBox(height: 10),
                      _DashboardDrawerTile(
                        icon: Icons.payments_rounded,
                        label: 'Payments',
                        selected: _tabController.index == 4,
                        onTap: () => _selectDashboardTab(4),
                      ),
                      const SizedBox(height: 10),
                      _DashboardDrawerTile(
                        icon: Icons.forum_rounded,
                        label: 'Live Chat',
                        selected: false,
                        onTap: _openSideChat,
                      ),
                      const SizedBox(height: 10),
                      _DashboardDrawerTile(
                        icon: Icons.home_rounded,
                        label: 'Home',
                        selected: false,
                        onTap: _goHome,
                      ),
                    ],
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: _logoutPatient,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0x80FFFFFF)),
                    minimumSize: const Size.fromHeight(52),
                  ),
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Logout'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPatientTabs() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 0),
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F0F172A),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        dividerColor: Colors.transparent,
        labelColor: Colors.white,
        unselectedLabelColor: const Color(0xFF475569),
        indicatorSize: TabBarIndicatorSize.tab,
        indicator: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2563EB), Color(0xFF38BDF8)],
          ),
          borderRadius: BorderRadius.circular(18),
        ),
        labelStyle: const TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 13,
        ),
        unselectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 13,
        ),
        tabs: const [
          Tab(icon: Icon(Icons.dashboard_rounded), text: 'Overview'),
          Tab(icon: Icon(Icons.note_alt_rounded), text: 'Notes'),
          Tab(icon: Icon(Icons.event_available_rounded), text: 'Appointments'),
          Tab(icon: Icon(Icons.healing_rounded), text: 'Sessions'),
          Tab(icon: Icon(Icons.payments_rounded), text: 'Payments'),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    return _buildTabList([
      GridView.count(
        crossAxisCount: 2,
        childAspectRatio: 1.35,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        children: [
          _SummaryStatCard(
            label: 'Clinical Notes',
            value: _clinicalNotes.length.toString(),
            icon: Icons.folder_shared_rounded,
            color: const Color(0xFF2563EB),
          ),
          _SummaryStatCard(
            label: 'Appointments',
            value: _appointments.length.toString(),
            icon: Icons.event_note_rounded,
            color: const Color(0xFF0891B2),
          ),
          _SummaryStatCard(
            label: 'Sessions',
            value: _treatmentPlans.length.toString(),
            icon: Icons.assignment_turned_in_rounded,
            color: const Color(0xFF0F766E),
          ),
          _SummaryStatCard(
            label: 'Payments',
            value: _totalPaymentCount.toString(),
            icon: Icons.receipt_long_rounded,
            color: const Color(0xFFF97316),
          ),
        ],
      ),
      const SizedBox(height: 18),
      _DashboardCard(
        title: 'Your Care Timeline',
        subtitle:
            'Use the tabs above to share documents, request appointments, and review OPW updates.',
        icon: Icons.auto_awesome_rounded,
        child: Column(
          children: const [
            _TimelineHintTile(
              icon: Icons.upload_file_rounded,
              title: 'Upload clinical documents',
              subtitle: 'PDF and images added by you stay visible in your account.',
            ),
            _TimelineHintTile(
              icon: Icons.medical_information_rounded,
              title: 'Doctor notes come back here',
              subtitle: 'Clinical notes added by OPW will appear in Notes.',
            ),
            _TimelineHintTile(
              icon: Icons.payments_rounded,
              title: 'Track sessions and payments',
              subtitle: 'Booked sessions and payment details are grouped in separate tabs.',
            ),
          ],
        ),
      ),
    ]);
  }

  Widget _buildClinicalNoteFormCard() {
    return _DashboardCard(
      title: 'Share Clinical Note',
      subtitle:
          'Upload PDF/images and previous doctor notes for OPW review.',
      icon: Icons.note_alt_rounded,
      child: Column(
        children: [
          TextField(
            controller: _noteTitleController,
            decoration: const InputDecoration(
              labelText: 'Note title',
              hintText: 'Example: Orthopedic consultation summary',
              prefixIcon: Icon(Icons.title_rounded),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _clinicalNoteController,
            minLines: 5,
            maxLines: 8,
            decoration: const InputDecoration(
              labelText: 'Clinical note details',
              hintText: 'Write previous doctor notes, medicine advice, reports summary...',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 14),
          _SelectedDocumentsPanel(
            documents: _selectedDocuments,
            onPickFiles: _pickClinicalDocuments,
            onRemoveFile: (index) {
              setState(() {
                _selectedDocuments = [..._selectedDocuments]..removeAt(index);
              });
            },
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _isSubmittingNote ? null : _submitClinicalNote,
              icon: _isSubmittingNote
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.cloud_upload_rounded),
              label: Text(_isSubmittingNote ? 'Sharing...' : 'Share With Clinic'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClinicalNotesRecordCard() {
    return _RecordCard(
      title: 'Clinical Notes & Documents',
      subtitle:
          'Notes added by you or OPW will appear here.',
      icon: Icons.folder_shared_rounded,
      emptyText: 'No clinical notes yet.',
      children: _clinicalNotes.map((note) => _ClinicalNoteTile(note: note)).toList(),
    );
  }

  Widget _buildClinicalNotesTab() {
    return _buildTabList([
      _buildClinicalNoteFormCard(),
      const SizedBox(height: 18),
      _buildClinicalNotesRecordCard(),
    ]);
  }

  Widget _buildAppointmentRequestCard() {
    final theme = Theme.of(context);

    return _DashboardCard(
      title: 'Request Appointment',
      subtitle:
          'Only logged-in patients can submit this request.',
      icon: Icons.calendar_month_rounded,
      child: Column(
        children: [
          DropdownButtonFormField<String>(
            initialValue: _selectedService.isEmpty ? null : _selectedService,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Service needed',
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
          InkWell(
            onTap: _pickAppointmentDate,
            borderRadius: BorderRadius.circular(20),
            child: Ink(
              padding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 18,
              ),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FBFF),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.event_available_rounded,
                    color: Color(0xFF2563EB),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _selectedDate == null
                          ? 'Select preferred date'
                          : _formatDisplayDate(_selectedDate!),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF334155),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          InkWell(
            onTap: _pickAppointmentTime,
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
                  const Icon(
                    Icons.schedule_rounded,
                    color: Color(0xFF2563EB),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _selectedTime == null
                          ? 'Select preferred time'
                          : _formatDisplayTime(_selectedTime!),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF334155),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _appointmentMessageController,
            minLines: 4,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Message for clinic',
              hintText: 'Tell us about your pain, injury, or preferred timing',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed:
                  _isSubmittingAppointment ? null : _submitAppointmentRequest,
              icon: _isSubmittingAppointment
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.send_rounded),
              label: Text(
                _isSubmittingAppointment ? 'Sending...' : 'Request Appointment',
              ),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: const Color(0xFF38BDF8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentsRecordCard() {
    return _RecordCard(
      title: 'Booked Appointments',
      subtitle: 'Appointments confirmed by OPW will appear here.',
      icon: Icons.event_note_rounded,
      emptyText: 'No booked appointments yet.',
      children: _appointments
          .map(
            (appointment) {
              final status = appointment['status']?.toString() ?? 'approved';
              final remark = appointment['remark']?.toString() ?? '';

              return _SimpleRecordTile(
                title: appointment['service']?.toString() ?? 'Appointment',
                subtitle: [
                  _formatRecordDateTime(appointment, 'date', 'time'),
                  'Status: ${status == 'completed' ? 'Done' : status}',
                  if (remark.isNotEmpty) 'OPW remark: $remark',
                ].join('\n'),
                icon: Icons.calendar_today_rounded,
              );
            },
          )
          .toList(),
    );
  }

  Widget _buildAppointmentRequestUpdatesCard() {
    return _RecordCard(
      title: 'Appointment Request Updates',
      subtitle: 'Pending requests stay here. Approved ones move to booked appointments.',
      icon: Icons.notifications_active_rounded,
      emptyText: 'No pending appointment request updates.',
      children: _visibleAppointmentRequests
          .map(
            (request) => _AppointmentRequestTile(request: request),
          )
          .toList(),
    );
  }

  Widget _buildAppointmentsTab() {
    return _buildTabList([
      _buildAppointmentRequestCard(),
      const SizedBox(height: 18),
      _buildAppointmentRequestUpdatesCard(),
      const SizedBox(height: 18),
      _buildAppointmentsRecordCard(),
    ]);
  }

  Widget _buildTreatmentPlansRecordCard() {
    return _RecordCard(
      title: 'Session / Treatment Details',
      subtitle:
          'Treatment/session plan details from OPW are visible here.',
      icon: Icons.assignment_turned_in_rounded,
      emptyText: 'No session details added yet.',
      children: _treatmentPlans
          .map(
            (plan) => _TreatmentPlanTile(
              plan: plan,
              formatMoney: _formatMoney,
            ),
          )
          .toList(),
    );
  }

  Widget _buildSessionsTab() {
    return _buildTabList([
      _buildTreatmentPlansRecordCard(),
    ]);
  }

  Widget _buildPaymentsRecordCard() {
    return _RecordCard(
      title: 'Payment Details',
      subtitle:
          'Payment entries from your OPW care plan are visible here.',
      icon: Icons.payments_rounded,
      emptyText: 'No payment details added yet.',
      children: [
        ..._payments.map(
          (payment) => _SimpleRecordTile(
            title: _formatMoney(payment['amount']),
            subtitle:
                '${payment['method']?.toString() ?? 'Payment'}\nDate: ${_formatPaymentDate(payment)}',
            icon: Icons.receipt_long_rounded,
          ),
        ),
        ..._treatmentPlans.expand(
          (plan) => ((plan['payments'] is List) ? plan['payments'] as List : const [])
              .whereType<Map<String, dynamic>>()
              .map(
                (payment) => _SimpleRecordTile(
                  title: _formatMoney(payment['amount']),
                  subtitle:
                      '${payment['method']?.toString() ?? 'Payment'} | ${plan['treatmentTypes'] is List ? (plan['treatmentTypes'] as List).join(', ') : 'Treatment'}\nDate: ${_formatPaymentDate(payment)}',
                  icon: Icons.receipt_long_rounded,
                ),
              ),
        ),
      ],
    );
  }

  Widget _buildPaymentsTab() {
    return _buildTabList([
      _buildPaymentsRecordCard(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF5F9FF),
      drawer: _buildSideDrawer(theme),
      body: Stack(
        children: [
          const _DashboardOrb(
            top: -120,
            right: -80,
            size: 260,
            colors: [Color(0x5538BDF8), Color(0x0038BDF8)],
          ),
          const _DashboardOrb(
            bottom: 40,
            left: -110,
            size: 250,
            colors: [Color(0x302563EB), Color(0x002563EB)],
          ),
          SafeArea(
            child: Column(
              children: [
                _buildTopBar(theme),
                _buildHeroCard(theme),
                _buildPatientTabs(),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildOverviewTab(),
                      _buildClinicalNotesTab(),
                      _buildAppointmentsTab(),
                      _buildSessionsTab(),
                      _buildPaymentsTab(),
                    ],
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

class _PatientChatScreen extends StatelessWidget {
  const _PatientChatScreen({
    required this.visitorName,
    required this.visitorContact,
  });

  final String visitorName;
  final String visitorContact;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Live Chat'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: PatientChatPanel(
        visitorName: visitorName,
        visitorContact: visitorContact,
        onContactPressed: () {
          Navigator.of(context).popUntil((route) => route.isFirst);
        },
      ),
    );
  }
}

class _SummaryStatCard extends StatelessWidget {
  const _SummaryStatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
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
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            height: 42,
            width: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: theme.textTheme.headlineSmall?.copyWith(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w900,
                  height: 1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.labelLarge?.copyWith(
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TimelineHintTile extends StatelessWidget {
  const _TimelineHintTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBFF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 42,
            width: 42,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFE0F2FE), Color(0xFFBFDBFE)],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: const Color(0xFF2563EB), size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: const Color(0xFF0F172A),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF64748B),
                    height: 1.45,
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

class _DashboardCard extends StatelessWidget {
  const _DashboardCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.child,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x120F172A),
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
                height: 52,
                width: 52,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFFE0F2FE),
                      Color(0xFFBFDBFE),
                    ],
                  ),
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
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF64748B),
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          child,
        ],
      ),
    );
  }
}

class _SelectedDocumentsPanel extends StatelessWidget {
  const _SelectedDocumentsPanel({
    required this.documents,
    required this.onPickFiles,
    required this.onRemoveFile,
  });

  final List<AppUploadFile> documents;
  final VoidCallback onPickFiles;
  final void Function(int index) onRemoveFile;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBFF),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.attach_file_rounded,
                color: Color(0xFF2563EB),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'PDF / Image Attachments',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: const Color(0xFF0F172A),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              TextButton(
                onPressed: onPickFiles,
                child: const Text('Add'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (documents.isEmpty)
            Text(
              'No documents selected yet. You can add PDF, JPG, PNG, or WEBP files.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: const Color(0xFF64748B),
                height: 1.45,
              ),
            )
          else
            ...documents.asMap().entries.map(
                  (entry) => Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          entry.value.name.toLowerCase().endsWith('.pdf')
                              ? Icons.picture_as_pdf_rounded
                              : Icons.image_rounded,
                          color: const Color(0xFF2563EB),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            entry.value.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: const Color(0xFF334155),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () => onRemoveFile(entry.key),
                          icon: const Icon(Icons.close_rounded),
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

class _PatientRecordsSection extends StatelessWidget {
  const _PatientRecordsSection({
    required this.clinicalNotes,
    required this.appointments,
    required this.treatmentPlans,
    required this.payments,
    required this.formatMoney,
  });

  final List<Map<String, dynamic>> clinicalNotes;
  final List<Map<String, dynamic>> appointments;
  final List<Map<String, dynamic>> treatmentPlans;
  final List<Map<String, dynamic>> payments;
  final String Function(dynamic value) formatMoney;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _RecordCard(
          title: 'Clinical Notes & Documents',
          subtitle:
              'Notes added by you or the doctor will appear here after refresh/login.',
          icon: Icons.folder_shared_rounded,
          emptyText: 'No clinical notes yet.',
          children: clinicalNotes
              .map((note) => _ClinicalNoteTile(note: note))
              .toList(),
        ),
        const SizedBox(height: 18),
        _RecordCard(
          title: 'Booked Appointments',
          subtitle:
              'Appointments confirmed by OPW will appear here.',
          icon: Icons.event_note_rounded,
          emptyText: 'No booked appointments yet.',
          children: appointments
              .map(
                (appointment) {
                  final status = appointment['status']?.toString() ?? 'approved';
                  final remark = appointment['remark']?.toString() ?? '';

                  return _SimpleRecordTile(
                    title: appointment['service']?.toString() ?? 'Appointment',
                    subtitle: [
                      appointment['date']?.toString() ?? 'Date not added',
                      'Status: ${status == 'completed' ? 'Done' : status}',
                      if (remark.isNotEmpty) 'OPW remark: $remark',
                    ].join('\n'),
                    icon: Icons.calendar_today_rounded,
                  );
                },
              )
              .toList(),
        ),
        const SizedBox(height: 18),
        _RecordCard(
          title: 'Session / Treatment Details',
          subtitle:
              'Treatment/session plan details from OPW are visible here.',
          icon: Icons.assignment_turned_in_rounded,
          emptyText: 'No session details added yet.',
          children: treatmentPlans
              .map(
                (plan) => _TreatmentPlanTile(
                  plan: plan,
                  formatMoney: formatMoney,
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 18),
        _RecordCard(
          title: 'Payment Details',
          subtitle:
              'Payment entries from your OPW care plan are visible here.',
          icon: Icons.payments_rounded,
          emptyText: 'No payment details added yet.',
          children: [
            ...payments.map(
              (payment) => _SimpleRecordTile(
                title: formatMoney(payment['amount']),
                subtitle:
                    '${payment['method']?.toString() ?? 'Payment'}\nDate: ${_formatLegacyPaymentDate(payment)}',
                icon: Icons.receipt_long_rounded,
              ),
            ),
            ...treatmentPlans.expand(
              (plan) => ((plan['payments'] is List) ? plan['payments'] as List : const [])
                  .whereType<Map<String, dynamic>>()
                  .map(
                    (payment) => _SimpleRecordTile(
                      title: formatMoney(payment['amount']),
                      subtitle:
                          '${payment['method']?.toString() ?? 'Payment'} | ${plan['treatmentTypes'] is List ? (plan['treatmentTypes'] as List).join(', ') : 'Treatment'}\nDate: ${_formatLegacyPaymentDate(payment)}',
                      icon: Icons.receipt_long_rounded,
                    ),
                  ),
            ),
          ],
        ),
      ],
    );
  }
}

class _RecordCard extends StatelessWidget {
  const _RecordCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.emptyText,
    required this.children,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String emptyText;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return _DashboardCard(
      title: title,
      subtitle: subtitle,
      icon: icon,
      child: children.isEmpty
          ? Text(
              emptyText,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF64748B),
                height: 1.5,
              ),
            )
          : Column(
              children: children,
            ),
    );
  }
}

class _ClinicalNoteTile extends StatelessWidget {
  const _ClinicalNoteTile({
    required this.note,
  });

  final Map<String, dynamic> note;

  @override
  Widget build(BuildContext context) {
    final documents = (note['documents'] is List)
        ? (note['documents'] as List).whereType<Map<String, dynamic>>().toList()
        : <Map<String, dynamic>>[];
    final addedByLabel = note['addedByLabel']?.toString().isNotEmpty == true
        ? note['addedByLabel'].toString()
        : note['addedByType']?.toString() == 'patient'
            ? 'Patient'
            : 'OPW';

    return _RecordTileShell(
      icon: Icons.note_alt_rounded,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            note['title']?.toString().isNotEmpty == true
                ? note['title'].toString()
                : 'Clinical Note',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Added by $addedByLabel',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.7,
                ),
          ),
          if ((note['note']?.toString() ?? '').isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              note['note'].toString(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF475569),
                    height: 1.5,
                  ),
            ),
          ],
          if (documents.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: documents
                  .map(
                    (document) => Chip(
                      avatar: Icon(
                        document['mimeType']?.toString().contains('pdf') == true
                            ? Icons.picture_as_pdf_rounded
                            : Icons.image_rounded,
                        size: 18,
                      ),
                      label: Text(
                        document['name']?.toString() ?? 'Document',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

String _formatLegacyPaymentDate(Map record) {
  final rawDate = record['createdAt']?.toString() ?? '';
  if (rawDate.isEmpty) {
    return 'Date not added';
  }

  final parsed = DateTime.tryParse(rawDate);
  if (parsed == null) {
    return rawDate;
  }

  final localDate = parsed.toLocal();
  final month = localDate.month.toString().padLeft(2, '0');
  final day = localDate.day.toString().padLeft(2, '0');
  return '$day/$month/${localDate.year}';
}

class _TreatmentPlanTile extends StatelessWidget {
  const _TreatmentPlanTile({
    required this.plan,
    required this.formatMoney,
  });

  final Map<String, dynamic> plan;
  final String Function(dynamic value) formatMoney;

  @override
  Widget build(BuildContext context) {
    final treatmentTypes = plan['treatmentTypes'] is List
        ? (plan['treatmentTypes'] as List).join(', ')
        : 'Treatment plan';
    final fromDate = plan['fromDate']?.toString() ?? '';
    final toDate = plan['toDate']?.toString() ?? '';
    final sessionDays = plan['sessionDays'] is List
        ? (plan['sessionDays'] as List).whereType<Map>().toList()
        : const <Map>[];
    final sessionText = sessionDays.isEmpty
        ? ''
        : '\nSessions:\n${sessionDays.map((day) {
            final date = day['date']?.toString() ?? 'Date not added';
            final status = day['status']?.toString() == 'done'
                ? 'Done'
                : 'Not done';
            return '$date - $status';
          }).join('\n')}';

    return _SimpleRecordTile(
      title: treatmentTypes.isEmpty ? 'Treatment plan' : treatmentTypes,
      subtitle:
          'From ${fromDate.isEmpty ? 'not set' : fromDate} to ${toDate.isEmpty ? 'not set' : toDate}\nTotal: ${formatMoney(plan['totalAmount'])} | Advance: ${formatMoney(plan['advanceAmount'])} | Balance: ${formatMoney(plan['balanceAmount'])}$sessionText',
      icon: Icons.healing_rounded,
    );
  }
}

class _AppointmentRequestTile extends StatelessWidget {
  const _AppointmentRequestTile({
    required this.request,
  });

  final Map<String, dynamic> request;

  String _dateTimeText(String dateKey, String timeKey) {
    final date = request[dateKey]?.toString() ?? '';
    final time = request[timeKey]?.toString() ?? '';
    final dateText = date.isEmpty ? 'Date not added' : date;
    return time.isEmpty ? dateText : '$dateText at $time';
  }

  @override
  Widget build(BuildContext context) {
    final status = request['status']?.toString() ?? 'pending';
    final service = request['service']?.toString() ?? 'Appointment';
    final confirmedDate = request['confirmedDate']?.toString() ?? '';
    final confirmedTime = request['confirmedTime']?.toString() ?? '';
    final decisionNote = request['decisionNote']?.toString() ?? '';

    return _RecordTileShell(
      icon: status == 'rescheduled'
          ? Icons.update_rounded
          : status == 'approved'
              ? Icons.check_circle_rounded
              : Icons.hourglass_top_rounded,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$service - $status',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            "Requested: ${_dateTimeText('requestedDate', 'requestedTime')}",
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF475569),
                  height: 1.5,
                ),
          ),
          if (confirmedDate.isNotEmpty || confirmedTime.isNotEmpty) ...[
            const SizedBox(height: 8),
            Chip(
              avatar: Icon(
                status == 'rescheduled'
                    ? Icons.event_repeat_rounded
                    : Icons.event_available_rounded,
                size: 18,
              ),
              label: Text(
                "${status == 'rescheduled' ? 'Rescheduled' : 'Confirmed'}: ${_dateTimeText('confirmedDate', 'confirmedTime')}",
              ),
            ),
          ],
          if (decisionNote.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'OPW note: $decisionNote',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF64748B),
                    height: 1.45,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SimpleRecordTile extends StatelessWidget {
  const _SimpleRecordTile({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return _RecordTileShell(
      icon: icon,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF475569),
                  height: 1.5,
                ),
          ),
        ],
      ),
    );
  }
}

class _RecordTileShell extends StatelessWidget {
  const _RecordTileShell({
    required this.icon,
    required this.child,
  });

  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBFF),
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
            child: Icon(
              icon,
              color: const Color(0xFF2563EB),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _PatientNotification {
  const _PatientNotification({
    required this.title,
    required this.body,
    required this.icon,
    required this.color,
    this.timestamp,
  });

  final String title;
  final String body;
  final DateTime? timestamp;
  final IconData icon;
  final Color color;
}

class _NotificationButton extends StatelessWidget {
  const _NotificationButton({
    required this.count,
    required this.onPressed,
  });

  final int count;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        _RoundButton(
          icon: Icons.notifications_rounded,
          onPressed: onPressed,
        ),
        if (count > 0)
          Positioned(
            right: -2,
            top: -2,
            child: Container(
              constraints: const BoxConstraints(minWidth: 22),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFDC2626),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: Text(
                count > 99 ? '99+' : '$count',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.item,
    required this.isUnread,
    required this.formatTime,
  });

  final _PatientNotification item;
  final bool isUnread;
  final String Function(DateTime? value) formatTime;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isUnread ? const Color(0xFFBFDBFE) : const Color(0xFFE2E8F0),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0F172A),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 48,
            width: 48,
            decoration: BoxDecoration(
              color: item.color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(
              item.icon,
              color: item.color,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        item.title,
                        style: theme.textTheme.titleSmall?.copyWith(
                          color: const Color(0xFF0F172A),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    if (isUnread) ...[
                      const SizedBox(width: 8),
                      Container(
                        height: 10,
                        width: 10,
                        decoration: const BoxDecoration(
                          color: Color(0xFF2563EB),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  item.body,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF475569),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  formatTime(item.timestamp),
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: const Color(0xFF64748B),
                    fontWeight: FontWeight.w700,
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

class _RoundButton extends StatelessWidget {
  const _RoundButton({
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

class _DashboardDrawerTile extends StatelessWidget {
  const _DashboardDrawerTile({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(24),
      onTap: onTap,
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.white.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: selected ? Colors.white : Colors.white.withValues(alpha: 0.08),
          ),
        ),
        child: Row(
          children: [
            Container(
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                color: selected
                    ? const Color(0xFFE0F2FE)
                    : Colors.white.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                icon,
                color: selected ? const Color(0xFF2563EB) : Colors.white,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: selected ? const Color(0xFF0F172A) : Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileChip extends StatelessWidget {
  const _ProfileChip({
    required this.label,
  });

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class _DashboardOrb extends StatelessWidget {
  const _DashboardOrb({
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
