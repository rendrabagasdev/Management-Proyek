import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:mobile_ukk/routes/routes.dart';
import 'services/firebase_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: 'YOUR-API-KEY-HERE',
      appId: 'YOUR-APP-ID-HERE',
      messagingSenderId: 'YOUR-SENDER-ID-HERE',
      projectId: 'YOUR-PROJECT-ID-HERE',
      databaseURL: 'https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com',
    ),
  );

  // Initialize Firebase service
  await FirebaseService().initialize();

  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(primarySwatch: Colors.amber),
      initialRoute: '/',
      onGenerateRoute: generateRoute,
    );
  }
}
