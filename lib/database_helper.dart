import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

class DatabaseHelper {
  static const String dbUrl = 'https://mtgjson.com/api/v5/AllPrintings.sqlite';

  /// Returns the File object for the local database.
  static Future<File> getLocalDatabaseFile() async {
    final directory = await getApplicationDocumentsDirectory();
    return File('${directory.path}/AllPrintings.sqlite');
  }

  /// Downloads the SQLite file from the server and writes it to the local documents directory.
  static Future<File> downloadSQLiteFile() async {
    final response = await http.get(Uri.parse(dbUrl));
    if (response.statusCode == 200) {
      final localFile = await getLocalDatabaseFile();
      print("Downloading database from server...");
      return localFile.writeAsBytes(response.bodyBytes);
    } else {
      throw Exception('Failed to download SQLite file. Status code: ${response.statusCode}');
    }
  }

  /// Reads the version date from the local database's meta table.
  /// Assumes the table "meta" has a column "date" with a value like "2025-02-09".
  static Future<String?> getDatabaseVersion(Database db) async {
    try {
      final List<Map<String, dynamic>> results = await db.query('meta', limit: 1);
      if (results.isNotEmpty && results[0].containsKey('date')) {
        return results[0]['date'].toString();
      }
    } catch (e) {
      print("Error fetching local database version: $e");
    }
    return null;
  }

  /// Uses a HEAD request to the remote database URL to get the last-modified header.
  /// Parses the remote date and compares it to the localVersion.
  /// Returns true if the remote version is newer.
  static Future<bool> isRemoteVersionNewer(String localVersion) async {
    final response = await http.head(Uri.parse(dbUrl));
    if (response.statusCode != 200) {
      print("HEAD request for remote DB failed with status: ${response.statusCode}");
      return false;
    }

    final lastModifiedHeader = response.headers['last-modified'];
    if (lastModifiedHeader == null) {
      print("No last-modified header found in remote DB response");
      return false;
    }

    // Parse the remote file's Last-Modified header.
    // HttpDate.parse returns a DateTime in UTC.
    DateTime remoteDate = HttpDate.parse(lastModifiedHeader);
    // Create date-only values for comparison.
    DateTime remoteDateOnly = DateTime(remoteDate.year, remoteDate.month, remoteDate.day);
    DateTime localDate = DateTime.parse(localVersion); // local version is in "YYYY-MM-DD" format.
    DateTime localDateOnly = DateTime(localDate.year, localDate.month, localDate.day);

    print("Local date: ${localDateOnly.toIso8601String().substring(0, 10)}, "
          "Remote date: ${remoteDateOnly.toIso8601String().substring(0, 10)}");

    return remoteDateOnly.isAfter(localDateOnly);
  }

  /// Loads the database:
  /// - If no local file exists, downloads it.
  /// - Otherwise, reads the local version.
  /// - Then compares the local version to the remote version using the HEAD request.
  /// - If the remote version is newer, downloads the updated file.
  static Future<Database> loadDatabase() async {
    final localFile = await getLocalDatabaseFile();
    // If the local database file does not exist, download it.
    if (!await localFile.exists()) {
      print("Local DB not found. Downloading initial version.");
      await downloadSQLiteFile();
    }

    Database db = await openDatabase(localFile.path);
    final localVersion = await getDatabaseVersion(db);

    if (localVersion != null) {
      bool updateAvailable = await isRemoteVersionNewer(localVersion);
      if (updateAvailable) {
        print("Remote database is newer than local ($localVersion). Updating local database...");
        await db.close();
        await downloadSQLiteFile();
        db = await openDatabase(localFile.path);
      } else {
        print("Local database is up to date.");
      }
    } else {
      print("Could not determine local database version from meta table. Skipping update check.");
    }

    return db;
  }
}