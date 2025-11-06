import 'package:flutter/material.dart';
import 'package:mobile_ukk/view/splash_page.dart';
import 'package:mobile_ukk/view/login_page.dart';
import 'package:mobile_ukk/view/dashboard_page.dart';
import 'package:mobile_ukk/view/projects_page.dart';
import 'package:mobile_ukk/view/project_detail_page.dart';
import 'package:mobile_ukk/view/card_detail_page.dart';

Route<dynamic> generateRoute(RouteSettings settings) {
  switch (settings.name) {
    case '/':
      return MaterialPageRoute(builder: (_) => const SplashPage());
    case '/login':
      return MaterialPageRoute(builder: (_) => const LoginPage());
    case '/dashboard':
      return MaterialPageRoute(builder: (_) => const DashboardPage());
    case '/projects':
      return MaterialPageRoute(builder: (_) => const ProjectsPage());
    case '/project-detail':
      // ProjectDetailPage gets projectId from settings.arguments
      return MaterialPageRoute(
        builder: (_) => const ProjectDetailPage(),
        settings:
            settings, // Pass settings so ModalRoute.of(context).settings.arguments works
      );
    case '/card-detail':
      // CardDetailPage receives cardId as constructor parameter
      final cardId = settings.arguments as int;
      return MaterialPageRoute(
        builder: (_) => CardDetailPage(cardId: cardId),
        settings: settings,
      );
    default:
      return MaterialPageRoute(
        builder: (_) => Scaffold(
          body: Center(child: Text('No route defined for ${settings.name}')),
        ),
      );
  }
}

// Keep this for backwards compatibility
final Map<String, WidgetBuilder> appRoutes = {
  '/': (context) => const SplashPage(),
  '/login': (context) => const LoginPage(),
  '/dashboard': (context) => const DashboardPage(),
  '/projects': (context) => const ProjectsPage(),
};
