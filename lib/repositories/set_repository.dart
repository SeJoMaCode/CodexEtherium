import 'package:sqflite/sqflite.dart';
import '../models/set_model.dart';

class SetRepository {
  final Database db;

  SetRepository({required this.db});

  /// Retrieves all sets from the database.
  Future<List<SetModel>> getAllSets() async {
    final List<Map<String, dynamic>> maps = await db.query('sets');
    return maps.map((map) => SetModel.fromMap(map)).toList();
  }

  /// Retrieves a specific set by its code.
  Future<SetModel?> getSetByCode(String code) async {
    final List<Map<String, dynamic>> maps = await db.query(
      'sets',
      where: 'code = ?',
      whereArgs: [code],
    );
    if (maps.isNotEmpty) {
      return SetModel.fromMap(maps.first);
    }
    return null;
  }
}