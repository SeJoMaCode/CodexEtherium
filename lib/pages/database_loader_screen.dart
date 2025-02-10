import 'package:flutter/material.dart';
import 'package:sqflite/sqflite.dart';
import '../database_helper.dart';
import 'home_page.dart';

class DatabaseLoaderScreen extends StatefulWidget {
  const DatabaseLoaderScreen({super.key});

  @override
  _DatabaseLoaderScreenState createState() => _DatabaseLoaderScreenState();
}

class _DatabaseLoaderScreenState extends State<DatabaseLoaderScreen> {
  double progress = 0.0;
  String loadingMessage = "Starting up...";

  @override
  void initState() {
    super.initState();
    _loadDatabaseInBackground();
  }

  Future<void> _loadDatabaseInBackground() async {
    // Update progress as you like. Here we simulate several steps.
    setState(() {
      loadingMessage = "Preparing...";
      progress = 0.2;
    });
    await Future.delayed(const Duration(milliseconds: 500)); // simulation

    // Load or update the database (this also triggers a download if needed)
    setState(() {
      loadingMessage = "Loading data...";
      progress = 0.5;
    });
    Database db = await DatabaseHelper.loadDatabase();

    setState(() {
      loadingMessage = "Finalizing...";
      progress = 0.8;
    });
    await Future.delayed(const Duration(milliseconds: 500)); // additional work

    // Once loaded, update progress to 1.0 and navigate to HomePage.
    setState(() {
      loadingMessage = "Done!";
      progress = 1.0;
    });
    await Future.delayed(const Duration(milliseconds: 300));

    // Navigate to HomePage and pass the loaded database.
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => HomePage(database: db)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Initializing Codex Etherium"),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                loadingMessage,
                style: const TextStyle(fontSize: 18),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              LinearProgressIndicator(value: progress),
            ],
          ),
        ),
      ),
    );
  }
}
