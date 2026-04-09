import 'package:flutter/material.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({
    super.key,
    required this.onFinish,
  });

  final Future<void> Function() onFinish;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController(viewportFraction: 0.92);

  static const _autoSlideDuration = Duration(seconds: 5);

  late final List<OnboardingItem> _items = [
    const OnboardingItem(
      eyebrow: 'WELCOME TO OPW',
      title: 'Physiotherapy care, made simple.',
      description:
          'Explore OPW, clinic details, and support in a cleaner mobile experience.',
      accentColor: Color(0xFF2563EB),
      icon: Icons.waving_hand_rounded,
      metrics: ['Baripada', 'Guided Care'],
      highlights: [
        'See services, contact details, and live support quickly',
      ],
    ),
    const OnboardingItem(
      eyebrow: 'STAY CONNECTED',
      title: 'Keep your care updates in one place.',
      description:
          'After login, your notes, appointments, sessions, and payments stay together.',
      accentColor: Color(0xFF0EA5E9),
      icon: Icons.folder_shared_rounded,
      metrics: ['Notes', 'Appointments'],
      highlights: [
        'Track OPW notes and recovery progress from your dashboard',
      ],
    ),
    const OnboardingItem(
      eyebrow: 'MOVE FORWARD',
      title: 'Request care and follow recovery easily.',
      description:
          'Book appointments and stay updated without a messy flow.',
      accentColor: Color(0xFF0284C7),
      icon: Icons.directions_run_rounded,
      metrics: ['Easy Requests', 'Secure Access'],
      highlights: [
        'Stay informed with simple updates from OPW',
      ],
    ),
  ];

  int _currentIndex = 0;
  int _autoSlideToken = 0;
  bool _isFinishing = false;

  @override
  void initState() {
    super.initState();
    _startAutoSlide();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoSlide() {
    final token = ++_autoSlideToken;
    Future<void>.delayed(_autoSlideDuration, () async {
      if (!mounted || _isFinishing || token != _autoSlideToken) {
        return;
      }

      if (_currentIndex == _items.length - 1) {
        return;
      }

      await _pageController.nextPage(
        duration: const Duration(milliseconds: 520),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  Future<void> _finishOnboarding() async {
    if (_isFinishing) {
      return;
    }

    setState(() {
      _isFinishing = true;
    });

    await widget.onFinish();
  }

  Future<void> _goPrevious() async {
    if (_currentIndex == 0) {
      return;
    }

    await _pageController.previousPage(
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeOutCubic,
    );
  }

  Future<void> _goNext() async {
    if (_currentIndex == _items.length - 1) {
      await _finishOnboarding();
      return;
    }

    await _pageController.nextPage(
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final item = _items[_currentIndex];
    final theme = Theme.of(context);
    final isLastPage = _currentIndex == _items.length - 1;
    final screenHeight = MediaQuery.of(context).size.height;
    final pageHeight = screenHeight < 700
        ? 430.0
        : screenHeight < 780
            ? 470.0
            : 510.0;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F8FF),
      body: Stack(
        children: [
          Positioned(
            top: -120,
            left: -70,
            child: _GlowOrb(
              size: 260,
              colors: [
                item.accentColor.withValues(alpha: 0.20),
                item.accentColor.withValues(alpha: 0.0),
              ],
            ),
          ),
          const Positioned(
            right: -100,
            bottom: 110,
            child: _GlowOrb(
              size: 300,
              colors: [Color(0x1838BDF8), Color(0x0038BDF8)],
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 24),
              child: Column(
                children: [
                  Row(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.94),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: item.accentColor.withValues(alpha: 0.16),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: item.accentColor.withValues(alpha: 0.10),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              height: 9,
                              width: 9,
                              decoration: BoxDecoration(
                                color: item.accentColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Step ${_currentIndex + 1} of ${_items.length}',
                              style: theme.textTheme.labelLarge?.copyWith(
                                color: const Color(0xFF0F172A),
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: _isFinishing ? null : _finishOnboarding,
                        child: const Text('Skip'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    height: pageHeight,
                    child: PageView.builder(
                      controller: _pageController,
                      itemCount: _items.length,
                      onPageChanged: (index) {
                        setState(() {
                          _currentIndex = index;
                        });
                        _startAutoSlide();
                      },
                      itemBuilder: (context, index) {
                        final pageItem = _items[index];
                        final isActive = index == _currentIndex;

                        return AnimatedScale(
                          duration: const Duration(milliseconds: 280),
                          curve: Curves.easeOutCubic,
                          scale: isActive ? 1 : 0.96,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            child: _OnboardingPageCard(
                              item: pageItem,
                              isActive: isActive,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const Spacer(),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _items.length,
                      (index) {
                        final active = _currentIndex == index;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 260),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          height: 8,
                          width: active ? 34 : 10,
                          decoration: BoxDecoration(
                            color: active
                                ? item.accentColor
                                : const Color(0xFFCBD5E1),
                            borderRadius: BorderRadius.circular(999),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _currentIndex == 0 || _isFinishing
                              ? null
                              : _goPrevious,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: Colors.white.withValues(
                              alpha: 0.86,
                            ),
                            side: BorderSide(
                              color: item.accentColor.withValues(alpha: 0.32),
                            ),
                          ),
                          child: const Text('Back'),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: FilledButton(
                          onPressed: _isFinishing ? null : _goNext,
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: item.accentColor,
                          ),
                          child: Text(isLastPage ? 'Enter OPW' : 'Continue'),
                        ),
                      ),
                    ],
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

class _OnboardingPageCard extends StatelessWidget {
  const _OnboardingPageCard({
    required this.item,
    required this.isActive,
  });

  final OnboardingItem item;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF071224),
            item.accentColor.withValues(alpha: 0.92),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(36),
        boxShadow: [
          BoxShadow(
            color: item.accentColor.withValues(alpha: isActive ? 0.20 : 0.10),
            blurRadius: 34,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(36),
        child: Stack(
          children: [
            Positioned(
              top: -40,
              right: -18,
              child: Container(
                height: 180,
                width: 180,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      Colors.white.withValues(alpha: 0.18),
                      Colors.white.withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -30,
              left: -14,
              child: Container(
                height: 150,
                width: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      Colors.white.withValues(alpha: 0.12),
                      Colors.white.withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 22, 22, 20),
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
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.14),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.14),
                                ),
                              ),
                              child: Text(
                                item.eyebrow,
                                style: theme.textTheme.labelMedium?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.1,
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),
                            TweenAnimationBuilder<double>(
                              tween: Tween<double>(
                                begin: isActive ? 18 : 0,
                                end: 0,
                              ),
                              duration: const Duration(milliseconds: 500),
                              curve: Curves.easeOutCubic,
                              builder: (context, value, child) {
                                return Transform.translate(
                                  offset: Offset(0, value),
                                  child: Opacity(
                                    opacity: isActive ? 1 : 0.82,
                                    child: child,
                                  ),
                                );
                              },
                              child: Text(
                                item.title,
                                style: theme.textTheme.headlineMedium?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  height: 1.05,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 320),
                        curve: Curves.easeOutCubic,
                        height: 74,
                        width: 74,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.96),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.10),
                              blurRadius: 18,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Icon(
                          item.icon,
                          size: 34,
                          color: item.accentColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    item.description,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: const Color(0xFFE2E8F0),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: item.metrics
                        .map(
                          (metric) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.12),
                              ),
                              ),
                              child: Text(
                                metric,
                                style: theme.textTheme.labelLarge?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                  ...item.highlights.asMap().entries.map((entry) {
                    final index = entry.key;
                    final highlight = entry.value;

                    return TweenAnimationBuilder<double>(
                      tween: Tween<double>(
                        begin: isActive ? 24 : 0,
                        end: 0,
                      ),
                      duration: Duration(milliseconds: 420 + (index * 110)),
                      curve: Curves.easeOutCubic,
                      builder: (context, value, child) {
                        return Transform.translate(
                          offset: Offset(0, value),
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: child,
                          ),
                        );
                      },
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.94),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              height: 28,
                              width: 28,
                              decoration: BoxDecoration(
                                color: item.accentColor.withValues(
                                  alpha: 0.12,
                                ),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Icon(
                                Icons.check_rounded,
                                size: 18,
                                color: item.accentColor,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                highlight,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xFF334155),
                                  fontWeight: FontWeight.w700,
                                  height: 1.35,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OnboardingItem {
  const OnboardingItem({
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.accentColor,
    required this.icon,
    required this.metrics,
    required this.highlights,
  });

  final String eyebrow;
  final String title;
  final String description;
  final Color accentColor;
  final IconData icon;
  final List<String> metrics;
  final List<String> highlights;
}

class _GlowOrb extends StatelessWidget {
  const _GlowOrb({
    required this.size,
    required this.colors,
  });

  final double size;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(colors: colors),
        ),
      ),
    );
  }
}
