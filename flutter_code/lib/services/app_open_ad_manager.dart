import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'dart:io';

class AppOpenAdManager {
  // Your real App Open Ad Unit ID
  String adUnitId = Platform.isAndroid
      ? 'ca-app-pub-6776734432817673/7215189380'
      : 'ca-app-pub-6776734432817673/7215189380';

  AppOpenAd? _appOpenAd;
  bool _isShowingAd = false;
  DateTime? _lastAdShowTime;

  /// Load an AppOpenAd.
  void loadAd() {
    AppOpenAd.load(
      adUnitId: adUnitId,
      orientation: AppOpenAd.orientationPortrait,
      request: const AdRequest(),
      adLoadCallback: AppOpenAdLoadCallback(
        onAdLoaded: (ad) {
          print('AppOpenAd loaded');
          _appOpenAd = ad;
        },
        onAdFailedToLoad: (error) {
          print('AppOpenAd failed to load: $error');
          // Handle the error.
        },
      ),
    );
  }

  /// Whether an ad is available to be shown.
  bool get isAdAvailable {
    return _appOpenAd != null;
  }

  /// Shows the ad if one is available and the app is not already showing an ad.
  void showAdIfAvailable() {
    if (!isAdAvailable) {
      print('Tried to show ad before it was available.');
      loadAd();
      return;
    }
    if (_isShowingAd) {
      print('Tried to show ad while already showing an ad.');
      return;
    }

    // Avoid showing ads too frequently (e.g., wait at least 4 hours between ads)
    if (_lastAdShowTime != null &&
        DateTime.now().difference(_lastAdShowTime!).inHours < 4) {
      return;
    }

    _appOpenAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdShowedFullScreenContent: (ad) {
        _isShowingAd = true;
        print('$ad onAdShowedFullScreenContent');
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        print('$ad onAdFailedToShowFullScreenContent: $error');
        _isShowingAd = false;
        ad.dispose();
        _appOpenAd = null;
        loadAd();
      },
      onAdDismissedFullScreenContent: (ad) {
        print('$ad onAdDismissedFullScreenContent');
        _isShowingAd = false;
        ad.dispose();
        _appOpenAd = null;
        _lastAdShowTime = DateTime.now();
        loadAd();
      },
    );

    _appOpenAd!.show();
  }
}
