import 'package:flutter/material.dart';

import 'package:omphysioworld/screens/home_screen.dart';
import 'package:omphysioworld/screens/onboarding_screen.dart';
import 'package:omphysioworld/screens/splash_screen.dart';
import 'package:omphysioworld/storage/app_launch_storage.dart';

class OmmPhysioWorldApp extends StatelessWidget {
  const OmmPhysioWorldApp({
    super.key,
    required this.storage,
  });

  final AppLaunchStorage storage;

  @override
  Widget build(BuildContext context) {
    const seed = Color(0xFF38BDF8);
    final colorScheme = ColorScheme.fromSeed(
      seedColor: seed,
      brightness: Brightness.light,
      surface: Colors.white,
    );

    return MaterialApp(
      title: 'OPW',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: colorScheme,
        scaffoldBackgroundColor: const Color(0xFFF5F9FF),
        canvasColor: Colors.white,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          foregroundColor: Color(0xFF0F172A),
          centerTitle: false,
        ),
        textTheme: ThemeData.light().textTheme.apply(
              bodyColor: const Color(0xFF0F172A),
              displayColor: const Color(0xFF0F172A),
            ),
        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 0,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(28),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFFF8FBFF),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 18,
            vertical: 18,
          ),
          hintStyle: const TextStyle(
            color: Color(0xFF94A3B8),
            fontWeight: FontWeight.w500,
          ),
          labelStyle: const TextStyle(
            color: Color(0xFF475569),
            fontWeight: FontWeight.w600,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: const BorderSide(
              color: Color(0xFF38BDF8),
              width: 1.4,
            ),
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            elevation: 0,
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            textStyle: const TextStyle(
              fontWeight: FontWeight.w700,
              letterSpacing: 0.1,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF0F172A),
            side: const BorderSide(color: Color(0xFFCBD5E1)),
            textStyle: const TextStyle(
              fontWeight: FontWeight.w700,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
          ),
        ),
        chipTheme: ChipThemeData(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
          ),
          side: BorderSide.none,
          selectedColor: const Color(0xFFE0F2FE),
          backgroundColor: const Color(0xFFF0F9FF),
          labelStyle: const TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w600,
          ),
        ),
        useMaterial3: true,
      ),
      home: AppEntryPoint(storage: storage),
    );
  }
}

class AppEntryPoint extends StatefulWidget {
  const AppEntryPoint({
    super.key,
    required this.storage,
  });

  final AppLaunchStorage storage;

  @override
  State<AppEntryPoint> createState() => _AppEntryPointState();
}

class _AppEntryPointState extends State<AppEntryPoint> {
  late Future<bool> _shouldShowOnboarding;

  @override
  void initState() {
    super.initState();
    _shouldShowOnboarding = widget.storage.shouldShowOnboarding();
  }

  Future<void> _completeOnboarding() async {
    await widget.storage.setOnboardingSeen();

    if (!mounted) {
      return;
    }

    setState(() {
      _shouldShowOnboarding = Future<bool>.value(false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _shouldShowOnboarding,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const SplashScreen();
        }

        if (snapshot.data!) {
          return OnboardingScreen(
            onFinish: _completeOnboarding,
          );
        }

        return const HomeScreen();
      },
    );
  }
}
