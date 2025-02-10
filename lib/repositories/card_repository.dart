import 'package:sqflite/sqflite.dart';
import '../models/card_model.dart';

class CardRepository {
  final Database db;

  CardRepository({required this.db});

  /// Retrieves all cards from the database.
  Future<List<CardModel>> getAllCards() async {
    final List<Map<String, dynamic>> maps = await db.query('cards');
    return maps.map((map) => CardModel.fromMap(map)).toList();
  }

  /// Retrieves a single card based on its unique identifier (uuid).
  Future<CardModel?> getCardByUuid(String uuid) async {
    final List<Map<String, dynamic>> maps = await db.query(
      'cards',
      where: 'uuid = ?',
      whereArgs: [uuid],
    );
    if (maps.isNotEmpty) {
      return CardModel.fromMap(maps.first);
    }
    return null;
  }

  /// Retrieves cards for a specified set using the set code.
  Future<List<CardModel>> getCardsBySet(String setCode) async {
    final List<Map<String, dynamic>> maps = await db.query(
      'cards',
      where: 'setCode = ?',
      whereArgs: [setCode],
    );
    return maps.map((map) => CardModel.fromMap(map)).toList();
  }

  // You can add other read-only methods as needed.
}