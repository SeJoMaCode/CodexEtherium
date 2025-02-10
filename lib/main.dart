import 'package:flutter/material.dart';
import 'database_helper.dart';
import 'package:sqflite/sqflite.dart';
import 'pages/home_page.dart'; // Import the updated HomePage

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load the database using your DatabaseHelper.
  final Database db = await DatabaseHelper.loadDatabase();

  runApp(CodexEtheriumApp(database: db));
}

class CodexEtheriumApp extends StatelessWidget {
  final Database database;

  const CodexEtheriumApp({Key? key, required this.database}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Codex Etherium',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: HomePage(database: database), // Use the imported HomePage
    );
  }
}