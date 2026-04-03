import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'services/ad_service.dart';
import 'services/app_open_ad_manager.dart';
import 'screens/home_screen.dart';

// Global instance for App Open Ad Manager
late AppOpenAdManager appOpenAdManager;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize AdMob SDK
  await MobileAds.instance.initialize();
  
  // Initialize and load App Open Ad
  appOpenAdManager = AppOpenAdManager()..loadAd();
  
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    // Register observer to detect app lifecycle changes (foreground/background)
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Show App Open Ad when app returns to foreground
    if (state == AppLifecycleState.resumed) {
      appOpenAdManager.showAdIfAvailable();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Coin Earn',
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.blue,
      ),
      home: const HomeScreen(),
    );
  }
}
