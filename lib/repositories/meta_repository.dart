import 'package:sqflite/sqflite.dart';
import '../models/meta_model.dart';

class MetaRepository {
  final Database db;

  MetaRepository({required this.db});

  /// Retrieves the single entry from the meta table.
  Future<MetaModel?> getMeta() async {
    final List<Map<String, dynamic>> maps = await db.query('meta', limit: 1);
    if (maps.isNotEmpty) {
      return MetaModel.fromMap(maps.first);
    }
    return null;
  }
}