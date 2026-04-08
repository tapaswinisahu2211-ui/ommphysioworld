import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:omphysioworld/app.dart';
import 'package:omphysioworld/storage/app_launch_storage.dart';

export 'package:omphysioworld/app.dart';
export 'package:omphysioworld/storage/app_launch_storage.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final preferences = await SharedPreferences.getInstance();

  runApp(
    OmmPhysioWorldApp(
      storage: SharedPrefsLaunchStorage(preferences),
    ),
  );
}
