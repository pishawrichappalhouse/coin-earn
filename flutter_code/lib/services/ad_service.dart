import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'dart:io';

class AdService {
  // Use your real IDs here
  static String get bannerAdUnitId => Platform.isAndroid 
    ? 'ca-app-pub-6776734432817673/7967035834' 
    : 'ca-app-pub-6776734432817673/7967035834'; // Replace with iOS ID if needed

  static initialize() {
    MobileAds.instance.initialize();
  }

  static BannerAd createBannerAd({
    required Function(Ad) onAdLoaded,
    required Function(Ad, LoadAdError) onAdFailedToLoad,
  }) {
    return BannerAd(
      adUnitId: bannerAdUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: onAdLoaded,
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          onAdFailedToLoad(ad, error);
        },
      ),
    );
  }
}
