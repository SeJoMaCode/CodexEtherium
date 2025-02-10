import 'package:flutter/material.dart';
import 'pages/database_loader_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CodexEtheriumApp());
}

class CodexEtheriumApp extends StatelessWidget {
  const CodexEtheriumApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Codex Etherium',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const DatabaseLoaderScreen(), // Start with the loader
    );
  }
}
