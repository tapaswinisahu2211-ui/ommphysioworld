import 'package:flutter_test/flutter_test.dart';
import 'package:omphysioworld/main.dart';

void main() {
  testWidgets('shows onboarding on first launch', (tester) async {
    await tester.pumpWidget(
      OmmPhysioWorldApp(
        storage: MemoryLaunchStorage(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Welcome to Better Movement'), findsOneWidget);
    expect(find.text('Skip'), findsNWidgets(2));
    expect(find.text('Next'), findsOneWidget);
  });

  testWidgets('goes directly to home after onboarding was seen', (tester) async {
    await tester.pumpWidget(
      OmmPhysioWorldApp(
        storage: MemoryLaunchStorage(hasSeenOnboarding: true),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('OMM Physio World'), findsOneWidget);
    expect(find.text('Book Appointments'), findsOneWidget);
  });
}
