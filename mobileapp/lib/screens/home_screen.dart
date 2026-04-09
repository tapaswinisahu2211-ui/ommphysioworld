import 'package:flutter/material.dart';

import 'package:omphysioworld/screens/login_screen.dart';
import 'package:omphysioworld/screens/patient_chat_panel.dart';
import 'package:omphysioworld/screens/patient_dashboard_screen.dart';
import 'package:omphysioworld/screens/public_tab_sections.dart';
import 'package:omphysioworld/storage/patient_session_storage.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final _sessionStorage = PatientSessionStorage();
  Map<String, dynamic>? _patientUser;
  late final List<int> _tabResetKeys = List<int>.filled(_tabs.length, 0);

  static const _tabs = [
    _WebsiteTab('Home', Icons.home_rounded),
    _WebsiteTab('About', Icons.info_rounded),
    _WebsiteTab('Services', Icons.medical_services_rounded),
    _WebsiteTab('Career', Icons.work_rounded),
    _WebsiteTab('FAQ', Icons.psychology_alt_rounded),
    _WebsiteTab('Live Chat', Icons.forum_rounded),
    _WebsiteTab('Contact', Icons.call_rounded),
  ];

  late final TabController _tabController = TabController(
    length: _tabs.length,
    vsync: this,
  );

  @override
  void initState() {
    super.initState();
    _loadPatientSession();
    _tabController.addListener(() {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _openLogin() {
    Navigator.of(context)
        .push(
      MaterialPageRoute<void>(
        builder: (_) => const LoginScreen(),
      ),
    )
        .then((_) => _loadPatientSession());
  }

  Future<void> _loadPatientSession() async {
    final user = await _sessionStorage.getPatientUser();
    if (!mounted) {
      return;
    }

    setState(() {
      _patientUser = user;
    });
  }

  void _openDashboard() {
    final user = _patientUser;
    if (user == null) {
      _openLogin();
      return;
    }

    Navigator.of(context).pop();
    Navigator.of(context)
        .push(
          MaterialPageRoute<void>(
            builder: (_) => PatientDashboardScreen(user: user),
          ),
        )
        .then((_) => _loadPatientSession());
  }

  void _pushDashboard() {
    final user = _patientUser;
    if (user == null) {
      _openLogin();
      return;
    }

    Navigator.of(context)
        .push(
          MaterialPageRoute<void>(
            builder: (_) => PatientDashboardScreen(user: user),
          ),
        )
        .then((_) => _loadPatientSession());
  }

  Future<void> _logoutPatient() async {
    await _sessionStorage.clearPatientUser();
    if (!mounted) {
      return;
    }

    setState(() {
      _patientUser = null;
    });
    Navigator.of(context).pop();
  }

  void _jumpToTab(int index) {
    setState(() {
      _tabResetKeys[index]++;
    });
    _tabController.animateTo(index);
    Navigator.of(context).pop();
  }

  void _jumpToContact() {
    final contactIndex = _tabs.length - 1;
    setState(() {
      _tabResetKeys[contactIndex]++;
    });
    _tabController.animateTo(contactIndex);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final patientUser = _patientUser;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF5F9FF),
      drawer: Drawer(
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
                        Container(
                          height: 74,
                          width: 74,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.16),
                                blurRadius: 22,
                                offset: const Offset(0, 12),
                              ),
                            ],
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Image.asset(
                            'assets/images/opw.png',
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            'PHYSIO CARE',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.1,
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Baripada, Odisha\nDr. Tapaswini Sahu\nMonday to Saturday, 9:00 AM to 7:00 PM',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFFE0F2FE),
                            height: 1.6,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  if (patientUser != null) ...[
                    _DrawerActionTile(
                      icon: Icons.dashboard_rounded,
                      label: 'Dashboard',
                      selected: false,
                      onTap: _openDashboard,
                    ),
                    const SizedBox(height: 10),
                  ],
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      itemCount: _tabs.length,
                      padding: EdgeInsets.zero,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final tab = _tabs[index];
                        final selected = _tabController.index == index;

                        return InkWell(
                          borderRadius: BorderRadius.circular(24),
                          onTap: () => _jumpToTab(index),
                          child: Ink(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 17,
                            ),
                            decoration: BoxDecoration(
                              color: selected
                                  ? Colors.white
                                  : Colors.white.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: selected
                                    ? Colors.white
                                    : Colors.white.withValues(alpha: 0.08),
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
                                    tab.icon,
                                    color: selected
                                        ? const Color(0xFF2563EB)
                                        : Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    tab.label,
                                    style: theme.textTheme.titleSmall?.copyWith(
                                      color: selected
                                          ? const Color(0xFF0F172A)
                                          : Colors.white,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  FilledButton.icon(
                    onPressed: patientUser == null ? _openLogin : _openDashboard,
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF0F172A),
                      minimumSize: const Size.fromHeight(52),
                    ),
                    icon: Icon(
                      patientUser == null
                          ? Icons.login_rounded
                          : Icons.dashboard_rounded,
                    ),
                    label: Text(patientUser == null ? 'Login' : 'Dashboard'),
                  ),
                  const SizedBox(height: 12),
                  if (patientUser != null) ...[
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
                    const SizedBox(height: 12),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          const _BackgroundOrb(
            top: -120,
            right: -60,
            size: 260,
            colors: [Color(0x4438BDF8), Color(0x0038BDF8)],
          ),
          const _BackgroundOrb(
            top: 310,
            left: -130,
            size: 300,
            colors: [Color(0x332563EB), Color(0x002563EB)],
          ),
          const _BackgroundOrb(
            bottom: 40,
            right: -90,
            size: 220,
            colors: [Color(0x1A0F172A), Color(0x000F172A)],
          ),
          SafeArea(
            child: Column(
              children: [
                Container(
                  margin: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.90),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x120F172A),
                        blurRadius: 24,
                        offset: Offset(0, 16),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          _TopCircleButton(
                            icon: Icons.menu_rounded,
                            onPressed: () {
                              _scaffoldKey.currentState?.openDrawer();
                            },
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'OmmPhysio World',
                                  style: theme.textTheme.titleLarge?.copyWith(
                                    color: const Color(0xFF0F172A),
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Baripada, Odisha | Dr. Tapaswini Sahu',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: const Color(0xFF64748B),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFF0F172A),
                              Color(0xFF1D4ED8),
                              Color(0xFF38BDF8),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Modern physiotherapy support',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: const Color(0xFFE0F2FE),
                                      letterSpacing: 0.6,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Move better with structured care, better posture, and guided recovery.',
                                    style:
                                        theme.textTheme.titleMedium?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      height: 1.2,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            FilledButton(
                              onPressed: patientUser == null
                                  ? _openLogin
                                  : _pushDashboard,
                              style: FilledButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: const Color(0xFF0F172A),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 18,
                                  vertical: 16,
                                ),
                              ),
                              child: Text(
                                patientUser == null ? 'Login' : 'Dashboard',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      WebsiteHomeTab(
                        key: ValueKey('home-${_tabResetKeys[0]}'),
                      ),
                      WebsiteAboutTab(
                        key: ValueKey('about-${_tabResetKeys[1]}'),
                      ),
                      WebsiteServicesTab(
                        key: ValueKey('services-${_tabResetKeys[2]}'),
                      ),
                      WebsiteCareerTab(
                        key: ValueKey('career-${_tabResetKeys[3]}'),
                      ),
                      WebsiteFaqTab(
                        key: ValueKey('faq-${_tabResetKeys[4]}'),
                      ),
                      PatientChatPanel(
                        key: ValueKey('chat-${_tabResetKeys[5]}'),
                        visitorName: '',
                        visitorContact: '',
                        requireVisitorDetails: true,
                        onContactPressed: _jumpToContact,
                      ),
                      WebsiteContactTab(
                        key: ValueKey('contact-${_tabResetKeys[6]}'),
                      ),
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

class _TopCircleButton extends StatelessWidget {
  const _TopCircleButton({
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
          height: 52,
          width: 52,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Icon(
            icon,
            color: const Color(0xFF0F172A),
          ),
        ),
      ),
    );
  }
}

class _DrawerActionTile extends StatelessWidget {
  const _DrawerActionTile({
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
    final theme = Theme.of(context);

    return InkWell(
      borderRadius: BorderRadius.circular(24),
      onTap: onTap,
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.white.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: selected
                ? Colors.white
                : Colors.white.withValues(alpha: 0.08),
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
                style: theme.textTheme.titleSmall?.copyWith(
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

class _BackgroundOrb extends StatelessWidget {
  const _BackgroundOrb({
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

class _WebsiteTab {
  const _WebsiteTab(this.label, this.icon);

  final String label;
  final IconData icon;
}
